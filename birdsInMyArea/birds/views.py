from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, HttpResponseNotFound
from django.template import loader
from itertools import groupby
from .categories import iconicTaxa
from . import defaults
from django.views.decorators.cache import cache_page
import re
import requests 


def index(request):

	template = loader.get_template("birds/base.html")
	context = {
		'lat': request.COOKIES.get('lat',defaults.lat),
		'lng': request.COOKIES.get('lng',defaults.lng),
		'z': request.COOKIES.get('z',defaults.z),
		'category': request.COOKIES.get('category',defaults.category),
		'category_list': iconicTaxa.keys()
	}

	return HttpResponse(template.render(context,request))

@cache_page(60 * 15)	
def find(request,category=defaults.category,lat = defaults.lat,lng = defaults.lng,zoom = defaults.z):
	template = loader.get_template("birds/base.html")		
	context = {
		"lat": lat,
		"lng": lng,
		"z": zoom,
		"category": category,
		'category_list': iconicTaxa.keys()
	}

	response = HttpResponse(template.render(context,request))

	return response

@cache_page(60 * 15)
def get_obs(request):
	category = request.GET.get("category",defaults.category).lower()
	page = request.GET.get("page",1)
	extent = request.GET.get("extent")
	bbox = extent.split(',')

	payload = {
		'geo': 'true', 
		'photos': 'true', 
		'geoprivacy': 'open',
		'nelat': bbox[3],
		'nelng': bbox[2],
		'swlat': bbox[1],
		'swlng': bbox[0],
		'quality_grade': 'research',
		'iconic_taxa': iconicTaxa.get(category),
		'per_page': 200,
		'page': page
	}

	api_url = "https://api.inaturalist.org/v1/observations"	

	response = requests.get(api_url,params=payload)
	if response.status_code != requests.codes.ok:
		return JsonResponse({})

	total_results = response.json()['total_results']
	obs = response.json()['results']

	obs_by_species = {}


	def key_func(k):
		return k['taxon']['min_species_taxon_id']

	obs = sorted(obs, key=key_func)

	for key,value in groupby(obs, key_func):
		list_of_obs = map(lambda o: {'location': o['geojson']['coordinates'],
			'time_observed_at': o['time_observed_at'] or o['observed_on_string'],
			'uri': o['uri'],
			'observer': o['user']['name'] or o['user']['login'] or 'anonymous',
			'photos': o['observation_photos'][0]['photo']['url'],
			'attribution': o['observation_photos'][0]['photo']['attribution'],
			'name': o['taxon'].get('preferred_common_name',o['taxon'].get('name',category)) } ,list(value))
		obs_by_species[key] = list(list_of_obs)

		
	context = {
		'total_results': total_results,
		'page': page,
		'obs_by_species': obs_by_species
	}

	return JsonResponse(context)


@cache_page(60 * 15)
def side(request):

	extent = request.GET.get("extent")
	category = request.GET.get("category",defaults.category).lower()
	bbox = extent.split(',')

	payload = {
	'geo': 'true', 
	'photos': 'true', 
	'geoprivacy': 'open',
	'nelat': bbox[3],
	'nelng': bbox[2],
	'swlat': bbox[1],
	'swlng': bbox[0],
	'quality_grade': 'research',
	'iconic_taxa': iconicTaxa[category],
	'per_page': 200,
	'page': 1
	}

	api_url = "https://api.inaturalist.org/v1/observations/species_counts"
	response = requests.get(api_url,params=payload)
	if response.status_code != requests.codes.ok:
		return render(request,"birds/side.html",{"bird_list": []})
	
	species = response.json()['results']

	for key,value in enumerate(species):
		species[key]['taxon']['default_photo']['attribution'] = re.sub(r', uploaded by.*','',species[key]['taxon']['default_photo']['attribution'])
		
	context = {
		"bird_list": species,
		"category": category
	}

	return render(request,"birds/side.html",context)

def about(request):
	return render(request,"birds/about.html",{})

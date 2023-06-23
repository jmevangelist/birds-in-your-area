from django.shortcuts import render
from django.http import HttpResponse, JsonResponse, HttpResponseNotFound, FileResponse
from django.template import loader
from itertools import groupby
from .categories import iconicTaxa
from . import defaults
from django.views.decorators.cache import cache_page
import re
from .inat import observations, observation_tiles, UTFGrid, taxa, places


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

	category = request.GET.get("category") #,defaults.category).lower()
	page = request.GET.get("page",1)
	extent = request.GET.get("extent")
	zoom = request.GET.get("zoom")
	obs_id = request.GET.get("id")	

	payload = defaults.payload.copy()

	if extent:
		bbox = extent.split(',')
		payload['nelat'] = bbox[3]
		payload['nelng'] = bbox[2]
		payload['swlat'] = bbox[1]
		payload['swlng'] = bbox[0]

	if category:
		payload['iconic_taxa'] = iconicTaxa.get(category)

	if obs_id:
		payload['id'] = obs_id
	
	payload['page'] = page

	data = observations(payload)

	if not data:
		return JsonResponse({})

	total_results = data['total_results']
	obs = data['results']
	obs_by_species = {}


	def key_func(k):
		return k['taxon']['min_species_taxon_id']

	obs = sorted(obs, key=key_func)
	all_obs = []

	for key,value in groupby(obs, key_func):
		list_of_obs = map(lambda o: { 'id': o['id'],
			'taxon_id': key,
			'location': o['geojson']['coordinates'],
			'time_observed_at': o['time_observed_at'] or o['observed_on_string'],
			'uri': o['uri'],
			'observer': o['user']['name'] or o['user']['login'] or 'anonymous',
			'photos': o['observation_photos'][0]['photo']['url'] if o['observation_photos'] else '',
			'dimensions': o['observation_photos'][0]['photo']['original_dimensions'] if o['observation_photos'] else '',
			'attribution': o['observation_photos'][0]['photo']['attribution'] if o['observation_photos'] else ''
				or o['sounds'][0]['attribution'] if o['sounds'] else '',
			'name': o['taxon'].get('preferred_common_name',o['taxon'].get('name',category)), 
			'species': o['taxon'].get('name',category),
			'description': o['description'] or '',
			'sound': o['sounds'][0]['file_url'] if o['sounds'] else '' }, list(value))
		obs_by_species[key] = list(list_of_obs)
		all_obs.extend(obs_by_species[key])
		
	context = {
		# 'total_results': total_results,
		# 'page': page,
		# 'obs_by_species': obs_by_species,
		'all_obs': all_obs
	}

	return JsonResponse(context)

@cache_page(60*15)
def taxa_search(request,id=''):
	data = taxa(request.GET,[id])

	return JsonResponse(data)

@cache_page(60 * 15)
def species(request):

	extent = request.GET.get("extent")
	category = request.GET.get("category",defaults.category).lower()
	page = request.GET.get("page",1)
	per_page = request.GET.get("per_page",100)

	payload = defaults.payload.copy()

	if extent:
		bbox = extent.split(',')
		payload['nelat'] = bbox[3]
		payload['nelng'] = bbox[2]
		payload['swlat'] = bbox[1]
		payload['swlng'] = bbox[0]

	payload['iconic_taxa'] = iconicTaxa.get(category)
	payload['per_page'] = per_page
	payload['page'] = page 


	data = observations(payload,['species_counts'])

	context = {'category': category}

	if not data:
		context['bird_list'] = {}
	else:
		species = data['results']

		ids = ",".join(map(lambda o: str(o['taxon']['id']), list(species)))
		more_taxon_info = taxa({},[ids])
		place_info = places({'nelat': payload['nelat'],
			'nelng': payload['nelng'],
			'swlat': payload['swlat'],
			'swlng': payload['swlng'],},
			['nearby'])
		if place_info['results']:
			places_list = list(place_info['results'].get('standard')) + list(place_info['results'].get('community'))
			places_id = list(map(lambda p: p['id'] ,places_list))

		conservation = dict(map(lambda o: (o['id'], 
			list(filter(lambda s: s['place']['id'] in places_id if s['place'] else True ,list(o['conservation_statuses']))) 
			if o.get('conservation_statuses') else [] ),list(more_taxon_info['results'])))


		total_obs = 0
		for key,value in enumerate(species):
			if species[key]['taxon']['default_photo']:
				species[key]['taxon']['default_photo']['attribution'] = re.sub(r', uploaded by.*','',species[key]['taxon']['default_photo']['attribution'])
				total_obs += value['count']
			if not species[key]['taxon']['wikipedia_url']:
				species[key]['taxon']['wikipedia_url'] = ''
			if conservation[species[key]['taxon']['id']]:
				species[key]['taxon']['conservation'] = conservation[species[key]['taxon']['id']]

		context['species_count'] = data['total_results']
		context['total_obs'] = total_obs
		context['bird_list'] = species
		context['page'] = page 

	return render(request,"birds/species.html",context)

def about(request):
	return render(request,"birds/about.html",{})

@cache_page(60 * 15)
def obs_tiles(request,z,x,y):

	category = request.GET.get("category",defaults.category).lower()

	payload = defaults.payload.copy()
	payload['iconic_taxa'] = iconicTaxa.get(category)

	ret = observation_tiles(payload,request.path.split('/'))

	return HttpResponse(ret, content_type="image/png")

@cache_page(60 * 15)
def utf_grid(request,z,x,y):
	category = request.GET.get("category",defaults.category).lower()
	extent = request.GET.get("extent")
	
	payload = defaults.payload.copy()
	payload['iconic_taxa'] = iconicTaxa.get(category)
	
	if extent:
		bbox = extent.split(',')
		payload['nelat'] = bbox[3]
		payload['nelng'] = bbox[2]
		payload['swlat'] = bbox[1]
		payload['swlng'] = bbox[0]


	ret = UTFGrid(payload,request.path.split('/'))

	return JsonResponse(ret)

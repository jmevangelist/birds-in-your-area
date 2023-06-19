class GeoLocateControl extends ol.control.Control {

  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '<i class="bi bi-geo-fill"></i>';

	const input = document.createElement('input')
	input.type = 'checkbox'
	input.className = "btn-check"
	input.id = 'btn-check-geolocation'
	const label = document.createElement('label')
	label.innerHTML = '<i class="bi bi-geo-fill"></i>'
	label.className = "btn btn-outline-secondary btn-sm"
	label.setAttribute('for',"btn-check-geolocation")

    const element = document.createElement('div');
    element.className = 'geolocate ol-unselectable ol-control';
    element.appendChild(input)
    element.appendChild(label)

    const geolocationControl = new ol.Geolocation({
	  trackingOptions: {
	    enableHighAccuracy: true,
	  }
	});

    const positionFeatureControl = new ol.Feature();
    const orientationStyle = options.orientationStyle 
    const Style = options.defaultGeoStyle 

    const geoLayer = new ol.layer.Vector({
	  source: new ol.source.Vector({
	    features: [positionFeatureControl],
	  }),
	  style: Style
	});

	window.addEventListener('deviceorientationabsolute',function(){
		Style.setImage(orientationStyle)
	},{once: true})

	const isTracking = {enabled: true} 
	geolocationControl.on('change:tracking', function(){
		if(geolocationControl.getTracking()){
			isTracking.enabled = true 
			if(label.classList.contains('btn-outline-danger')){
				label.classList.replace('btn-outline-danger','btn-outline-primary')
			}
			if(label.classList.contains('btn-outline-secondary')){
				label.classList.replace('btn-outline-secondary','btn-outline-primary')
			}
		}else{
			isTracking.enabled = false
			if(label.classList.contains('btn-outline-primary')){
				label.classList.replace('btn-outline-primary','btn-outline-secondary')
			}
			positionFeatureControl.setStyle(blankStyle);
		}
	})
	
	geolocationControl.on('change:position', function () {
	  const coordinates = geolocationControl.getPosition();
	  positionFeatureControl.setStyle(null)
	  positionFeatureControl.setGeometry(coordinates ? new ol.geom.Point(coordinates) : null);
	});

	geolocationControl.on('error',function(e){
		if(e.code = 1){
			isTracking.enabled = false 
			label.classList.remove('btn-outline-primary')
			label.classList.add('btn-outline-danger')
			positionFeatureControl.setStyle(blankStyle)
		}
	})

    super({
      element: element,
      target: options.target,
    });

	input.addEventListener('change', this.handleGeoLocateControl.bind(this), false)
	window.addEventListener("deviceorientationabsolute", this.handleRotation.bind(this), false)
	geolocationControl.on('change:projection', this.projectionSet.bind(this), false)

	this.geolocation = geolocationControl
	this.geoLayer = geoLayer
	this.orientationStyle = orientationStyle
	this.positionFeature = positionFeatureControl
	this.isTracking = isTracking

  }

  handleGeoLocateControl() {
  	if(this.element.firstChild.checked){
  		this.geoLayer.setMap(this.getMap())
	  	// if(controller){ controller.abort() }
	  	this.geolocation.setTracking(true)
	  	let controlmap = this.getMap()
	  	let geolocation = this.geolocation
	  	this.geolocation.once('change:position', function () {
		  let locWebMerc = geolocation.getPosition()
		  controlmap.getView().animate({center: locWebMerc},{zoom: 17} )
		});
	  }else{
	  	this.geolocation.setTracking(false)
	  	this.positionFeature.setStyle(blankStyle)
	  }

  }

  handleRotation(event){
  	if(this.isTracking.enabled){
	  	let rotation = -(event.alpha * Math.PI/180) - (Math.PI/4)
	  	let viewRotation = this.getMap().getView().getRotation()
		this.orientationStyle.setRotation(rotation+viewRotation)
		this.positionFeature.setStyle(null)
	}
  }

  updateRotation(update){
  	if(this.isTracking.enabled){
	  	let rotation = this.orientationStyle.getRotation()
	  	this.orientationStyle.setRotation(rotation-update)
		this.positionFeature.setStyle(null)
	}
  }

  projectionSet(){
  	let view = this.getMap().getView()
  	let updateRotation = this.updateRotation
  	let viewRotationPrev = 0
	view.on('change:rotation',function(){
		let r = view.getRotation()
		this.updateRotation(viewRotationPrev-r)
		viewRotationPrev = r
	}.bind(this))
  }


}

class searchPlacesControl extends ol.control.Control {
	constructor(opt_options) {
    	const options = opt_options || {};
    	const element = opt_options

    	super({
	      element: element,
	      target: options.target,
	    });

    	this.input = element.querySelector('input')
    	this.button = element.querySelector('button')
    	this.datalist = element.querySelector('datalist')

		this.input.addEventListener('input', this.searchPlaces.bind(this))

		this.input.addEventListener("change", this.selectPlace.bind(this));
		this.button.addEventListener("click", this.selectPlace.bind(this))

	}

	async searchPlaces(){

		if(this.input.value.length <= 2){ return true }

		let searchString = this.input.value

		this.button.children[0].classList.toggle('display-none')
		this.button.children[1].classList.toggle('display-none')

		let url = "https://nominatim.openstreetmap.org/search?format=geojson&q=" + searchString
		const response = await fetch(url)
		if(!response.ok){
			this.button.children[0].classList.toggle('display-none')
			this.button.children[1].classList.toggle('display-none')
			throw new Error('Failed to load: '+ url)
		}

		let places = await response.json()

		if(places.features.length){
			this.input.classList.remove('is-invalid')
		}else{
			this.input.classList.add('is-invalid')
		}

		this.datalist.innerHTML = ""

		for(let i=0; i<places.features.length; i++){
			let o = document.createElement('option')
			o.setAttribute('value',places.features[i].properties.display_name)
			o.setAttribute('data-lat',places.features[i].geometry.coordinates[1])
			o.setAttribute('data-lng',places.features[i].geometry.coordinates[0])
			this.datalist.append(o)
		}
		this.button.children[0].classList.toggle('display-none')
		this.button.children[1].classList.toggle('display-none')

	}

	selectPlace(){
		if(this.datalist.firstChild && this.input.value != ""){
			let dataset = this.datalist.firstChild.dataset
			let coordinate = ol.proj.fromLonLat([dataset.lng,dataset.lat])
	//		if(controller){ controller.abort() }
			this.getMap().getView().animate({zoom: 6},{center: coordinate},{zoom: 13})		
			this.input.value = ""
		}
	}
}

class featureCardOverlay extends ol.Overlay {

	constructor(options){
		super({	
				id: options.id,
				element: options.element,
				offset: options.offset,
				stopEvent: options.stopEvent,
				autoPan: options.autoPan
			})

		this.features = []
		this.withNext = false
		this.currentFeatureIndex = 0
		this.autoFocusKeyID =  options.autoFocusKeyID
		this.autoFocusContainer = options.autoFocusContainer
		this.currentFeatureId = null

		const element = options.element

		this.imgElement = element.querySelector('img')
		this.nameElement = element.querySelector('.obs-name')
		this.attrElement = element.querySelector('.obs-attribution')
		this.descriptionElement = element.querySelector('.obs-description')
		this.nextButton = element.querySelector('.obs-next')
		this.soundElement = element.querySelector('audio')
		this.closeButton = element.querySelector('.btn-close')

		if(this.nextButton){
			this.nextButton.addEventListener('click',this.next.bind(this))
		}
		if(options.stopEvent){
			this.element.addEventListener('pointermove', function(e){
		   		e.stopPropagation();
			})
		}
		if(this.closeButton){
			this.closeButton.addEventListener('click',this.close.bind(this))
		}
	}

	update(feature){
		this.currentFeatureId = feature.get('id')

		if(!feature.get('name')){
			let retrieveMetaData = feature.get('retrieveMetaData')
			if(retrieveMetaData){
				retrieveMetaData(feature.get('id')).then(f =>{
					if(f){
						if(this.currentFeatureId == f.get('id')){
							this.update(f)
						}
					}
				})
			}
		}

		this.imgElement.src = ""
		this.nameElement.innerHTML = feature.get('name') ?? '<div class="spinner-grow spinner-grow-sm" role="status" aria-hidden="true"></div>'+
			'<div class="spinner-grow spinner-grow-sm text-primary" role="status" aria-hidden="true"></div>' +
			'<div class="spinner-grow spinner-grow-sm text-secondary" role="status" aria-hidden="true"></div>'
    	this.descriptionElement.innerHTML = feature.get('description') ?? ''
    	this.descriptionElement.href = feature.get('uri')
    	this.attrElement.innerHTML = feature.get('attribution') ?? "We're throttling requests and heavily caching"

    	if(this.imgElement){
	        if(feature.get('photos')){
				let dimensions = feature.get('dimensions')
				this.imgElement.width = dimensions.width
				this.imgElement.height = dimensions.height
				this.imgElement.style.display = 'inline-block'
		    	this.imgElement.src = feature.get('photos')
			}else{
				this.imgElement.width = 400
				this.imgElement.height = 300
				this.imgElement.src = '/static/birds/placeholder.svg'
			}
		}

		if(this.soundElement){
			if(feature.get('sound')){
	        	this.soundElement.style.display = 'inline-block'
	        	this.soundElement.src = feature.get('sound') 
	        }else{
	        	this.soundElement.style.display = 'None'
	        }
	    }

	    if(this.nextButton){
			if(this.withNext){
		    	this.nextButton.style.visibility = 'visible'
		    }else{
		    	this.nextButton.style.visibility = 'hidden'
		    }
		}


		if(this.autoFocusKeyID){
			let focusElement 
			if(this.autoFocusContainer){
				focusElement = this.autoFocusContainer.getElementById(feature.get(this.autoFocusKeyID))
			}else{
	    		focusElement = document.getElementById(feature.get(this.autoFocusKeyID))
	    	}
	    	if(focusElement){
		    	focusElement.parentNode.scrollTop = focusElement.offsetTop - focusElement.parentNode.offsetTop
		    }
		}
	}

	setFeatures(features){
		this.features = features 
		this.currentFeatureIndex = 0
		if(this.features.length == 1){
			this.withNext = false
    	}else{
    		this.withNext = true 
    	}
    	this.update(features[0])
	}

	next(){
		this.currentFeatureIndex++
		this.currentFeatureIndex = this.currentFeatureIndex % this.features.length
		//this.clearMedia()
		this.update(this.features[this.currentFeatureIndex])
	}

	clearMedia(){
		this.imgElement.src = ''
		this.soundElement.src = ''
	}

	close(){
		this.clearMedia()
		this.setPosition(null)
	}
}

function createFeatures(coords,color){

	let features = []

	for(let i=0;i<coords.length;i++){
		if(coords[i].attribution.indexOf('all rights reserved') >-1){
			coords[i].photos = ''
			coords[i].attribution = ''
		}
		
		let f = new ol.Feature({
			id: coords[i].id,
			geometry: new ol.geom.Point(ol.proj.fromLonLat(coords[i].location)),
			name: coords[i].name,
			color: color,
			datetimeObserved: coords[i].time_observed_at,
			uri: coords[i].uri,
			observer: coords[i].observer,
			photos: coords[i].photos.replace('square','medium'),
			dimensions: coords[i].dimensions,
			attribution: coords[i].attribution,
			taxonId: coords[i].taxon_id,
			sound: coords[i].sound,
			description: '<figure><blockquote class="blockquote text-start"><p>'+coords[i].description+ '</p>'+
				'</blockquote><figcaption class="blockquote-footer text-end">'+
    			coords[i].observer + ', <cite>'+ (new Date(coords[i].time_observed_at)).toDateString() +
    			'</cite></figcaption></figure>'
		});

		features.push(f)
	}

	return features
}

function setPanelListeners(){
	const panel = document.getElementById("species-panel");

	const showAll = panel.querySelector("#showAllCheckBox")

	if(showAll){
		showAll.addEventListener('change',function(){
			cardCheckBoxes = panel.querySelectorAll(".card-check")
			if(this.checked){
				taxonId.forEach((e,i)=>{
					taxonId[i] = true
				})
				cardCheckBoxes.forEach((e,i)=>{
					cardCheckBoxes[i].checked = true
				})
			}else{
				taxonId.forEach((e,i)=>{
					taxonId[i] = false
				})
				cardCheckBoxes.forEach((e,i)=>{
					cardCheckBoxes[i].checked = false
				})
			}
			clusterSource.refresh()
		})
	}

	panel.addEventListener('change',function(e){

		if(e.target.classList.contains("card-check")){
			console.log(e.target.checked,e.target.dataset.taxonId)
			if(e.target.checked){
				taxonId[e.target.dataset.taxonId] = true
				clusterSource.refresh()
			}else{
				taxonId[e.target.dataset.taxonId] = false
				clusterSource.refresh()
			}
		}
	})

	panel.addEventListener(
	  "click",	
	  (event) => {

	  	if(event.target.dataset.type == 'species_card'){

	  		if(event.target.querySelector('.card-check').checked){
				event.target.querySelector('.card-check').checked = false
				taxonId[event.target.dataset.taxonId] = false
				clusterSource.refresh()
			}else{
				event.target.querySelector('.card-check').checked = true
				taxonId[event.target.dataset.taxonId] = true
				clusterSource.refresh()
			}
	  	}
	  },
	  true
	);	
}

async function getObs(url,signal){
	let obs_data = await fetch(url, {signal});
	if (!obs_data.ok){
		throw new Error('Failed to load: ' + url + "\nStatus: " + obs_data.status) 
	}

	let obs = await obs_data.json()

	let features = createFeatures(obs.all_obs,colors[color],key)
	obsSource.addFeatures(features)
	for (var key in obs.obs_by_species){
		taxonId[key] = true
		clusterSource.refresh()
	}
	return true

}

function showToast(species_count,total_obs){
	const toast = document.getElementById('resultsToast')
	const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast,{autohide: true, delay: 10000})
	const toastMessage = document.getElementById('toastMessage')

	let msg = species_count + ' unique species of ' + category + '!'
	if(total_obs > 3000){
		msg = msg + "<br/>Naturalists have been busy here!"
		msg = msg + '<br/>Head over at <a href="https://www.inaturalist.org/" target="_blank">iNaturalist</a> to see more.'
	}else if(total_obs == 0){
		msg = 'Have you seen them? Be a <a href="https://www.inaturalist.org/" target="_blank">Naturalist</a> :)'
	}
	toastMessage.innerHTML = msg
	toastBootstrap.show()
}

async function searchForBirds(category,extent) {

	//get all species
	let url = document.getElementById('species-panel').dataset.link + '?' + new URLSearchParams({
		'extent': extent,
		'category': category
	})

	const response = await fetch(url);

	if(!response.ok){
		throw new Error('Failed to load: ' + url + "\nStatus: " + response.status) 
	}

	var html = await response.text()
	document.getElementById('species-panel').innerHTML = html;
//	setPanelListeners()	

	document.getElementById('species-panel-spinner').style.display = 'none'
	document.getElementById('species-panel').style.display = 'inline-block'
	document.getElementById('species-panel').scrollTop = 0;

	var total_obs = document.getElementById('panelMetaData').dataset.totalObs 
	var species_count = document.getElementById('panelMetaData').dataset.speciesCount  

	showToast(species_count,total_obs)

	document.getElementById('map-spinner').style.display = 'none'
	document.getElementById('search').style.visibility = 'visible'

	return true 
}

async function getObsPointsByExtent(category,extent){
	osmSource.getTileGrid().forEachTileCoord(extent,
		map.getView().getZoom(),
		function(zxy){

		})
}

function pickCategory(cat){
	document.getElementById('categoryPicker').textContent = cat.charAt(0).toUpperCase() + cat.substring(1) + '?'
	category = cat
}

function search() {

	//show spinners
	document.getElementById('species-panel').style.display = 'none'
	document.getElementById('search').style.visibility = 'hidden';

	let allSpinners = document.getElementsByClassName('searching') 
	for(let i=0; i<allSpinners.length; i++){
		allSpinners[i].style.display = 'inline-block'
	}

	document.getElementById('species-panel').innerHTML = ""

	//clear map
	let overlays = map.getOverlays()
	if(overlays.getLength()){overlays.item(0).setPosition(null)}

	if(controller){ controller.abort() }
	controller = new AbortController();
	signal = controller.signal

	//where are you? and how big of an area are you looking at?
	let coord = ol.proj.toLonLat(view.getCenter())
	let zoom = view.getZoom()

	var extent = map.getView().calculateExtent(map.getSize());
	search_extent = extent

	let source_url = heatmap_url + '?category=' + category 
	heatmap_source.setUrl(source_url)
	heatmapLayer.setExtent(extent)
	pseudoLayer.setExtent(extent)

	extent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
	extent = extent.map(x => Math.round((x + Number.EPSILON) * 100000) / 100000)

	coord = coord.map(x => Math.round((x + Number.EPSILON) * 100000)/ 100000)
	zoom = Math.round((zoom + Number.EPSILON) * 100)/100

	//search for birds on your location
	searchForBirds(category,extent).then(r => {
		//successful search: push link to history and set cookies
		url = load_url + '/' + category.toLowerCase() + '/@' + coord[1] + ',' + coord[0] + ',' + zoom + 'z'
		window.history.pushState({'coord': coord, 'zoom': zoom},"", url)
		document.cookie = "lat="+coord[1]+";path=/; SameSite=Strict;" 
		document.cookie = "lng="+coord[0]+";path=/; SameSite=Strict;"
		document.cookie = "z="+zoom + ";path=/; SameSite=Strict;"
		document.cookie = "category=" + category + ";path=/; SameSite=Strict;"
	}).catch(e => {
		//something went wrong or fetch is aborted
		console.log(e)
		document.getElementById('search').style.visibility = 'visible'
		document.getElementById('species-panel-spinner').style.display = 'none'
		document.getElementById('species-panel').style.display = 'inline-block'
		document.getElementById('species-panel').scrollTop = 0;
		document.getElementById('map-spinner').style.display = 'none'
	})


}

function loadMap(lat,long,z,cat) {

	console.log('loading map', lat, long, z, cat )

	if(!lat && !long){
		console.log('setting to default location')
		lat = 0
		long = 0
		z = 15
	}

	if(!z){z = 15}

	view.setZoom(z)
	view.setCenter(ol.proj.fromLonLat([long,lat]))

	category = cat ?? 'birds'

	map.once('loadend',(evt)=>{
		map.addLayer(heatmapLayer)
		map.addLayer(pseudoLayer)
		map.addLayer(obsLayer)
		search()
	})	

}

function obsSourceSetProperties(data){

	if(data.attribution.indexOf('all rights reserved') >-1){
		data.photos = ''
		data.sound = ''
		data.attribution = ''
	}
	
	let prop = {
		name: data.name,
		color: color,
		datetimeObserved: data.time_observed_at,
		uri: data.uri,
		observer: data.observer,
		photos: data.photos.replace('square','medium'),
		dimensions: data.dimensions,
		attribution: data.attribution,
		taxonId: data.taxonId,
		sound: data.sound,
		description: data.description
	}
	let f = obsSource.getFeatureById(data.id)
	if(f){
		f.setProperties(prop)
	}
	return f
}

async function retrieveObsData(id){

	if(obsMetaData[id]){
		return obsSourceSetProperties(obsMetaData[id])
	}else{
		let cache = localStorage.getItem(id)
		if(cache){
			obsMetaData[id] = JSON.parse(cache)
			return obsSourceSetProperties(obsMetaData[id])
		}
	}

	let IDsWithoutMetaData = [id]
	grid[id]['status'] = 'retrieving'
	let zxy = grid[id].zxy
	
	let sortedGrid = Object.values(grid).filter( a => a.zxy == zxy )
		.concat(Object.values(grid).filter( a => a.zxy != zxy ))
		.filter( a => !a.status && !obsMetaData[a.id] && !localStorage.getItem(a.id) )
		.slice(0,199)

	for(let i=0; i<sortedGrid.length; i++){
		grid[sortedGrid[i].id]['status'] = 'retrieving'
		IDsWithoutMetaData.push(sortedGrid[i].id)
	}

	let url = obs_url + '?id=' + IDsWithoutMetaData
	let obs_data = await fetch(url);
	if (!obs_data.ok){
		throw new Error('Failed to load: ' + url + "\nStatus: " + obs_data.status) 
	}

	let obs = await obs_data.json()
	data = obs.all_obs	

	for(let i=0; i<data.length; i++){
		let prop = {
			id: data[i].id,
			name: data[i].name,
			color: color,
			datetimeObserved: data[i].time_observed_at,
			uri: data[i].uri,
			observer: data[i].observer,
			photos: data[i].photos.replace('square','medium'),
			dimensions: data[i].dimensions,
			attribution: data[i].attribution,
			taxonId: data[i].taxon_id,
			sound: data[i].sound,
			description: '<figure><blockquote class="blockquote text-start"><p>'+data[i].description+ '</p>'+
				'</blockquote><figcaption class="blockquote-footer text-end">'+
				data[i].observer + ', <cite>'+ (new Date(data[i].time_observed_at)).toDateString() +
				'</cite></figcaption></figure>'
		}
		obsMetaData[data[i].id] = prop
		try{
			localStorage.setItem(data[i].id,JSON.stringify(prop))
		}
		catch(e){
			console.log(e)
			localStorage.clear()
			localStorage.setItem(data[i].id,JSON.stringify(prop))
		}
	}

	let f = obsSourceSetProperties(obsMetaData[id])

	return f 
}

var controller 	//controller for fetch abort
var signal
var color = 0 	
var category = 'birds'
var obsMetaData = {}
var grid = {}
var search_extent

// MAP
const view = new ol.View({
    center: [0, 0],
    zoom: 15,
    minZoom: 4,
    maxZoom: 21
  })

const osmSource = new ol.source.OSM()
const baseLayer = new ol.layer.Tile({ source: osmSource }) 
// const tileGrid = ol.tilegrid.createXYZ()
const pseudoSource = new ol.source.TileDebug()
const pseudoLayer =  new ol.layer.Tile({ source: pseudoSource, opacity: 0 })

const map = new ol.Map({ 
	controls: ol.control.defaults.defaults({attribution: false}),
	layers: [baseLayer],
	target: 'map',
	view: view
})

//Map Layers
const heatmap_source = new ol.source.XYZ();
const heatmapLayer = new ol.layer.Tile({source: heatmap_source, opacity:0.8 });
const heatmap_url = "/heatmap/{z}/{x}/{y}.png"

// const points_source = new ol.source.XYZ();
// const pointsLayer = new ol.layer.Tile({source: points_source, opacity:1 });
// const points_url = "/points/{z}/{x}/{y}.png"

const obsSource = new ol.source.Vector({})
const taxonId = []
const clusterSource = new ol.source.Cluster({
		attributions: '<a href="https://www.inaturalist.org">iNaturalist</a>',
		distance: 40,
		source: obsSource,
/*		geometryFunction: function(feature){

			if(taxonId[feature.get('taxonId')]){
				return feature.getGeometry()
			}else{
				return null
			}

		} */
	});

const obsLayer = new ol.layer.Vector({source: clusterSource, style: clusterStyle})

//Map overlays
const infoOverlay = new featureCardOverlay({
	element: document.getElementById('obs-info'),
	offset: [5, 5],
	stopEvent: true,
	autoPan: {animation:{duration:100}},
	autoFocusKeyID: 'taxonId'
})

map.addOverlay(infoOverlay)

//Map controls
let controlElements = document.getElementsByClassName("map-control")
for (let i=0; i<controlElements.length; i++){
	map.addControl(new ol.control.Control({element: controlElements[i]}))
}

locationControl = new GeoLocateControl({
	orientationStyle: orientationStyle, 
	defaultGeoStyle: defaultGeoStyle
})
map.addControl(locationControl)
locationControl.geolocation.setProjection(view.getProjection())

map.addControl(new ol.control.Attribution({
	collapsible: true,
	collapsed: true
}))

map.addControl(new searchPlacesControl(document.getElementById('searchPlaces')))

//Map Events
let prevFeatureCluster = null;
function showCards(evt){

	const features = map.forEachFeatureAtPixel(evt.pixel, (feature) => {
		if(feature.get('features')){
			return feature;
		}else{
			return null
		}
	}); 

	if (features) { //feature detected
		if(prevFeatureCluster && prevFeatureCluster != features){
			infoOverlay.clearMedia()
			prevFeatureCluster.setStyle()
		}
		if(prevFeatureCluster != features){
			features.setStyle(highlightIconStyles[category.toLowerCase()]);
			infoOverlay.setFeatures(features.get('features'))
	    	infoOverlay.setPosition(features.getGeometry().getCoordinates())
	     	prevFeatureCluster = features
	    }

  	}else if(prevFeatureCluster && evt.type=='click'){ //no feature on pointer
  		prevFeatureCluster.setStyle()
  		prevFeatureCluster = null
  		infoOverlay.close()
  	}
}

map.on('pointermove', showCards)
map.on('click', showCards)

class MapProgressBar{
	loadingDict = {}

	constructor(options){
		this.loadingText = options.loadingText 
		this.progressBar = options.progressBar
		this.loadingDict = {}
	}

	//resource = { key: key, loading: BOOLEAN }
	update(resource){

		if(this.loadingDict[resource.key]){
			this.loadingDict[resource.key].loading = resource.loading 
		}else{
			this.loadingDict[resource.key] = resource
		}

		if(this.loadingText){
			let newText = Object.values(this.loadingDict).filter(a => a.loading).map(x => x.key)
			this.loadingText.innerText = newText.join('\n')		
		}

		if(this.progressBar){
			this.progressBar.style.visibility = 'visible'
			this.progressBar.parentElement.style.visibility = 'visible'
			this.progressBar.style.width = this.getProgress() + '%'
		}

		if(Object.values(this.loadingDict).filter(a => a.loading).length == 0){
			this.loadingDict = {} 
			if(this.progressBar){
				this.progressBar.style.visibility = 'hidden'
				this.progressBar.parentElement.style.visibility = 'hidden'
			}
		}


	}

	getProgress(){
		let total = Object.values(this.loadingDict).length
		let done = Object.values(this.loadingDict).filter(a => !a.loading).length 
		return ((done/total)*100)
	}

	getPending(){
		return Object.values(this.loadingDict).filter(a => a.loading).map(x => x.key)
	}

}

const cProgress = new MapProgressBar({progressBar : document.getElementById('map-progress-bar')})

function updateProgress(evt){

	switch (evt.type){
		case 'tileloadstart':
			cProgress.update({ loading:true, key: evt.tile.src_  })
			break
		case 'tileloadend':
			cProgress.update({ loading:false, key: evt.tile.src_  })
			break
		default: 
			console.log(evt.type)
	}
}

map.on('loadstart',function(){ cProgress.update({ loading:true, key: 'loading map resources...' }) })
map.on('loadend',function(){cProgress.update({ loading:false, key: 'loading map resources...' }) })
map.on('error',function(e){console.log('MAP ERROR',e)})

heatmap_source.on(['tileloadstart','tileloadend'],updateProgress)
osmSource.on(['tileloadstart','tileloadend'],updateProgress)

heatmap_source.on('tileloaderror',loaderror)
osmSource.on('tileloaderror',loaderror)

function loaderror(e){
	console.log('LOAD ERROR', e)
}

pseudoLayer.on('change:extent',function(e){
	obsSource.clear()
	grid = {}
	text = {}
	pseudoSource.refresh()
})
pseudoSource.on('tileloadstart',loadGridJSON)

async function loadGridJSON(evt){

	let coords = evt.tile.getTileCoord()
	let extent = ol.proj.transformExtent(pseudoLayer.getExtent(), 'EPSG:3857', 'EPSG:4326');

	let url = '/points/'+ coords.join('/') + '.grid.json'
	let newURL = url + '?category=' + category + '&extent=' + extent

	cProgress.update({ loading:true, key: url  })

	let response
	try{
	 	response = await fetch(newURL,{signal})
	}catch(e){
		console.log(e)
		cProgress.update({ loading:false, key: url  })
		return 0
	}
 	if(!response.ok){
 		cProgress.update({ loading:false, key: url  })
 		return 0
 	}

 	let data = await response.json()
	let features = []

	if(!data.data){
		cProgress.update({ loading:false, key: url  })
		return 0
	}

	for(const [key,value] of Object.entries(data.data)){
		if(!grid[key]){
			grid[key] = {
				id: value.id,
				location: [value.longitude,value.latitude],
				zxy: coords.join()
			}
			
			let f = new ol.Feature({
				id: value.id,
				geometry: new ol.geom.Point(ol.proj.fromLonLat([value.longitude,value.latitude])),
				retrieveMetaData: retrieveObsData
			})
			f.setId(value.id)
			features.push(f)
		}
	}
	if(features.length){
		obsSource.addFeatures(features)
		clusterSource.refresh()
	}
	cProgress.update({ loading:false, key: url  })

	return true
}
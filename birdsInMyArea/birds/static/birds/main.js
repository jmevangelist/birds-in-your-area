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
	  },
	  //projection: view.getProjection(),
	});

    const positionFeatureControl = new ol.Feature();

    const orientationStyle = new ol.style.Icon({
	    src: '/static/birds/arrow.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.05,
	    opacity: 1,
	    rotation: -(Math.PI/4)
	})

    const Style = new ol.style.Style({
    	image: new ol.style.Circle({
		      radius: 6,
		      fill: new ol.style.Fill({
		        color: '#3399CC',
		      }),
		      stroke: new ol.style.Stroke({
		        color: '#fff',
		        width: 2,
		      }),
		    }) 
    })

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
	  	if(controller){ controller.abort() }
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

		let url = "https://nominatim.openstreetmap.org/search?format=geojson&q=" + searchString
		const response = await fetch(url)
		if(!response.ok){
			throw new Error('Failed to load: '+ url)
		}

		let places = await response.json()

		if(places.features.length){
			this.input.classList.remove('is-invalid')
		}else{
			this.input.classList.add('is-invalid')
		}

		this.datalist.innerHTML = ""

		let strOptions = ""
		for(let i=0; i<places.features.length; i++){
//			document.createElement('option')
			strOptions = strOptions + "<option value='" +places.features[i].properties.display_name+ "'"
				+ ' data-lat="' +places.features[i].geometry.coordinates[1] + '"'
				+ ' data-lng="' +places.features[i].geometry.coordinates[0] + '">'
		}

		this.datalist.innerHTML = strOptions

	}

	selectPlace(){
		if(this.datalist.firstChild && this.input.value != ""){
			let dataset = this.datalist.firstChild.dataset
			let locWebMerc = ol.proj.fromLonLat([dataset.lng,dataset.lat])
			if(controller){ controller.abort() }
			this.getMap().getView().animate({zoom: 10},{center: locWebMerc},{zoom: 13})		
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

		this.imgElement.src = ""
		this.nameElement.innerHTML = feature.get('name')
    	this.descriptionElement.innerHTML = feature.get('description')
    	this.descriptionElement.href = feature.get('uri')
    	this.attrElement.innerHTML = feature.get('attribution')

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
	let allObs = []

	let features = createFeatures(obs.all_obs,colors[color],key)
	allObs = allObs.concat(features)
	obsSource.addFeatures(features)
	for (var key in obs.obs_by_species){
		taxonId[key] = true
		clusterSource.refresh()
	}
	return true

	//for (var key in obs.obs_by_species){

		// if(!SPECIES_LAYERS[key]){

		// 	let layer = new ol.layer.Vector({})
		// 	map.addLayer(layer)
		// 	let layerIndex = map.getLayers().getLength()-1

		// 	SPECIES_LAYERS[key] = { 'name': obs.obs_by_species[key][0].name,
		// 							'layerIndex':  layerIndex, 
		// 							'color': colors[layerIndex%colors.length],
		// 							'obs': obs.obs_by_species[key] }

		// 	let features = createFeatures( 
		// 		obs.obs_by_species[key], SPECIES_LAYERS[key].color, key)
		// 	let newSource = new ol.source.Vector({features: features})

		// 	let newCluster = new ol.source.Cluster({
		// 			attributions: '<a href="https://www.inaturalist.org">iNaturalist</a>',
		// 			distance: 50,
		// 			source: newSource
		// 		});

		// 	layer.setSource(newCluster)
		// 	layer.setStyle(clusterStyle)

		// 	allObs = allObs.concat(features)

		// }else{
		// 	SPECIES_LAYERS[key].obs.push(...obs.obs_by_species[key])
		// 	let features = createFeatures(
		// 		obs.obs_by_species[key],SPECIES_LAYERS[key].color,key)
		// 	let layerSource = map.getLayers().item(SPECIES_LAYERS[key].layerIndex).getSource().getSource()
		// 	layerSource.addFeatures(features)
		// 	allObs = allObs.concat(features)
		// }
		// if(SPECIES_LAYERS[key]){
		// 	SPECIES_LAYERS[key].push(...obs.obs_by_species[key])
		// }else{
		// 	SPECIES_LAYERS[key] = obs.obs_by_species[key]
		// }
	//}

}

function showToast(species_count,total_obs){
	const toast = document.getElementById('resultsToast')
	const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast,{autohide: true, delay: 10000})
	const toastMessage = document.getElementById('toastMessage')

	let msg = species_count + ' unique species of ' + category + ' in ' + total_obs + ' observations!'
	if(total_obs > 3000){
		msg = msg + "<br/>Naturalists have been busy here!"
		msg = msg + "<br/>We're mapping only 3000 out of the " + total_obs
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

	controller = new AbortController();
	let signal = controller.signal
	const response = await fetch(url, {signal});

	if(!response.ok){
		throw new Error('Failed to load: ' + url + "\nStatus: " + response.status) 
	}

	var html = await response.text()
	document.getElementById('species-panel').innerHTML = html;
	setPanelListeners()	

	document.getElementById('species-panel-spinner').style.display = 'none'
	document.getElementById('species-panel').style.display = 'inline-block'
	document.getElementById('species-panel').scrollTop = 0;

	var total_obs = document.getElementById('panelMetaData').dataset.totalObs 
	var species_count = document.getElementById('panelMetaData').dataset.speciesCount  

	showToast(species_count,total_obs)

	//get observations
	color = Math.floor(Math.random() * colors.length)
	url = obs_url + '?category=' + category + '&extent=' + extent +'&page=' 

	taxonId.length = 0
	styleCache.length = 0
	let getObsArr = []

	for(let page = 1; page<= Math.ceil(total_obs/200) && page<=15 ; page++ ){
		getObsArr.push(getObs(url+page,signal))
	}

	await Promise.all(getObsArr)

	document.getElementById('map-spinner').style.display = 'none'
	document.getElementById('search').style.visibility = 'visible'

	return true 
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
	obsSource.clear()

	//where are you? and how big of an area are you looking at?
	let coord = ol.proj.toLonLat(view.getCenter())
	let zoom = view.getZoom()

	var extent = map.getView().calculateExtent(map.getSize());

	let source_url = heatmap_url + '?category=' + category 
	heatmap_source.setUrl(source_url)
	heatmapLayer.setExtent(extent)

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
	//loads Map and map related elements
	console.log('loading map', lat, long, z, cat )

	if(!lat && !long){
		console.log('setting to default location')
		lat = 14.4915081
		long = 120.9790578
		z = 15
	}
	if(!z){z = 15}

	view.setZoom(z)
	view.setCenter(ol.proj.fromLonLat([long,lat]))

	category = cat ?? 'birds'

	map.setTarget('map')
	map.once('loadend',(evt)=>{
		search()
	})	

}

var controller 	//controller for fetch abort
var color = 0 	
var category = 'birds'

const view = new ol.View({
    center: [0, 0],
    zoom: 15,
    minZoom: 10,
    maxZoom: 22
  })

const heatmap_source = new ol.source.XYZ();
const heatmapLayer = new ol.layer.Tile({source: heatmap_source, opacity:0.8 });
const heatmap_url = "/heatmap/{z}/{x}/{y}.png"
const obsSource = new ol.source.Vector({})

const taxonId = []
const clusterSource = new ol.source.Cluster({
		attributions: '<a href="https://www.inaturalist.org">iNaturalist</a>',
		distance: 40,
		source: obsSource,
		geometryFunction: function(feature){

			if(taxonId[feature.get('taxonId')]){
				return feature.getGeometry()
			}else{
				return null
			}

		}
	});

const obsLayer = new ol.layer.Vector({source: clusterSource, style: clusterStyle})
const osmLayer = new ol.layer.Tile({ source: new ol.source.OSM() }) //, className: 'bw' })

const infoOverlay = new featureCardOverlay({
	element: document.getElementById('obs-info'),
	offset: [5, 5],
	stopEvent: true,
	autoPan: {animation:{duration:100}},
	autoFocusKeyID: 'taxonId'
})

const map = new ol.Map({ controls: ol.control.defaults.defaults({attribution: false}), 
	layers: [osmLayer, heatmapLayer, obsLayer],
	view: view,
	overlays: [infoOverlay]
})

//Map controls

let controlElements = document.getElementsByClassName("map-control")
for (let i=0; i<controlElements.length; i++){
	map.addControl(new ol.control.Control({element: controlElements[i]}))
}

locationControl = new GeoLocateControl()
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
		features.setStyle(highlightIconStyles[category.toLowerCase()]);
		infoOverlay.setFeatures(features.get('features'))
    	infoOverlay.setPosition(features.getGeometry().getCoordinates())
     	prevFeatureCluster = features

  	}else if(prevFeatureCluster && evt.type=='click'){ //no feature on pointer
  		prevFeatureCluster.setStyle()
  		prevFeatureCluster = null
  		infoOverlay.close()
  	}
}

map.on('pointermove', showCards)
map.on('click', showCards)

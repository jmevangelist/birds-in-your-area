const map = new ol.Map({ controls: ol.control.defaults.defaults({attribution: false}) })

var SPECIES_LAYERS = {} 
var category = 'birds'

const view = new ol.View({
    center: [0, 0],
    zoom: 15,
    minZoom: 12,
    maxZoom: 22
  })

const highlightIconStyles = {
	birds: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/crow.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.06,
	    opacity: 1,
	    color: '#000',
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	}),
	amphibians: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/amphibian.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.06,
	    opacity: 1,
	    color: '#000',
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	}),
	fish: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/fish.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.06,
	    opacity: 1,
	    color: '#000',
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	}),
	insects: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/insect.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.06,
	    opacity: 1,
	    color: '#000',
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	}),
	mammals: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/mammal.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.06,
	    opacity: 1,
	    color: '#000',
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	}),
	plants: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/plant.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.06,
	    opacity: 1,
	    color: '#000',
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	}),
	spiders: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/spider.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.06,
	    opacity: 1,
	    color: '#000',
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	}),
	reptiles: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/reptile.svg',
	    crossOrigin: 'anonymous',
	    scale: 1,
	    opacity: 1,
	    color: '#000',
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	}),
	mollusks: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/mollusk.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.10,
	    opacity: 1,
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	}),
	fungi: new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/fungi.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.10,
	    opacity: 1,
	    stroke: new ol.style.Stroke({
	            color: '#fff'
	          }),
	  }),
	})
}

let styleCache = {}

function clusterStyle(feature) {
    const size = feature.get('features').length;
    const color = feature.get('features')[0].get('color')
    let style = styleCache[size.toString() + '_' +  color];
    if (!style) {
      style = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 10,
          stroke: new ol.style.Stroke({
            color: '#fff',
          }),
          fill: new ol.style.Fill({
            color: feature.get('features')[0].get('color') || '#3399CC',
          }),
        }),
        text: new ol.style.Text({
          text: size.toString(),
          fill: new ol.style.Fill({
            color: '#fff',
          }),
        }),
      });
      styleCache[size] = style;
    }
    return style;
}

class CenterToLocControl extends ol.control.Control {

  constructor(opt_options) {
    const options = opt_options || {};

    const button = document.createElement('button');
    button.innerHTML = '<i class="bi bi-geo-fill"></i>';

    const element = document.createElement('div');
    element.className = 'center-to-loc ol-unselectable ol-control';
    element.appendChild(button);

    super({
      element: element,
      target: options.target,
    });

    button.addEventListener('click', this.handleCenterToLoc.bind(this), false);
  }

  handleCenterToLoc() {

    if (navigator.geolocation) {
	    navigator.geolocation.getCurrentPosition(position => {
			let locWebMerc = ol.proj.fromLonLat([position.coords.longitude,position.coords.latitude])
			this.getMap().getView().animate({center: locWebMerc},{zoom: 15})
	    });
	} else {
	    console.log("Geolocation is not supported by this browser.")
	}

  }

}

async function searchPlaces(q){
	let url = "https://nominatim.openstreetmap.org/search?format=geojson&q=" + q 
	const response = await fetch(url)
	if(!response.ok){
		throw new Error('Failed to load: '+ url)
	}


	let places = await response.json()

	let placesOptions = document.querySelector('#placesOptions')
	placesOptions.innerHTML = ""

	let strOptions = ""
	for(let i=0; i<places.features.length; i++){
		strOptions = strOptions + "<option value='" +places.features[i].properties.display_name+ "'"
			+ ' data-lat="' +places.features[i].geometry.coordinates[1] + '"'
			+ ' data-lng="' +places.features[i].geometry.coordinates[0] + '">'
	}

	placesOptions.innerHTML = strOptions

}

function createFeatures(coords,color,taxonId){

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
			attribution: coords[i].attribution,
			taxonId: taxonId,
			description: 'Seen by ' + coords[i].observer + ' on ' 
			+ (new Date(coords[i].time_observed_at)).toDateString()

		});

		features.push(f)
	}

	return features
}

function setPanelListeners(){
	const panel = document.getElementById("side-panel");
	panel.addEventListener(
	  "mouseover",	
	  (event) => {
	  	if(event.target.dataset.type == 'species_card'){

	  		if(SPECIES_LAYERS[event.target.dataset.taxonId]){
		  		let index = SPECIES_LAYERS[event.target.dataset.taxonId].layerIndex

		  		map.getLayers().item(index).setStyle(highlightIconStyles[category.toLowerCase()])
		  		let z = map.getLayers().getLength()
		  		map.getLayers().item(index).setZIndex(z+1)	  	
		  	}	
	  	}
	  },
	  false
	);	
	panel.addEventListener(
		"mouseout",
		(event) => {
			if(event.target.dataset.type == 'species_card'){
				if(SPECIES_LAYERS[event.target.dataset.taxonId]){
					let index = SPECIES_LAYERS[event.target.dataset.taxonId].layerIndex
		  			map.getLayers().item(index).setStyle(clusterStyle)
		  			map.getLayers().item(index).setZIndex(1)	  		
		  		}
	  		}
		},
		false
		)

	let previousCard = null 
	panel.addEventListener(
	  "touchstart",	
	  (event) => {
	  	if(event.target.dataset.type == 'species_card'){

	  		if(previousCard != event.target.dataset.taxonId){

		  		if(SPECIES_LAYERS[event.target.dataset.taxonId]){
			  		let index = SPECIES_LAYERS[event.target.dataset.taxonId].layerIndex

			  		map.getLayers().item(index).setStyle(highlightIconStyles[category.toLowerCase()])
			  		let z = map.getLayers().getLength()
			  		map.getLayers().item(index).setZIndex(z+1)	  	
			  	}

			  	if(previousCard){
			  		let index = SPECIES_LAYERS[previousCard].layerIndex
		  			map.getLayers().item(index).setStyle(clusterStyle)
		  			map.getLayers().item(index).setZIndex(1)	  		
			  	}
			}
			previousCard = 	event.target.dataset.taxonId
	  	}
	  },
	  false
	);	
}

async function getObs(url){
	let obs_data = await fetch(url);
	if (!obs_data.ok){
		throw new Error('Failed to load: ' + url + "\nStatus: " + obs_data.status) 
	}

	let obs = await obs_data.json()

	for (var key in obs.obs_by_species){

		if(!SPECIES_LAYERS[key]){

			SPECIES_LAYERS[key] = { 'name': obs.species_id[key],
									'layerIndex':  map.getLayers().getLength(),
									'color': colors[map.getLayers().getLength()%colors.length] }

			let features = createFeatures( 
				obs.obs_by_species[key], SPECIES_LAYERS[key].color, key)
			let newSource = new ol.source.Vector({features: features})

			let newCluster = new ol.source.Cluster({
					attributions: '<a href="https://www.inaturalist.org">iNaturalist</a>',
					distance: 50,
					source: newSource
				});

			map.addLayer(new ol.layer.Vector({source: newCluster, style: clusterStyle}))

		}else{
			let features = createFeatures(
				obs.obs_by_species[key],SPECIES_LAYERS[key].color,key)
			let layerSource = map.getLayers().item(SPECIES_LAYERS[key].layerIndex).getSource().getSource()
			layerSource.addFeatures(features)
		}
		
	}
	return obs.total_results
}

async function searchForBirds(category,extent) {

	//get all species

	let url = document.getElementById('side-panel').dataset.link + '?' + new URLSearchParams({
		'extent': extent,
		'category': category
	})

	const response = await fetch(url);

	if(!response.ok){
		throw new Error('Failed to load: ' + url + "\nStatus: " + response.status) 
	}

	var html = await response.text()
	document.getElementById('side-panel').innerHTML = html;
	setPanelListeners()	

	document.getElementById('side-panel-spinner').style.display = 'none'
	document.getElementById('side-panel').style.display = 'inline-block'
	document.getElementById('side-panel').scrollTop = 0;

	//get observations
	let page = 1
	url = obs_url + '?category=' + category + '&extent=' + extent +'&page=' 

	let total_results = await getObs(url+page)

	let getObsArr = []
	if(total_results > 200){
		for(page = 2; page<= Math.ceil(total_results/200); page++ ){
			getObsArr.push(getObs(url+page))
		}
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

	let overlays = map.getOverlays()
	if(overlays.getLength()){overlays.item(0).setPosition(null)}

	document.getElementById('side-panel').style.display = 'none'
	document.getElementById('search').style.visibility = 'hidden';

	let allSpinners = document.getElementsByClassName('searching') 
	for(let i=0; i<allSpinners.length; i++){
		allSpinners[i].style.display = 'inline-block'
	}

	document.getElementById('side-panel').innerHTML = ""

	let r = map.getLayers().getLength()-1
	while(r>0){
		map.getLayers().pop()
		r--
	}
	SPECIES_LAYERS = {}

	let coord = ol.proj.toLonLat(view.getCenter())
	let zoom = view.getZoom()

	var extent = map.getView().calculateExtent(map.getSize());
	extent = ol.proj.transformExtent(extent, 'EPSG:3857', 'EPSG:4326');
	extent = extent.map(x => Math.round((x + Number.EPSILON) * 100000) / 100000)

	searchForBirds(category,extent).then(r => {
		url = load_url + '/' + category.toLowerCase() + '/@' + coord[1] + ',' + coord[0] + ',' + zoom + 'z'
		window.history.pushState({'coord': coord, 'zoom': zoom},"", url)
		document.cookie = "lat="+coord[1]+";path=/; SameSite=Strict;" 
		document.cookie = "lng="+coord[0]+";path=/; SameSite=Strict;"
		document.cookie = "z="+zoom + ";path=/; SameSite=Strict;"
		document.cookie = "category=" + category + ";path=/; SameSite=Strict;"
	}).catch(e => {
		console.log(e)
		document.getElementById('search').style.visibility = 'visible'
		document.getElementById('side-panel-spinner').style.display = 'none'
		document.getElementById('side-panel').style.display = 'inline-block'
		document.getElementById('side-panel').scrollTop = 0;
		document.getElementById('map-spinner').style.display = 'none'
	})
}


function loadMap(lat,long,z,cat) {

	console.log('loading map', lat, long, z )

	if(!lat && !long){
		console.log('setting to default location')
		lat = 14.4915081
		long = 120.9790578
		z = 15
	}
	if(!z){z = 15}

	view.setZoom(z)
	view.setCenter(ol.proj.fromLonLat([long,lat]))

	map.setLayers([new ol.layer.Tile({
      				source: new ol.source.OSM() })])

	map.setTarget('map')
	map.setView(view)
	map.addControl(new CenterToLocControl())

	const attribution = new ol.control.Attribution({
		collapsible: true,
		collapsed: true
	})

	map.addControl(attribution)

	const infoElement = document.getElementById('obs-info');
	const imgElement = document.getElementById('obs-img');
	const nameElement = document.getElementById('obs-name');
	const attrElement = document.getElementById('obs-attribution')
	const obsElement = document.getElementById('observer')

	infoElement.addEventListener('pointermove', function(e){
   		e.stopPropagation();
	})

	const infoOverlay = new ol.Overlay({
	  element: infoElement,
	  offset: [5, 5],
	  stopEvent: true,
	});

	map.addOverlay(infoOverlay);

	let pointerOverFeature = null;
	map.on('pointermove', (evt) => {
		const featureOver = map.forEachFeatureAtPixel(evt.pixel, (feature) => {
				return feature;
		}); 

		if (featureOver) { //feature detected
			if(pointerOverFeature && pointerOverFeature != featureOver){
				imgElement.src = ""
				pointerOverFeature.setStyle()
			}
			featureOver.setStyle(highlightIconStyles[category.toLowerCase()]);
			let firstFeature = featureOver.get('features')[0]
        	nameElement.innerHTML = firstFeature.get('name')
        	obsElement.innerHTML = firstFeature.get('description')
        	imgElement.src = firstFeature.get('photos')
        	attrElement.innerHTML = firstFeature.get('attribution')
        	infoOverlay.setPosition(featureOver.getGeometry().getCoordinates())

        	document.getElementById(firstFeature.get('taxonId')).scrollIntoView(
		    		{ behavior: "smooth", block: "center", inline: "nearest" })
        	pointerOverFeature = featureOver

      	}
	}); 

	map.on('click', function(evt) {
	    var feature = map.forEachFeatureAtPixel(evt.pixel,
	      function(feature) {
	        return feature;
	      });
	    if (feature) { //feature detected
			if(pointerOverFeature && pointerOverFeature != feature){
				imgElement.src = ""
				pointerOverFeature.setStyle()
			}
			feature.setStyle(highlightIconStyles[category.toLowerCase()]);
			let firstFeature = feature.get('features')[0]
        	nameElement.innerHTML = firstFeature.get('name')
        	obsElement.innerHTML = firstFeature.get('description')
        	imgElement.src = firstFeature.get('photos')
        	attrElement.innerHTML = firstFeature.get('attribution')
        	infoOverlay.setPosition(feature.getGeometry().getCoordinates())

        	document.getElementById(firstFeature.get('taxonId')).scrollIntoView(
		    		{ behavior: "smooth", block: "center", inline: "nearest" })
        	pointerOverFeature = feature

      	}else if(pointerOverFeature){ //no feature on pointer
      		pointerOverFeature.setStyle()
      		pointerOverFeature = null
      		imgElement.src = ""
      		infoOverlay.setPosition(null)
      	}
	})

	map.on('moveend',(evt)=>{
		if(document.getElementsByClassName('searching')[0].style.display == 'none'){
			document.getElementById('search').style.visibility = 'visible';
		}
	})


	let placeInput = document.querySelector("#placesDataList")
	placeInput.addEventListener("input", (event) => {
		if(event.target.value.length > 2){
			searchPlaces(event.target.value).catch(e=>{
				console.log(e) 
			})
		}
	});

	placeInput.addEventListener("change", (event) => {
		if(event.target.value != ""){
			if(event.target.value == event.target.list.firstChild.value){
				let dataset = event.target.list.firstChild.dataset
				let locWebMerc = ol.proj.fromLonLat([dataset.lng,dataset.lat])
				map.getView().animate({zoom: 12},{center: locWebMerc},{zoom: 15})		
				event.target.value = ""
			}
		}
	});

	category = cat ?? 'birds'

	var init_load = true
	map.on('loadend',(evt)=>{
		if(init_load){
			search()
			init_load = false
		}
	})
}
var SPECIES_LAYERS = {} 

const view = new ol.View({
    center: [0, 0],
    zoom: 15,
    minZoom: 12,
    maxZoom: 19
  })

const iconStyle = new ol.style.Style({
  image: new ol.style.Icon({
    src: '/static/birds/feather.svg',
    crossOrigin: 'anonymous',
    scale: 0.05,
    opacity: 0.9,
    color: '#f9ac44'
  }),
});


const highlightIconStyle = new ol.style.Style({
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
});

let styleCache = {}

clusterStyle = function (feature) {
    const size = feature.get('features').length;
    const color = feature.get('features')[0].get('color')
    let style = styleCache[size + color];
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
  /**
   * @param {Object} [opt_options] Control options.
   */
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
  	console.log('loc')
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

const map = new ol.Map({})

async function searchPlaces(q){
	let url = "https://nominatim.openstreetmap.org/search?format=geojson&q=" + q 
	const response = await fetch(url)
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

async function searchForBirds(coord,zoom,widthInMeters) {
	document.getElementById('side-panel').innerHTML = ""

	document.getElementById('side-panel').style.display = 'none'
	document.getElementById('search').style.visibility = 'hidden';

	let allSpinners = document.getElementsByClassName('searching') 
	for(let i=0; i<allSpinners.length; i++){
		allSpinners[i].style.display = 'inline-block'
	}

	let url = document.getElementById("side") + '?lat=' + coord[1] 
		+ '&lng=' + coord[0] + '&radius=' + widthInMeters/2000 

	console.log(url)
	const response = await fetch(url);

	var html = await response.text()
	document.getElementById('side-panel').innerHTML = html;

	const panel = document.getElementById("side-panel");
	panel.addEventListener(
	  "mouseover",	
	  (event) => {
	  	if(event.target.dataset.type == 'species_card'){

	  		let index = SPECIES_LAYERS[event.target.dataset.taxonId].layerIndex
	  		console.log(SPECIES_LAYERS[event.target.dataset.taxonId])

	  		map.getLayers().item(index).setStyle(highlightIconStyle)
	  		let z = map.getLayers().getLength()
	  		map.getLayers().item(index).setZIndex(z+1)	  		
	  	}
	  },
	  false
	);	
	panel.addEventListener(
		"mouseout",
		(event) => {
			if(event.target.dataset.type == 'species_card'){
				let index = SPECIES_LAYERS[event.target.dataset.taxonId].layerIndex
	  			map.getLayers().item(index).setStyle(clusterStyle)
	  			map.getLayers().item(index).setZIndex(1)	  		
	  		}
		},
		false
		)

	let but = document.getElementById("load")
	url = but.href + '/@' + coord[1] + ',' + coord[0] + ',' + zoom + 'z' + widthInMeters
	window.history.pushState({'coord': coord, 'zoom': zoom},"", url)

	document.getElementById('side-panel-spinner').style.display = 'none'
	document.getElementById('side-panel').style.display = 'inline-block'
	document.getElementById('side-panel').scrollTop = 0;

	let r = map.getLayers().getLength()-1
	while(r>0){
		map.getLayers().pop()
		r--
	}
	SPECIES_LAYERS = {}

	let page = 1
	url = document.getElementById("get_obs") + '?lat=' + coord[1] 
		+ '&lng=' + coord[0] + '&radius=' + widthInMeters/2000 + '&page=' 
	console.log(url)

	let obs 
	do{
		let obs_data = await fetch(url+page);
		obs = await obs_data.json()
		console.log(obs)
		page++

		for (var key in obs.obs_by_species){

			if(!SPECIES_LAYERS[key]){

				SPECIES_LAYERS[key] = { 'name': obs.species_id[key],
										'layerIndex':  map.getLayers().getLength(),
										'color': colors[map.getLayers().getLength()%colors.length] }

				let features = createFeatures(obs.species_id[key], obs.obs_by_species[key], SPECIES_LAYERS[key].color)
				let newSource = new ol.source.Vector({features: features})
				let newCluster = new ol.source.Cluster({
						attributions: 'Bird data from ' + '<a href="https://www.inaturalist.org">iNaturalist</a>',
						distance: 50,
						source: newSource,
					});
				map.addLayer(new ol.layer.Vector({source: newCluster, style: clusterStyle}))

			}else{
				let features = createFeatures(obs.species_id[key],obs.obs_by_species[key],SPECIES_LAYERS[key].color)
				let layerSource = map.getLayers().item(SPECIES_LAYERS[key].layerIndex).getSource().getSource()
				layerSource.addFeatures(features)
			}
			
		}

	}while(obs.total_results > obs.page*200)
	console.log(SPECIES_LAYERS)
	document.getElementById('map-spinner').style.display = 'none'

}

function loadMap(lat,long,z) {

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

	let layers =  [
    			new ol.layer.Tile({
      				source: new ol.source.OSM(),})
  	]

	map.setLayers(layers)
	map.setTarget('map')
	map.setView(view)
	map.addControl(new CenterToLocControl())

	let mapSize = map.getSize()
	let widthInMeters = (((40075016.686*Math.cos(lat*0.0174533))/ (2**z))/256)*mapSize[0]

	const info = document.getElementById('info');
	tooltip = new bootstrap.Tooltip(info,{
	  animation: false,
	  customClass: 'pe-none',
	  offset: [0, 25],
	  title: '-',
	  trigger: 'manual',
	  container: '#map'
	});


	let pointerOverFeature = null;
	map.on('pointermove', (evt) => {
		const featureOver = map.forEachFeatureAtPixel(evt.pixel, (feature) => {
			feature.setStyle(highlightIconStyle);
				return feature;
		}); 
		if(featureOver){
			let pixel = map.getEventPixel(evt.originalEvent);
			info.style.left = pixel[0] + 'px';
		    info.style.top = pixel[1] + 'px';

		    if(featureOver !== pointerOverFeature){
		    	tooltip._config.title = featureOver.values_.features[0].get('name')
		    }
		    if(pointerOverFeature){
		    	tooltip.update()
		    }else{
		    	tooltip.show()
		    	document.getElementById(featureOver.values_.features[0].get('name')).scrollIntoView(
		    		{ behavior: "smooth", block: "center", inline: "nearest" })
		    }
		}else{
			tooltip.hide()
		}
		if (pointerOverFeature && pointerOverFeature != featureOver) {
			pointerOverFeature.setStyle()
		}
		pointerOverFeature = featureOver;
	}); 

	map.on('moveend',(evt)=>{
		if(document.getElementsByClassName('searching')[0].style.display == 'none'){
			document.getElementById('search').style.visibility = 'visible';
		}
	})

	search()

	let placeInput = document.querySelector("#placesDataList")
	placeInput.addEventListener("input", (event) => {
		console.log(event.target.value)
		if(event.target.value.length > 2){
			searchPlaces(event.target.value)
		}
	});

	placeInput.addEventListener("change", (event) => {
		console.log("change",event.target.list.firstChild.dataset)
		if(event.target.value != ""){
			if(event.target.value == event.target.list.firstChild.value){
				let dataset = event.target.list.firstChild.dataset
				let locWebMerc = ol.proj.fromLonLat([dataset.lng,dataset.lat])
				map.getView().animate({zoom: 12},{center: locWebMerc},{zoom: 15})		
				event.target.value = ""
			}
		}
	});
}

function search() {

	let coord = ol.proj.toLonLat(view.getCenter())
	let zoom = view.getZoom()
	let but = document.getElementById("load")

	let mapSize = map.getSize()
	let widthInMeters = (((40075016.686*Math.cos(coord[1]*0.0174533))/ (2**zoom))/256)*mapSize[0]

	searchForBirds(coord,zoom,widthInMeters)
}


function createFeatures(name,coords,color){

	let features = []

	if(coords.length > 0){

		for(let i=0;i<coords.length;i++){
			
			let f = new ol.Feature({
				geometry: new ol.geom.Point(ol.proj.fromLonLat(coords[i].location)),
				name: name,
				color: color,
				datetimeObserved: coords[i].time_observed_at,
				uri: coords[i].uri,
				observer: coords[i].observer,
				photos: coords[i].photos,
				attribution: coords[i].attribution
			});

			features.push(f)
		}
	}

	return features

}


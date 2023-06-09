var colors = [
	"#DB0700",
	"#A300F5",
	"#003FEB"
]

const blankStyle = new ol.style.Style({})

const crow = new ol.style.Style({
	  image: new ol.style.Icon({
	    src: '/static/birds/crow2.svg',
	    crossOrigin: 'anonymous',
	    scale: 0.03,
	    opacity: 1
	  })
	})

const genericStyle = new ol.style.Style({
        image: new ol.style.Circle({
          radius: 10,
          stroke: new ol.style.Stroke({
            color: '#fff',
          }),
          fill: new ol.style.Fill({
            color: '#3399CC',
          }),
        })
      });

const srcRef = {
	birds: '/static/birds/crow2.svg',
	amphibians: '/static/birds/amphibian.svg',
	fish: '/static/birds/fish.svg',
	insects: '/static/birds/insect.svg',
	mammals: '/static/birds/mammal.svg',
	plants: '/static/birds/plant.svg',
	spiders: '/static/birds/spider.svg',
	reptiles: '/static/birds/reptile.svg',
	mollusks: '/static/birds/mollusk.svg',
	fungi: '/static/birds/fungi.svg'
}

const styleCache = []
function clusterStyle(feature) {
	const size = feature.get('features').length
	const index = Math.ceil(Math.log(size))
	if(!styleCache[index]){styleCache[index] = {}}
	if(!styleCache[index][category ?? 'birds']){
		let src = srcRef[category ?? 'birds']
		let scale = (0.04) + ((Math.ceil(Math.log(size)))*0.01)
		if(scale > 0.09){scale = 0.09}
		let style = new ol.style.Style({
			  image: new ol.style.Icon({
			    src: src,
			    crossOrigin: 'anonymous',
			    scale: scale,
			    opacity: 1
			  })
			})
		styleCache[index][category ?? 'birds'] = style
	}

	return styleCache[index][category ?? 'birds']
}

const orientationStyle = new ol.style.Icon({
    src: '/static/birds/arrow.svg',
    crossOrigin: 'anonymous',
    scale: 0.05,
    opacity: 1,
    rotation: -(Math.PI/4)
})

const defaultGeoStyle = new ol.style.Style({
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
	    scale: 0.06,
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


var colors2 = [
'#d98880',
'#f5b041',
'#884ea0',
'#873600',
'#b03a2e',
'#566573',
'#73c6b6',
'#d7bde2',
'#ca6f1e',
'#1abc9c',
'#27ae60',
'#34495e',
'#2c3e50',
'#16a085',
'#117a65',
'#16a085',
'#7d3c98',
'#6c3483',
'#2ecc71',
'#fad7a0',
'#7d6608',
'#d2b4de',
'#48c9b0',
'#7e5109',
'#d4e6f1',
'#d5f5e3',
'#154360',
'#2e86c1',
'#82e0aa',
'#2ecc71',
'#34495e',
'#fdebd0',
'#dc7633',
'#27ae60',
'#1b4f72',
'#1d8348',
'#a9cce3',
// '#f9ebea',
'#f1948a',
'#f5b7b1',
'#8e44ad',
'#7fb3d5',

'#2874a6',
'#229954',
'#2980b9',

'#d6dbdf',
'#85929e',
'#d0ece7',
'#512e5f',
'#52be80',

'#ba4a00',
'#b9770e',

'#9a7d0a',
'#283747',
'#76448a',
'#d4ac0d',
'#abebc6',
'#0e6251',
'#58d68d',
'#784212',
'#f39c12',


'#28b463',
'#fdf2e9',
'#76d7c4',
'#af7ac5',
'#a2d9ce',
'#fef5e7',
'#273746',
'#0e6655',
'#f6ddcc',
'#239b56',
'#f7dc6f',
'#c0392b',
'#d5d8dc',
'#a93226',
'#145a32',
'#f4d03f',
'#196f3d',
'#2e4053',
'#f9e79f',
'#1e8449',
'#f1c40f',
'#5b2c6f',
'#5499c7',
'#1a5276',
'#9b59b6',
'#7dcea0',

'#d4efdf',
'#fbeee6',
'#f8c471',
'#a569bd',
'#4a235a',
'#148f77',
'#6e2c00',
'#c0392b',
'#117864',
'#633974',
'#d68910',
'#b7950b',

'#a04000',
'#138d75',
'#0b5345',
'#f0b27a',

'#3498db',
'#2471a3',
'#5dade2',
'#9c640c',
'#212f3c',
'#943126',
'#9b59b6',
'#78281f',

'#af601a',
'#186a3b',
'#17202a',
'#2980b9',
'#641e16',
'#cd6155',
'#3498db',
'#85c1e9',
'#922b21',

'#d6eaf8',
'#aed6f1',
'#d1f2eb',
'#f39c12',
'#a9dfbf',
'#f5cba7',
'#c39bd3',
'#cb4335',
'#d35400',
'#2c3e50',
'#f2d7d5',
'#7b241c',
'#aeb6bf',
'#212f3d',
'#1f618d',
'#fadbd8',
'#17a589',
'#21618c',
'#45b39d',
'#fdedec',
'#808b96',
'#935116',
'#8e44ad',
'#abb2b9',
'#d35400',
'#1c2833',
'#1b2631',
'#1abc9c',
'#bb8fce',
'#5d6d7e',
'#a3e4d7' ]
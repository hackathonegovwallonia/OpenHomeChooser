$(function() {



var redMarker = L.icon({
    iconUrl: 'img/marker-icon.png',
    iconRetinaUrl: 'img/marker-icon-2x.png',
    shadowUrl: 'img/marker-shadow.png',
    // shadowRetinaUrl: 'my-icon-shadow@2x.png',
	iconSize:    [25, 41],
	iconAnchor:  [12, 41],
	popupAnchor: [1, -34],
	shadowSize:  [41, 41],
});

var duration_cache = {};

function getDuration(m1, m2, mode) {
	
	
	var duration_id = m1.id+'-'+m2.id;
	
		
	if (duration_id in duration_cache) {
		// console.log('cached');
		return true;
	}
	else {
		// console.log('get');
		
		var url = 'http://localhost:8080/otp-rest-servlet/ws/plan?callback=?&fromPlace='+m1.getLatLng().lat+'%2C'+m1.getLatLng().lng+'&toPlace='+m2.getLatLng().lat+'%2C'+m2.getLatLng().lng+'&time=5%3A26pm&date=04-04-2014&mode=CAR&maxWalkDistance=750&arriveBy=false&showIntermediateStops=false&_=1396625181141';
		// var url = 'http://localhost:8080/otp-rest-servlet/ws/plan?callback=?&fromPlace='+m1.getLatLng().lat+'%2C'+m1.getLatLng().lng+'&toPlace='+m2.getLatLng().lat+'%2C'+m2.getLatLng().lng+'&time=5%3A26pm&date=04-04-2014&mode=CAR&maxWalkDistance=750&arriveBy=false&showIntermediateStops=false&_=1396625181141';
		
		loading();
		return $.getJSON(url, function(data) {
			duration_cache[duration_id] = data;
			
			// m2.li.find('span.latlng').text(m2.getLatLng().lat+', '+m2.getLatLng().lng);
			
			done_loading();
		});
	}
}

function process_duration(duration_id, el) {
	if (duration_cache[duration_id].plan != null) {
		el.text(format_seconds(duration_cache[duration_id].plan.itineraries[0].duration));
	}
}

function get_duration(duration_id) {
	if (duration_id in duration_cache && duration_cache[duration_id].plan != null) {
		return duration_cache[duration_id].plan.itineraries[0].duration;
	}
	return null;
}

function format_seconds(seconds) {
	var totalSec = seconds;
	var hours = parseInt( totalSec / 3600 ) % 24;
	var minutes = parseInt( totalSec / 60 ) % 60;
	var seconds = totalSec % 60;

	return (hours < 10 ? "0" + hours : hours) + "h " + (minutes < 10 ? "0" + minutes : minutes) + "m " + (seconds  < 10 ? "0" + seconds : seconds) + 's';
}

function compare_sum(a,b) {
  if (a.sum < b.sum)
     return -1;
  if (a.sum > b.sum)
    return 1;
  return 0;
}

	var load = 0;
	var spinner = $('#loading');
	
	function loading() {
		load++;
		spinner.show();
	}

	function done_loading() {
		load--;
		if(load < 0) load = 0;
		if (load == 0) {
			spinner.hide();
		}
	}
	
	var mode = 'pois'; // 'home' or 'pois'
	var pois = {};
	var homes = [
	{
		id: 1,
		name: 'Andenne',
		lat: 50.48984228951737,
		lng: 5.1038360595703125,
		getLatLng: function() { return this; },
	},
	{
		id: 2,
		name: 'Saint Marc',
		lat: 50.49115283387326,
		lng: 4.8484039306640625,
		getLatLng: function() { return this; },
	},
	];
	
	var ul_pois = $('#poi_list ul');
	var ul_home = $('#home_list ul');
	
	var home_markers = [];
	
	function update_list_pois() {
		loading();
		ul_pois.empty();
		// pois.forEach(function(item) {
			for (id in pois) {
				var item = pois[id];
				
				
				$.getJSON('http://nominatim.openstreetmap.org/reverse?format=json&lat='+item.getLatLng().lat+'&lon='+item.getLatLng().lng+'', function(data) {
					item.name = data.address.road;
					if (data.address.city_district) {
						item.name += ', '+data.address.city_district;
					}
					item.li = $('<li>'+item.name+' <span><input type="checkbox"><input type="checkbox"><input type="checkbox"></span><span class="latlng">'+item.getLatLng().lat+', '+item.getLatLng().lng+'</span></li>');
					item.li.attr('data-poi-id', item.id);
					console.log(item.id);
					// ul_pois.append(item.li);
				});
				
			// var li = $('<li>'+item.id+' ; '+item.getLatLng().lat+' ; '+item.getLatLng().lng+' ➞ <span></span></li>');
			// var m1 = homes[0];
			
			homes.forEach(function(m1) {
				var m2 = item;
				var duration_id = m1.id+'-'+m2.id;
				var dur = getDuration(m1, m2);
				// if (dur === true) {
				// 	process_duration(duration_id, li.find('span'));
				// }
				// else {
				// 
				// 	dur.success(function() {
				// 		// console.log(duration_cache[duration_id]);
				// 		// duration_cache[duration_id].plan.itineraries[0].duration
				// 		process_duration(duration_id, li.find('span'));
				// 		
				// 		// update_homes();
				// 	});
				// }
			});
		}
		
		done_loading();
				
	}
	
	function update_homes() {
		
		loading();
		
		homes.forEach(function(home) {
			
			home.sum = 1;
			
			for (id in pois) {
				poi = pois[id];
				var duration = get_duration(home.id+'-'+poi.id);
				if (duration && home.sum != 0) {
					// console.log(poi.li);
					
					console.log(ul_pois.find('li[data-poi-id="'+id+'"]'));
					
					nb_checked = $('#'+id+' input:checked').length;
					// nb_checked = 1;
					// nb_checked++;
					pond = 1+nb_checked;
					// console.log(nb_checked);
					home.sum += pond*duration;
				}
				else {
					home.sum = 0;
				}
				
			}	
			
			if (home.sum == 1) {
				home.sum = 0;
			}		
			
		});
		
		homes.sort(compare_sum);
		
		ul_home.empty();
		var i = 0;
		home_markers.forEach(function(marker) {
			map.removeLayer(marker);
		});
		
		homes.forEach(function(home) {
			if (home.sum != 0) {
				
			if (i < 20) {
				
				var li = $('<li><span>'+(i+1)+'</span> '+home.name+'</li>');
				ul_home.append(li);
				
				
				marker = L.marker([home.lat, home.lng]);
				marker.setIcon(redMarker);
				
				marker.bindPopup(home.name);
				
				home_markers.push(marker);
				
				li.data('marker', marker);
				
				// li.on('click', function() {
				// 	// console.log($($(this).data('marker')));
				// 	m = $(this).data('marker');
				// 	m.setOpacity(0.5);
				// 	setTimeout(function(m) {
				// 		marker.setOpacity(100);
				// 	}, 1000, m);
				// });
				
				
				marker.addTo(map);
				i++;
			}
		}
		});
		
		done_loading();
		
		return false;
		
	}
	
	$('#refresh').click(update_homes);
	
	var map = L.map('map').setView([50.464, 4.865], 10);

	L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		maxZoom: 18
	}).addTo(map);
	
	var first = true;
	
	function add_poi(e) {
		var marker = L.marker([e.latlng.lat, e.latlng.lng]);
		marker.id = ((new Date()).getTime()).toString(16);
		
		console.log(marker.id);
		
		marker.lat = marker.getLatLng().lat
		marker.lng = marker.getLatLng().lng
		
		pois[marker.id] = marker;
		
		var li = $('<li id="'+marker.id+'">{ poi.name }<br><span><input type="checkbox"><input type="checkbox"><input type="checkbox"></span><span class="latlng">{ latlng.lat }, { latlng.lng }</span></li>');
		
		rivets.bind(li, {
			poi: pois[marker.id],
			latlng: pois[marker.id].getLatLng(),
		});
		
		ul_pois.append(li);
		
		marker.addTo(map);


		$.getJSON('http://nominatim.openstreetmap.org/reverse?format=json&lat='+marker.getLatLng().lat+'&lon='+marker.getLatLng().lng+'', function(data) {
			marker.name = data.address.road;
			if (data.address.city_district) {
				marker.name += ', '+data.address.city_district;
			}
		});
		
		homes.forEach(function(m1) {
			var m2 = marker;
			var duration_id = m1.id+'-'+m2.id;
			var dur = getDuration(m1, m2);
		});
		
		marker.on('click', function(e) {
			delete pois[this.id];
			map.removeLayer(this);
			$('#'+this.id).remove();
		});
		
	}
	
	map.on('click', function(e) {
		loading();
		add_poi(e);
		done_loading();
	});
	
	loading();
	$.getJSON('/homes.json', function(data) {
		homes = data;
		// console.log(data);
		homes.forEach(function(home) {
			home.getLatLng = function() { return this; };
		});
		done_loading();
	});

});

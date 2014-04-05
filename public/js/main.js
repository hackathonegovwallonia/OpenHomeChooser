
var homeMarkerIcon = L.icon({
    iconUrl:       'img/marker-icon.png',
    iconRetinaUrl: 'img/marker-icon-2x.png',
    shadowUrl:     'img/marker-shadow.png',
	iconSize:      [25, 41],
	iconAnchor:    [12, 41],
	popupAnchor:   [1, -34],
	shadowSize:    [41, 41],
});

function compare_sum(a,b) {
	if (a.sum < b.sum) return -1;
	if (a.sum > b.sum) return 1;
	return 0;
}

// function format_seconds(seconds) {
// 	var totalSec = seconds;
// 	var hours = parseInt( totalSec / 3600 ) % 24;
// 	var minutes = parseInt( totalSec / 60 ) % 60;
// 	var seconds = totalSec % 60;
// 
// 	return (hours < 10 ? "0" + hours : hours) + "h " + (minutes < 10 ? "0" + minutes : minutes) + "m " + (seconds  < 10 ? "0" + seconds : seconds) + 's';
// }

$(function() {
	
	var load = 0;
	var load_indicator = $('#loading');
	function loading() {
		load++;
		load_indicator.show();
	}
	function done_loading() {
		load--;
		if (load < 0) load = 0;
		load_indicator.toggle(load != 0);
	}

	var plans = {};
	var pois = {};
	var homes = [];
	var home_markers = {};
	var poi_list = $('#poi_list ul');
	var home_list = $('#home_list ul');

	function getPlan(m1, m2) {
		var plan_id = m1.id+'-'+m2.id;
		if (plan_id in plans) {
			return;
		}

		var url = 'http://localhost:8080/otp-rest-servlet/ws/plan?callback=?&fromPlace='+m1.getLatLng().lat+'%2C'+m1.getLatLng().lng+'&toPlace='+m2.getLatLng().lat+'%2C'+m2.getLatLng().lng+'&time=5%3A26pm&date=04-04-2014&mode=CAR&maxWalkDistance=750&arriveBy=false&showIntermediateStops=false&_=1396625181141';
		loading();
		return $.getJSON(url, function(data) {
			plans[plan_id] = data;
			done_loading();
		});
	}
	
	function get_duration(plan_id) {
		if (plan_id in plans && plans[plan_id].plan != null) {
			return plans[plan_id].plan.itineraries[0].duration;
		}
		return null;
	}
	
	function add_poi(lat, lng, name) {
		
		var marker = L.marker([lat, lng]);
		marker.id = ((new Date()).getTime()).toString(16);		
		pois[marker.id] = marker;
		marker.addTo(map);
		
		var li = $('<li id="'+marker.id+'">{ poi.name }<br><span><input type="checkbox"><input type="checkbox"><input type="checkbox"></span><span class="latlng">'+marker.getLatLng().lat+', '+marker.getLatLng().lng+'</span><a href="#">x</a></li>');
		rivets.bind(li, {
			poi: pois[marker.id],
		});
		li.find('input').change(function() {
			refresh_homes();
		});
		li.hover(function() {
			pois[this.id].openPopup();
		}, function() {
			pois[this.id].closePopup();
		});
		li.find('a').click(function() {
			remove_marker(pois[$(this).parent().attr('id')]);
			return false;
		});
		poi_list.append(li);
		
		var promises = [];
		
		if (name === undefined) {
			loading();
			promises.push($.getJSON('http://nominatim.openstreetmap.org/reverse?format=json&lat='+marker.getLatLng().lat+'&lon='+marker.getLatLng().lng+'', function(data) {
				if (data.address.road) {
					marker.name = data.address.road;
					if (data.address.city_district) {
						marker.name += ', '+data.address.city_district;
					}
				}
				else {
					marker.name = 'Nom inconnu';
				}
				marker.bindPopup(marker.name);
				done_loading();
			}));
		}
		else {
			marker.name = name;
			marker.bindPopup(marker.name);
		}
		
		homes.forEach(function(home) {
			promises.push(getPlan(home, marker));
		});
		$.when.apply($, promises).done(function() {
			refresh_homes();
		});
		
		marker.on('click', function(e) {
			remove_marker(this);
		});
	}
	
	function remove_marker(marker) {
		delete pois[marker.id];
		map.removeLayer(marker);
		$('#'+marker.id).remove();
		refresh_homes();
	}
	
	function refresh_homes() {
		loading();
		homes.forEach(function(home) {
			home.sum = 0;
			for (id in pois) {
				var poi = pois[id];
				var duration = get_duration(home.id+'-'+poi.id);
				if (duration && home.sum >= 0) {
					pond = 1 + $('#'+id+' input:checked').length;
					home.sum += pond * duration;
				}
				else {
					home.sum = -1;
				}
			}	
		});
		
		homes.sort(compare_sum);
		
		home_list.empty();
		for (id in home_markers) {
			map.removeLayer(home_markers[id]);
		}
		
		var i = 0;
		homes.forEach(function(home) {
			if (home.sum > 0 && i < 20) {
				marker = L.marker([home.lat, home.lng]);
				marker.id = ((new Date()).getTime()).toString(16) + i;		
				marker.setIcon(homeMarkerIcon);
				marker.bindPopup(home.name);
				var li = $('<li id="'+marker.id+'"><span>'+(i+1)+'</span> '+home.name+'</li>');
				home_list.append(li);
				home_markers[marker.id] = marker;
				marker.addTo(map);
				// li.data('marker', marker);
				
				li.hover(function() {
					home_markers[this.id].openPopup();
				}, function() {
					home_markers[this.id].closePopup();
				});
				
				i++;
			}
		});
		
		done_loading();
		return false;
	}
	
	$('#refresh').click(refresh_homes);

	var map = L.map('map').setView([50.464, 4.865], 10);

	L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		maxZoom: 18
	}).addTo(map);
	
	map.on('click', function(e) {
		loading();
		add_poi(e.latlng.lat, e.latlng.lng);
		done_loading();
	});
	
	loading();
	$.getJSON('/homes.json', function(data) {
		homes = data;
		homes.forEach(function(home) {
			home.getLatLng = function() { return this; };
		});
		done_loading();
	});
	
	
	$('#autocomplete').autocomplete({
	    serviceUrl: '/backend/autocomplete.php',
	    onSelect: function (suggestion) {
			loading();
	        add_poi(suggestion.data.lat, suggestion.data.lng, suggestion.value);
			$('#autocomplete').val('');
			done_loading();
	    }
	});

});

var redMarker = L.icon({
    iconUrl: 'img/marker-icon-green.png',
    // iconRetinaUrl: 'my-icon@2x.png',
    iconSize: [25, 41],
    iconAnchor: [22, 41],
    popupAnchor: [-3, -76],
    shadowUrl: 'img/shadow.png',
    // shadowRetinaUrl: 'my-icon-shadow@2x.png',
    shadowSize: [41, 41],
    shadowAnchor: [22, 41]
});

$(function() {
	
	var mode = 'poi'; // 'home' or 'poi'
	var poi = [];
	var home = [];
	
	var ul_poi = $('#poi_list ul');
	var ul_home = $('#home_list ul');
	
	function update_list_poi() {
		ul_poi.empty();
		poi.forEach(function(item) {
			ul_poi.append('<li>'+item.getLatLng().lat+' ; '+item.getLatLng().lng+'</li>')
		});
	}
	
	var map = L.map('map').setView([50.464, 4.865], 13);

	L.tileLayer('http://otile1.mqcdn.com/tiles/1.0.0/map/{z}/{x}/{y}.jpg', {
		attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>',
		maxZoom: 18
	}).addTo(map);
	
	var first = true;
	
	map.on('click', function(e) {
	    console.log(e.latlng);
		marker = L.marker([e.latlng.lat, e.latlng.lng]);
		if (first) {
			marker.setIcon(redMarker);
			first = false;
			home.push(marker);
		}
		else {
			poi.push(marker);
		}
		update_list_poi();
		marker.addTo(map);
		marker.on('click', function(e) {
			// this.setIcon(redMarker);
			map.removeLayer(this);
		});
	});

});

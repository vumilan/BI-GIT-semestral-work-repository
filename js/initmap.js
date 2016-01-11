function initMap(){
    var mapOptions = {
        center: new google.maps.LatLng(20, -40),
        zoom: 1,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
    marker = new google.maps.Marker({map: map, draggable: true});
    
    google.maps.event.addListener(map, 'click', function(e){
        marker.setPosition(e.latLng);
        marker.setMap(map);
        updateCoords(e.latLng);
    });
    
    google.maps.event.addListener(marker, 'dragend', function(){
        updateCoords(marker.getPosition());    
    });
}

function updateCoords(latLng){
    $('#gpsLatInput').val(latLng.lat());
    $('#gpsLonInput').val(latLng.lng());
}

function clearGPS(){
    marker.setMap(null);
    $('#gpsLatInput').val("");
    $('#gpsLonInput').val("");
}

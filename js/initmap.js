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
    
    geocoder = new google.maps.Geocoder();
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

$(document).ready(function(){
    $("#zoomToSubmit").click(codeAddress);
    $("#zoomTo").keydown(function(event){
        if(event.keyCode == 13){
            event.preventDefault(); 
            codeAddress();
        }
    });
});

function codeAddress() {
    var address = document.getElementById('zoomTo').value;
    geocoder.geocode( { 'address': address}, function(results, status) {
        if (status == google.maps.GeocoderStatus.OK) {
            map.setCenter(results[0].geometry.location);
            map.setZoom(8);
        } else {
            alert('Geocode was not successful for the following reason: ' + status);
        }
    });
}

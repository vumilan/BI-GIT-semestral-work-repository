function initMap(){
    var mapOptions = {
        center: new google.maps.LatLng(20, -40),
        zoom: 1,
        mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    map = new google.maps.Map(document.getElementById("map_canvas"), mapOptions);
}

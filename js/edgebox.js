/**
 * EdgeBox script
 */

/** Include script for map handling */
$("head").append('<script async defer src="https://maps.googleapis.com/maps/api/js?key='+GOOGLE_API_KEY+'&callback=initMap"></script>');

/** Prepare document actions and store important elements */
$(document).ready(function(){
    messenger = $("#messenger");
    message = $("#message"); 
    main_container = $("#sorted");
    gps_container = $("#byGPS");
    
    $("#tabs").tabs();

    // onclick event 
    $("#querySubmit").click(searchHandler);
    
    // on ENTER press down event
    $("#queryInput, #countInput").keydown( function(event){
        if(event.keyCode == 13){
            event.preventDefault(); 
            searchHandler();
        }
    });

});

/**
 * Search for images by keywords in #queryInput
 */
function searchHandler(){
    changeLayout();
    messenger.hide();
    main_container.children().remove();
    gps_container.children().remove();
    $("#gContainer").hide();
    
    var query = $("#queryInput").val();
    var number_of_pictures = $("#countInput").val();
    
    var geo_force;
    if($("#gpsForceInput").is(':checked')){
        geo_force = 1;
    }
            
    $.ajax({
        type: 'GET',
        url: "https://api.flickr.com/services/rest/?method=flickr.photos.search&jsoncallback=?",
        dataType: 'json',
        async: false,
        data: {
            api_key: FLICKR_API_KEY,
            per_page: number_of_pictures,
            page: 1,
            tags: query,
            has_geo: geo_force,
            tagmode: "all", //"any"
            format: "json"},
        success: function(data){processData(data)}
    });
}

/**
 * Change layout of page to two columns
 */
function changeLayout(){
    $("#query").css('float','left');
    $("#results").css('display','block');
    $("h1").css('background-image',"url('css/images/edgebox_s.png')");
    $("h1").css('width',220);
    $("h1").css('height',145);
}

/**
 * Flickr data processing
 * @param {json} data - JSON encoded data returned from Flickr
 */
function processData(data){
    // Connection Error
    if (data.stat != "ok"){
        message.text("Server connection lost.");
		    messenger.show();
        return; 
    }

    // Nothing Found
	  if(data.photos.photo.length == 0){
		    message.text("Sorry. No results, try again.");
		    messenger.show();
		    return;
	  }
	  
	  var selected_size = $("input:radio[name='group1']:checked").val();

    for (index = 0; index < data.photos.photo.length; index++){
        photo = data.photos.photo[index];
        main_container.append('<a href="https://www.flickr.com/photos/'+photo['owner']+'/'+photo['id']+'" class="'+photo['id']+'" title="'+photo['title']+'" target="_blank"><img /></a>');
        
        getImageThumbnail(photo.id, selected_size);
        
        if($("#gpsLatInput").val().length > 0 && $("#gpsLonInput").val().length > 0){
            $("#gContainer").show();
            sortImageLocation(photo.id);
        }
    }
}

/**
 * Get Flickr thumbnail
 * Separate API call is needed to get the URL of the image thumbnail
 * @param {string} id         - ID of the picture
 * @param {int} selected_size - Selected size of the thumbnails
 */
function getImageThumbnail(id, selected_size){
    $.getJSON("https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&jsoncallback=?",
    {
        api_key: FLICKR_API_KEY,
        photo_id: id,
        format: "json"
    },
    function(id){
        return function(image){
            $('.'+id+' img').attr('src',image.sizes.size[selected_size].source);
        }
    }(id));
}

/**
 * Sort images by geological information (distance from given point)
 * Separate API call is needed to get the location
 * @param {string} id - ID of the picture
 */
function sortImageLocation(id){
    $.getJSON("https://api.flickr.com/services/rest/?method=flickr.photos.geo.getLocation&jsoncallback=?",
    {
        api_key: FLICKR_API_KEY,
        photo_id: id,
        format: "json"
    },
    function(id) {
        return function(geo){
            if (geo.stat != "ok"){
                console.log("NO GEO DATA AVAIABLE");
                return;
            }
            lat = parseFloat($("#gpsLatInput").val());
            lon = parseFloat($("#gpsLonInput").val());
            var score = getGreatCircleDistance(toRad(lat), toRad(lon), toRad(geo.photo.location.latitude), toRad(geo.photo.location.longitude));
            $('.'+id).attr("gps", score);
            copyToContainer(gps_container, id);
            sortContainer(gps_container, "gps", gps_container.children("."+id), score, false);
        }
    }(id));
}

/**
 * Copy image to another container
 * @param {string} container - Name of the container where to copy to
 * @param {string} id        - ID of the picture
 */
function copyToContainer(container, id){
    main_container.children("." + id).clone().appendTo(container);
}

/**
 * Returns distance in meters between two points on globe
 * source: http://en.wikipedia.org/wiki/Great-circle_distance
 * source2: http://www.movable-type.co.uk/scripts/latlong.html
 * @param s_lat - start latitude in radians
 * @param s_lon - start longitude in radians
 * @param d_lat - destination latitude in radians
 * @param d_lon - destination longitude in radians
 * TODO - delta calculation implemented is not optimal yet faster viz.: sources
 */
function getGreatCircleDistance(s_lat, s_lon, d_lat, d_lon){
    r = 6371009; 
    
    delta = Math.acos(Math.sin(s_lat)*Math.sin(d_lat) + 
            Math.cos(s_lat)*Math.cos(d_lat) *
            Math.cos(d_lon - s_lon));
              
    return (r*delta); 
}

/**
 * Returns radians from degree value
 * @param degrees 
 */
function toRad(degrees){
    return degrees * (Math.PI/180);
}

/**
 * Sorts children of given element according to value
 * @param container - jQuery element to sort in
 * @param tag       - Attribute for sorting
 * @param element   - JQuery element inside container to be sorted
 * @param score     - Value to sort against
 */
function sortContainer(container, tag, element, score, descending){
    container.children().each(function(){
        
        if (descending){
            if (parseFloat($(this).attr(tag)) < parseFloat(score)){
                $(this).before(element.detach());
                return false; //break;
            }
        } else {
            if (parseFloat($(this).attr(tag)) > parseFloat(score)){
                $(this).before(element.detach());
                return false; //break;
            }
        }                                 
        return true; //continue;
                                                
    });
}


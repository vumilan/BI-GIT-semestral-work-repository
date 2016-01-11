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
    author_container = $( "#byAuthor" );
    gps_container = $("#byGPS");
    date_container = $("#byDate");
    
    $("#tabs").tabs();

    // onclick event 
    $("#querySubmit").click(searchHandler);
    
    // on ENTER press down event
    $("#queryInput, #countInput, #authorInput, #dateInput").keydown( function(event){
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
    author_container.children().remove();
    $("#aContainer").hide();
    gps_container.children().remove();
    $("#gContainer").hide();
    date_container.children().remove();
    $("#dContainer").hide();
    
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
        
        if($("#authorInput").val().length > 0){
            $("#aContainer").show();
            sortImageAuthor(photo.id, photo.owner);
        }
        
        if($("#gpsLatInput").val().length > 0 && $("#gpsLonInput").val().length > 0){
            $("#gContainer").show();
            sortImageLocation(photo.id);
        }
        
        if($("#dateInput").is(':checked')){
            $("#dContainer").show();
            sortImageDate(photo.id);
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
 * Sort images by geological information (distance from given point)
 * Separate API call is needed to get the location
 * @param {string} id    - ID of the picture
 * @param {string} owner - ID of the user, for more information
 */
function sortImageAuthor(id, owner){
    $.getJSON("https://api.flickr.com/services/rest/?method=flickr.people.getInfo&jsoncallback=?",
    {
        api_key: FLICKR_API_KEY,
        user_id: owner,
        format: "json"
    },
    function(id){
        return function(user){
            name = $("#authorInput").val();
            username = 500;
            realname = 500; //inicialization with crazy high value 

            if ('username' in user.person){                             
                username = getEditDistance(name, user.person.username._content);
            }

            if ('realname' in user.person){
                realname = getEditDistance(name, user.person.realname._content);
            }

            //save score
            score = Math.min(username, realname);
            $('.'+id).attr("user", score);
            copyToContainer(author_container, id);
            sortContainer(author_container, "user", author_container.children('.'+id), score, false);
        }
    }(id));
}

/**
 * Sort images by date
 * Separate API call is also needed to get information on the photo
 * @param {string} id - ID of the picture
 */
function sortImageDate(id){
    $.getJSON( "https://api.flickr.com/services/rest/?method=flickr.photos.getInfo&jsoncallback=?",
    {
        api_key: FLICKR_API_KEY,
        photo_id: id,
        format: "json"
    },
    function(id) {
        return function(info){
            if (info.stat != "ok"){
                console.log("NO INFO DATA AVAIABLE");
                return;
            }
            date = parseDate(info.photo.dates.taken);
            score = (date.getTime()); //vzdalenot od dneska
            $('.'+id).attr("date", score);
            copyToContainer(date_container, id);
            sortContainer(date_container, "date", date_container.children("."+id), score, true);
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

/**
 * Returns edit distance of two strings
 */
function getEditDistance(string1, string2){

    var dist = 0; 
    var a1 = string1.toLowerCase().split("");
    var a2 = string2.toLowerCase().split("");
    var smaller = a2;
        
    if (a1.length < a2.length){
        dist += a2.length - a1.length;
        smaller = a1;
    } else {
        dist += a1.length - a2.length; 
    }
        
    for (index in smaller){
        if(a1[index] != a2[index]){
            dist++;
        }
    }

    return dist; 
}

/** Parse a date in Flickr format */
//TODO does this even work?
function parseDate(input) {
    var parts = input.match(/(\d+)/g);
    return new Date(parts[0], parts[1]-1, parts[2], parts[3], parts[4], parts[5]); // months are 0-based
}


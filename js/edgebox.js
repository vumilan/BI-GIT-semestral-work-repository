/**
 * EdgeBox script
 */

/*
 * Entry point
 */
$(document).ready(function(){
    messenger = $("#messenger");
    message = $("#message"); 
    main_container = $("#sorted");
    
    var searchHandler = function(){
        changeLayout();
		    messenger.hide();
        main_container.children().remove(); 
        
        var query = $("#queryInput").val(); 
                
        $.ajax({
            type: 'GET',
            url: "https://api.flickr.com/services/rest/?method=flickr.photos.search&jsoncallback=?",
            dataType: 'json',
            async: false,
            data: {
                api_key: FLICKR_API_KEY,
                per_page: 50,
                page: 1,
                tags: query,
                tagmode: "all", //"any"
                format: "json"},
            success: function(data){processData(data)}
        });
    }

    // onclick event 
    $("#querySubmit").click(searchHandler);
    
    // on ENTER press down event
    $("#queryInput").keydown( function(event){
        if(event.keyCode == 13){
            event.preventDefault(); 
            searchHandler();
        }
    });

});

/*
 * Change layout of page
 */
function changeLayout(){
    $("#query").css('float','left');
    $("#results").css('display','block');
    $("h1").css('background-image',"url('css/images/edgebox_s.png')");
    $("h1").css('width',220);
    $("h1").css('height',145);
}

/*
 * Flickr data processing
 */
function processData(data){
    // Show CONNECTION ERROR signal, connection to server possibly interrupted
    if (data.stat != "ok"){
        message.text("Server connection lost.");
		    messenger.show();
        return; 
    }

    //show NOTHING FOUND signal if search come up empty
	  if(data.photos.photo.length == 0){
		    message.text("Sorry. No results, try again.");
		    messenger.show();
		    return;
	  }

    for (index = 0; index < data.photos.photo.length; index++){
        photo = data.photos.photo[index];
        main_container.append('<a href="https://www.flickr.com/photos/'+photo['owner']+'/'+photo['id']+'" class="'+photo['id']+'" title="'+photo['title']+'" target="_blank"><img /></a>');
        
        getImageThumbnail(photo.id);
    }
}

/*
 * Get FLicker thumbnail
 */
function getImageThumbnail(id){
    $.getJSON("https://api.flickr.com/services/rest/?method=flickr.photos.getSizes&jsoncallback=?",
    {
        api_key: FLICKR_API_KEY,
        photo_id: id,
        format: "json"
    },
    function(id){
        return function(image){
            $('.'+id+' img').attr('src',image.sizes.size[0].source);
        }
    }(id));
}


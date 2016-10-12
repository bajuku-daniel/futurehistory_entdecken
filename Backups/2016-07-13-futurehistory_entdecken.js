(function($) {
  Drupal.futurehistoryEntdecken = Drupal.futurehistoryEntdecken || {};

  //fixed and initial values
  var initial_center_lat = 47.998082;
  var initial_center_lon = 7.853116;
  var last_active_nid = 0;
  var last_active_NIDs = [];
  var bounds;
  var date = 'all';
  var kategorie = 'Erinnern, Stadtbild, Tourismus'
  var poi_url = '/de/fh_view/fh_bbox_pois';
  var marker_content = [];
  var sort = ['dist','year'];
  
  // Style the gmap markers blue and violet
  var fh_marker_blue = new google.maps.MarkerImage(
    '/sites/default/files/gmap-files/fh-poi-blue.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(0, 0) //anchor point
  );
  var fh_marker_violet = new google.maps.MarkerImage(
    '/sites/default/files/gmap-files/fh-poi-violet.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(0, 0) //anchor point
  );
  
  //google map style elements
  var map_styles = [ { "featureType": "poi.park", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.attraction", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.business", "stylers": [ { "visibility": "off" } ] },{ "featureType": "poi.government", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.medical", "stylers": [ { "visibility": "off" } ] },{ "featureType": "poi.school", "stylers": [ { "visibility": "off" } ] },{ "featureType": "poi.place_of_worship", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.school", "stylers": [ { "visibility": "off" } ] }];

  //Function: getMarkers
  //Returns a Marker array from the bbox request
  //Parameters: bounds, date, kategorie
  Drupal.futurehistoryEntdecken.getMarkers = function (bounds, date, kategorie, sort, mapId){
    var bbox_bottom = bounds.getSouthWest().lat();
    var bbox_top = bounds.getNorthEast().lat()
    var bbox_right = bounds.getNorthEast().lng();;
    var bbox_left = bounds.getSouthWest().lng();
    var bbox = bbox_left + ',' + bbox_bottom + ',' + bbox_right + ',' + bbox_top;
    // start the ajax request
    $.ajax({
      url: poi_url ,
      method: 'get',
      data: {bbox : bbox, date : date, field_kategorie_name : kategorie }, 
      dataType: 'json',   
      success: function(data) {
        marker_content = data;
        // call the marker and thumbnail functions
        Drupal.futurehistoryEntdecken.setMapMarkers(marker_content, mapId); 
        Drupal.futurehistoryEntdecken.setMapThumbnails(marker_content, mapId);       
      }
    });
  }
  
  // Function: setMapThumbnails
  // list the Poi Thumbnails and fill the LI elements wit IDs
  Drupal.futurehistoryEntdecken.setMapThumbnails = function(marker_content, mapId) {
    $('#thumbnail-pois').empty();
   
      // Prototyp thumb-sort: initial sort after distance from center
      var dist;

      for ( var i = 0; i< marker_content.length; i++) {

        dist = google.maps.geometry.spherical.computeDistanceBetween(
          new google.maps.LatLng(marker_content[i].lat, marker_content[i].lon),
          new google.maps.LatLng(initial_center_lat, initial_center_lon)
        );
        // new property "distance_to_center":
        marker_content[i]["distance_to_center"] = dist;
      }

      marker_content.sort(function (a, b) {
        if (a.distance_to_center > b.distance_to_center) {
          return 1;
        }
        if (a.distance_to_center < b.distance_to_center) {
          return -1;
        }
        // a must be equal to b
        return 0;
      });
      // end of Prototyp thumb-sort: initial sort after distance from center/ or later from clicked point....

      for (var i in marker_content) {
        // check if its in your collections
        //build the mouseover click and mouseout functions

        var onclick = 'onclick="Drupal.futurehistoryEntdecken.markerHighlight(' + marker_content[i]['Nid'] + ', \'click\', \''+ mapId +'\')"'
        var info_url = '/node/' + marker_content[i]['Nid']; 
        var poi_element = '<li id="' + marker_content[i]['Nid'] + '" '+ onclick + '> <img src="'+ marker_content[i]['bild-haupt-thumb'] + '"></li><div id="tc-' + marker_content[i]['Nid'] + '"  class="thumbnail-control"><div class=left><a href="'+info_url+'"> <i class="material-icons">info</i> Bild Details</a></div><div class="right"> <a href=""><i class="material-icons">collections</i> in meine Sammlung</a></div> ';
        $('#thumbnail-pois').append(poi_element);

  }
         // thumbs persistence engine :-)
         // remember active thumbs after ajax call / new marker set
         for ( var n = 0; n < last_active_NIDs.length; n++) {
           // activate the tselected thumbs
           $('#thumbnail-pois li#'+last_active_NIDs[n]+'').addClass('active');       
         } 
         if (last_active_nid) {
           // no movement in loop, take just the last oin top
           $('#tc-'+last_active_nid+'').show();
           $('#thumbnail-pois').scrollTo('li#'+last_active_nid+'', 1000, {offset:-100});
         }
       }

  // Function: setMapMarkers
  // design and create the Markers
  Drupal.futurehistoryEntdecken.setMapMarkers = function(marker_content, mapId) {
    // first remove the old marker not in the bbox:
    if (!$.isEmptyObject(Drupal.futurehistoryEntdecken[mapId].markers)) {
      for (var i in Drupal.futurehistoryEntdecken[mapId].markers){
        Drupal.futurehistoryEntdecken[mapId].markers[i].setMap(null);
      }
    }
    
    //create the new Markers and push to the map
    Drupal.futurehistoryEntdecken[mapId].markers = [];
    $.each(marker_content, function() {
      var markerPosition = new google.maps.LatLng(this.lat, this.lon);
      var marker = new google.maps.Marker({
        position: markerPosition,
        map: Drupal.futurehistoryEntdecken[mapId].map,
        title: this.title,
        id: this.Nid,
        icon: fh_marker_blue
      });
      
      // Highlight the marker and thumbnail 
      google.maps.event.addListener(marker, 'click', function() {
        Drupal.futurehistoryEntdecken.markerHighlight(marker.id, 'click', mapId)
      }); 
 
      // remember me Activist
      if ( marker.id == last_active_nid ) {
        marker.setIcon(fh_marker_violet);
        $('#thumbnail-pois li#'+marker.id+'').addClass('active');
      }
      //push the markers out 
      Drupal.futurehistoryEntdecken[mapId].markers.push(marker); 
      
    });
  }

  // Function: markerHighlight
  // hover and out the marker and thumbnails
  Drupal.futurehistoryEntdecken.markerHighlight = function(markerId, action, mapId) {
    markerId = markerId.toString(); 
    // marker within double_swell value (meters ?) will be treated as same position...
    var double_swell = 5;

    for ( var i = 0; i< Drupal.futurehistoryEntdecken[mapId].markers.length; i++) {
      // change all markers to blue one
      
      Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(fh_marker_blue)
      // lower marker, raise only ID cklicked on Thumb later
      // Drupal.futurehistoryEntdecken[mapId].markers[i].setZIndex(Drupal.futurehistoryEntdecken[mapId].markers[i].zIndex - 1);

      if (markerId === Drupal.futurehistoryEntdecken[mapId].markers[i].id) {
        //hover out or click?
        if (action == "hover") {
           Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(fh_marker_violet);
           $('#thumbnail-pois li#'+markerId+'').toggleClass('hovered');
           break;
        }
         if (action == "out") {
           Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(fh_marker_blue);
           $('#thumbnail-pois li#'+markerId+'').toggleClass('hovered');           
           break;
        }
         if (action == "click") {
           $('#thumbnail-pois li').removeClass('active');

           if ( Drupal.futurehistoryEntdecken[mapId].markers[i].id == last_active_nid ) {
             // unselect
             Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(fh_marker_blue);
             // Remove Item from Array using jQuery
             last_active_NIDs.splice($.inArray(Drupal.futurehistoryEntdecken[mapId].markers[i].id, last_active_NIDs),1);
             last_active_nid = 0;
           }
           else {
             // highlight me
             Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(fh_marker_violet);
             // remember me as activated
             last_active_nid = Drupal.futurehistoryEntdecken[mapId].markers[i].id;
             // put me to top
             Drupal.futurehistoryEntdecken[mapId].markers[i].setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
           }
           // check all elements of marker-arry for hidden markers close by....
           // for-in-for loop....
           // build new arry of NIDs to remember selected thumbs
           last_active_NIDs = [];
           for ( var j = 0; j < Drupal.futurehistoryEntdecken[mapId].markers.length; j++) {
             if  (i === j) {
               // to sort later use new property "distance_to_clicked": this is the ultimate closest 
               Drupal.futurehistoryEntdecken[mapId].markers[i].set("distance_to_clicked", -1);
               if (last_active_nid == Drupal.futurehistoryEntdecken[mapId].markers[i].id)
                 // still activated, not deaktivated
                 last_active_NIDs.push(Drupal.futurehistoryEntdecken[mapId].markers[i].id);
               // distance check all other marker but not myself...
               continue;
             }
             var dist = google.maps.geometry.spherical.computeDistanceBetween(
                Drupal.futurehistoryEntdecken[mapId].markers[i].position, 
                Drupal.futurehistoryEntdecken[mapId].markers[j].position);
             // to sort later use new property "distance_to_clicked"
             Drupal.futurehistoryEntdecken[mapId].markers[j].set("distance_to_clicked", dist);

             if (dist < double_swell) {
               // set the double/hidden marker to violet only
               // no further sliding, because the are already in neibourhood in case of distance sorting... 
               if (last_active_nid) { 
                 $('#thumbnail-pois li#'+Drupal.futurehistoryEntdecken[mapId].markers[j].id+'').addClass('active');       
                 // store id of double for thumbhandling / persistance
                 last_active_NIDs.push(Drupal.futurehistoryEntdecken[mapId].markers[j].id);
               } 
               else {
                 $('#thumbnail-pois li#'+Drupal.futurehistoryEntdecken[mapId].markers[j].id+'').removeClass('active');
               }
             }
           }
           // end of "double decker" check
 
          //console.log('ACTIVE resulting NIDs: ' + last_active_NIDs);
          if (last_active_nid) {
             //toggle the thumbnail control
             $('#thumbnail-pois li#'+last_active_nid+'').addClass('active');       
             $('.thumbnail-control').slideUp("fast");         
             $('#tc-'+last_active_nid+'').slideDown("slow");
             //scroll to position in thumbnail navigation               
             $('#thumbnail-pois').scrollTo('li#'+last_active_nid+'', 2000, {offset:-100});
           } else {
             // POI deselected 
             $('#thumbnail-pois li#'+Drupal.futurehistoryEntdecken[mapId].markers[i].id+'').removeClass('active');
             $('#tc-'+Drupal.futurehistoryEntdecken[mapId].markers[i].id+'').slideUp("fast");
           }
         } // end of click event
      }
    }
  }

  Drupal.behaviors.futurehistoryEntdecken = {
    attach: function (context, settings) {
      //calculate the mapbox height  
      var mapbox_height = $("html").height() - $("#navbar").height();
      $('.entdecken-container, #entdecken-map, #entdecken-map-nav').css('height',mapbox_height)

      //calculate the thumbnail box height
      var thumbnailbox_height = $("html").height() - $("#navbar").height() - 70;
      $('#entdecken-map-nav #thumbnail-pois').css('height',thumbnailbox_height);

      $('.futurehistory-entdecken-map', context).each(function() {
        // MAP STUFF
        // The MAP div is located in "futurehistory-entdecken-map.tpl.php" and feed with the $atribute options created in "futurehistory_entdecken_plugin_style_google_map.inc" and the associated VIEW in the Drupal Backend
        var $this = $(this);
        var mapId = this.id;
        Drupal.futurehistoryEntdecken[mapId] = {};

        // CENTER the map and fixed zoom level - ATM fiexed Values see top of code
        // needs change - Center must be recalculated with dynamic values from filter and City preferences
        var mapCenter = new google.maps.LatLng(initial_center_lat,initial_center_lon);
        var mapZoom = 15;
        var min_zoom = 6;

        Drupal.futurehistoryEntdecken[mapId].map = new google.maps.Map(this, {
          center: mapCenter,
          zoom: mapZoom,
          styles: map_styles,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          minZoom: min_zoom,
          zoomControl: true,
          streetViewControl:false,
          rotateControl:false,
        });
        
        // switch the map type on established zoom level 
        google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, 'zoom_changed', function() { 
          var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
          if(zoomLevel <=18) {
            Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.ROADMAP);          
          }
          else {
            Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.HYBRID);
            Drupal.futurehistoryEntdecken[mapId].map.setTilt(0);
          }
        });
        
        
        

        // start google maps IDLE function and ask for the boundingbox .getBounds
        // todo: maybe the idle function is not the best choice? the pois load realy slow
        google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, 'idle', function() {
          bounds = Drupal.futurehistoryEntdecken[mapId].map.getBounds();
          Drupal.futurehistoryEntdecken.getMarkers(bounds, date, kategorie, sort, mapId);

		}); 
     
        // Toggle the filter and sort boxes with jquery magic
        $("#thumbnail-navigation-filter-button").click(function(){
          $("#thumbnail-filter-box").slideToggle("slow");
          $("#thumbnail-sort-box").slideUp("fast");
        });
        $("#thumbnail-navigation-sort-button").click(function(){
          $("#thumbnail-sort-box").slideToggle("slow");
          $("#thumbnail-filter-box").slideUp("fast");
        });
        $(".sort-close").click(function(){
          $("#thumbnail-sort-box").slideUp("fast");
        });        
        $(".filter-close").click(function(){
          $("#thumbnail-filter-box").slideUp("fast");
        });
        
        // the Date Range : date=all <-- all dates, date=--1990 <-- all bevfore 1990, date=1990-- <-- all after 1990, date=1800--1990 <-- all between 1800 and 1990
        // date slider stuff (linde@webgis.de, 2016/05) 
        // styles --> futurehistory_entdecken.css
        $("#time_slider").slider({
          range: true,
          min: 850,
          max: 2016,
          values: [ 1000, 2016 ],
          slide: function( event, ui ) {
            $("#time_range").val("Jahr " + ui.values[0] + " - Jahr " + ui.values[1]);
            date = String(ui.values[0]) + '--' + String(ui.values[1]);
          }
        });
        // time range display in GUI
        $("#time_range").val("Jahr " + $("#time_slider").slider("values", 0) + " - Jahr " + $("#time_slider").slider("values", 1));
        // on stop Slider inteaction: fire gmap idle event --> ajax Request....
        $("#time_slider").on( "slidestop", function( event, ui ) {
          Drupal.futurehistoryEntdecken.getMarkers(bounds, date, kategorie, sort, mapId);
        });
        // end of date slider stuff 

        // Disable zoom control (+/- Buttone ---> mouse wheel)
        //Drupal.futurehistoryEntdecken[mapId].map.setOptions({zoomControl: true});

      // ending all the drupal behaviors,atach, settings stuff..
      });
    }
  };
})(jQuery);

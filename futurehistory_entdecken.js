(function($) {
  Drupal.futurehistoryEntdecken = Drupal.futurehistoryEntdecken || {};

  //fixed and initial values

  //we need the initial center if someone starts from a bookmark without a cookie - lets see germany
  var InitYearRange = [ 1000, 2016 ];
  var initial_center_lat = 51.0847813;
  var initial_center_lon = 5.959095;
  var mapCenter;
  var mapZoom = 8;
  var min_zoom = 6;
  var max_zoom = 21;
  var last_active_nid = 0;
  var last_active_NIDs = [];
  var bounds;
  var RequestDate = 'all';
  var poi_url = '/de/fh_view/fh_bbox_pois';
  var marker_content = [];
  var sort = ['dist','year'];
  var fh_place;
  // view arrows, arry prepared for more than one view, up to now only inx = 0 used
  var line_a = [];
  var line_b = [];
  var pie = [];
  // Filterbox kategorie: initial all 
  var kategorie = ['Erinnern', 'Stadtbild', 'Tourismus'];

  // Style the gmap markers blue and violet
  var fh_marker_blue = new google.maps.MarkerImage(
    '/sites/default/files/gmap-files/fh-poi-blue.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(12, 12) //anchor point
  );
  var fh_marker_violet = new google.maps.MarkerImage(
    '/sites/default/files/gmap-files/fh-poi-violet.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(12, 12) //anchor point
  );
  var fh_marker_location = new google.maps.MarkerImage(
    '/sites/default/files/gmap-files/location.png',
    new google.maps.Size(15, 32),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(7, 32) //anchor point
  );
  
  //google map style elements
  var map_styles = [ { "featureType": "poi.park", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.attraction", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.business", "stylers": [ { "visibility": "off" } ] },{ "featureType": "poi.government", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.medical", "stylers": [ { "visibility": "off" } ] },{ "featureType": "poi.school", "stylers": [ { "visibility": "off" } ] },{ "featureType": "poi.place_of_worship", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.school", "stylers": [ { "visibility": "off" } ] }];

  // Function: delMapArrow
  // remove the view direction on a map
  Drupal.futurehistoryEntdecken.delMapArrow = function(i) {
    // remove old marker
    if (line_a[i] || line_b[i] || pie[i]) {
      line_a[i].setMap(null);
      line_b[i].setMap(null);
      pie[i].setMap(null);
    }
    return false;
  }

  // Function: setMapArrow
  // Set/Update the view direction on a map
  Drupal.futurehistoryEntdecken.setMapArrow = function(mapId, marker) {

    var i = marker.id;
    var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
    if(zoomLevel <= 18) {
      return false;
    }
    //Drupal.futurehistoryEntdecken.delMapArrow(i);
    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
    };

    var standpunkt = marker.position;
    var distance = 50;
    var heading = marker.direction;
    var half_openangle = marker.angle/2;
        
    var point_a = google.maps.geometry.spherical.computeOffset(standpunkt, distance, heading - half_openangle);
    var point_b = google.maps.geometry.spherical.computeOffset(standpunkt, distance, heading + half_openangle);
        
    line_a[i] = new google.maps.Polyline({
      path: [standpunkt, point_a],
      icons: [{
        icon: lineSymbol,
        offset: '100%'
       }],
       map: Drupal.futurehistoryEntdecken[mapId].map
    });
        
   line_b[i] = new google.maps.Polyline({
      path: [standpunkt, point_b],
      icons: [{
        icon: lineSymbol,
        offset: '100%'
      }],
      map: Drupal.futurehistoryEntdecken[mapId].map
    });
  
    pie[i] = new google.maps.Polygon({
      paths: [standpunkt, point_a, point_b],
      strokeColor: '#9E1F81',
      strokeOpacity: 0.6,
      strokeWeight: 1,
      fillColor: '#9E1F81',
      fillOpacity: 0.45,
      map: Drupal.futurehistoryEntdecken[mapId].map
    });
    return false; // if called from <a>-Tag
  } 

  //Function: DateSlider
  //used for initialization abnd reset
  Drupal.futurehistoryEntdecken.DateSlider = function (mapId){
    // the Date Range : date=all <-- all dates, date=--1990 <-- all bevfore 1990, date=1990-- <-- all after 1990, date=1800--1990 <-- all between 1800 and 1990
    // date slider stuff (linde@webgis.de, 2016/05) 
    // styles --> futurehistory_entdecken.css
    $("#time_slider").slider({
      range: true,
      min: 850,
      max: 2016,
      values: InitYearRange, 
      slide: function( event, ui ) {
        $("#time_range").val("Jahr " + ui.values[0] + " - Jahr " + ui.values[1]);
          RequestDate = String(ui.values[0]) + '--' + String(ui.values[1]);
        }
    });
    // time range display in GUI
    $("#time_range").val("Jahr " + $("#time_slider").slider("values", 0) + " - Jahr " + $("#time_slider").slider("values", 1));
    // on stop Slider inteaction: fire gmap idle event --> ajax Request....
    $("#time_slider").on( "slidestop", function( event, ui ) {
      Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
    });
  };

  //Function: getMarkers
  //Returns a Marker array from the bbox request
  //Parameters: bounds, date, kategorie
  Drupal.futurehistoryEntdecken.getMarkers = function (bounds, RequestDate, kategorie, sort, mapId, mapCenter){
    var bbox_bottom = bounds.getSouthWest().lat();
    var bbox_top = bounds.getNorthEast().lat()
    var bbox_right = bounds.getNorthEast().lng();;
    var bbox_left = bounds.getSouthWest().lng();
    var bbox = bbox_left + ',' + bbox_bottom + ',' + bbox_right + ',' + bbox_top;

    // start the ajax request
    $.ajax({
      url: poi_url ,
      method: 'get',
      data: {bbox : bbox, date : RequestDate, field_kategorie_name : kategorie.toString() }, 
      dataType: 'json',   
      success: function(data) {
        marker_content = data;
        // call the marker and thumbnail functions
        Drupal.futurehistoryEntdecken.setMapMarkers(marker_content, mapId); 
        Drupal.futurehistoryEntdecken.setMapThumbnails(marker_content, mapId, mapCenter);    
      }
    });
  }


  // Function: setMapThumbnails
  // list the Poi Thumbnails and fill the LI elements wit IDs
  Drupal.futurehistoryEntdecken.setMapThumbnails = function(marker_content, mapId, mapCenter) {
    $('#thumbnail-pois').empty();
    // Prototyp thumb-sort: initial sort after distance from center
    var dist;
    for ( var i = 0; i< marker_content.length; i++) {
      dist = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(marker_content[i].lat, marker_content[i].lon), mapCenter);
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

    for (var i = 0; i < marker_content.length; i++) {
      // check if its in your collections
      //build the mouseover click and mouseout functions

      var onclick = 'onclick="Drupal.futurehistoryEntdecken.markerHighlight(' + marker_content[i]['Nid'] + ', \'click\', \''+ mapId +'\', \'THUMB\')"';
      var info_url = '/node/' + marker_content[i]['Nid']; 
      var poi_element = '<li id="thumb_' + marker_content[i]['Nid'] + '" '+ onclick + '><div class="ansicht_title"> '+ marker_content[i]['title'] + ' | '+ marker_content[i]['Jahr'] + ' </div> <img src="'+ marker_content[i]['bild-haupt-thumb'] + '"></li><div id="tc-' + marker_content[i]['Nid'] + '"  class="thumbnail-control"><div class=left><a href="'+info_url+'"> <i class="material-icons">fullscreen</i> Bild<br>Details</a></div><div class="right"> <a href=""><i class="material-icons">collections</i> in meine Sammlung</a></div> ';
      $('#thumbnail-pois').append(poi_element);

      // thumbs persistence engine :-)
      // remember active thumbs after ajax call / new marker set
      for ( var n = 0; n < last_active_NIDs.length; n++) {
        // activate the selected thumbs if control not already open
        if ( $('#tc-'+last_active_NIDs[n]+'').is(":hidden") ) {
          $('#thumbnail-pois li#thumb_'+last_active_NIDs[n]+'').addClass('active');       
          // all activated with open controls
          $('#tc-'+last_active_NIDs[n]+'').show();
        }
      } 
    }
    /*
    var ThumbTopPosition = 0
    if ($('#thumbnail-pois li.active').filter(":first").position().top) {
      ThumbTopPosition = $('#thumbnail-pois li.active').filter(":first").position().top;
      console.log('SCROLL ', ThumbTopPosition);
      $("#thumbnail-pois").animate({scrollTop: ThumbTopPosition-20});
    }
    */
    //}
    //$('#thumbnail-pois').scrollTo('#thumbnail-pois li#thumb_'+last_active_NIDs[n]+'', 1000, {offset:20});
  };

  Drupal.futurehistoryEntdecken.DrawActive = function(mapId) {
    // remember me Activist
    // first deactivate all
    for ( var i = 0; i< Drupal.futurehistoryEntdecken[mapId].markers.length; i++) {
      Drupal.futurehistoryEntdecken.delMapArrow(Drupal.futurehistoryEntdecken[mapId].markers[i].id);
      Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(fh_marker_blue);
      Drupal.futurehistoryEntdecken[mapId].markers[i].setZIndex(google.maps.Marker.MAX_ZINDEX - 1);
      $('#thumbnail-pois li#thumb_'+Drupal.futurehistoryEntdecken[mapId].markers[i].id+'').removeClass('active');
      $('#tc-'+Drupal.futurehistoryEntdecken[mapId].markers[i].id+'').hide();
    }
    // second iterate on Activists
    for ( var n = 0; n < last_active_NIDs.length; n++) {
      for ( var i = 0; i< Drupal.futurehistoryEntdecken[mapId].markers.length; i++) {
        if (last_active_NIDs[n] === Drupal.futurehistoryEntdecken[mapId].markers[i].id) {
          Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(fh_marker_violet);
          Drupal.futurehistoryEntdecken[mapId].markers[i].setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
          Drupal.futurehistoryEntdecken.setMapArrow(mapId, Drupal.futurehistoryEntdecken[mapId].markers[i]);
          $('#thumbnail-pois li#thumb_'+last_active_NIDs[n]+'').addClass('active');
          $('#tc-'+last_active_NIDs[n]+'').slideDown("slow");
        }
      }
    }
  }

  // Function: setMapMarkers
  // design and create the Markers
  Drupal.futurehistoryEntdecken.setMapMarkers = function(marker_content, mapId) {
    // first remove the old marker not in the bbox:
    if (!$.isEmptyObject(Drupal.futurehistoryEntdecken[mapId].markers)) {
      for (var i in Drupal.futurehistoryEntdecken[mapId].markers){
        // remove views
        Drupal.futurehistoryEntdecken.delMapArrow(Drupal.futurehistoryEntdecken[mapId].markers[i].id);
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
      // glue our view stuff to the marker-obj
      marker.direction = this.direction;
      marker.angle = this.angle;
      marker.dist = this.dist;
      
      // Highlight the marker and thumbnail 
      google.maps.event.addListener(marker, 'click', function() {
        Drupal.futurehistoryEntdecken.markerHighlight(marker.id, 'click', mapId, 'MAP');
      }); 
 
      //push the markers out 
      Drupal.futurehistoryEntdecken[mapId].markers.push(marker); 
    });

    Drupal.futurehistoryEntdecken.DrawActive(mapId);
  }

  // Function: markerHighlight
  // hover and out the marker and thumbnails
  Drupal.futurehistoryEntdecken.markerHighlight = function(markerId, action, mapId, src) {
    markerId = markerId.toString(); 
    // marker within double_swell value (meters ?) will be treated as same position...
    var double_swell = 5;

    // hover not yet handled
    if (action == "click") {

      // click on Thumb
      if (src == 'THUMB') {
        // status active?
        var deaktivated = 0;
        for ( var n = 0; n < last_active_NIDs.length; n++) {
          if (markerId === last_active_NIDs[n]) {
            last_active_NIDs.splice(n, 1);
            deaktivated = 1;
          }
        }
        if (deaktivated == 0) {
          // click on closed Thumb --> show only this View (Arrows)
          last_active_NIDs = [];
          last_active_NIDs.push(markerId);
        }
        Drupal.futurehistoryEntdecken.DrawActive(mapId);
        return false;
      } // eof click on Thumb

      // else click in map:
      last_active_NIDs = [];

      for ( var i = 0; i< Drupal.futurehistoryEntdecken[mapId].markers.length; i++) {
        if (markerId === Drupal.futurehistoryEntdecken[mapId].markers[i].id) {
          //hover out or click?
          // todo ? hover ??
          if (action == "hover") {
             // Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(fh_marker_violet);
             $('#thumbnail-pois li#thumb_'+markerId+'').toggleClass('hovered');
             break;
          }
          if (action == "out") {
            // Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(fh_marker_blue);
            $('#thumbnail-pois li#thumb_'+markerId+'').toggleClass('hovered');           
            break;
          }
          if (action == "click") {
             // build new arry of NIDs to remember selected thumbs
             for ( var j = 0; j < Drupal.futurehistoryEntdecken[mapId].markers.length; j++) {
               Drupal.futurehistoryEntdecken[mapId].markers[i].set("distance_to_clicked", -1);
               var dist = google.maps.geometry.spherical.computeDistanceBetween( 
                              Drupal.futurehistoryEntdecken[mapId].markers[i].position, 
                              Drupal.futurehistoryEntdecken[mapId].markers[j].position);
               // to sort later use new property "distance_to_clicked"
               Drupal.futurehistoryEntdecken[mapId].markers[j].set("distance_to_clicked", dist);

               if (dist < double_swell) {
                 last_active_NIDs.push(Drupal.futurehistoryEntdecken[mapId].markers[j].id);
                 // no further sliding, because the are already in neibourhood in case of distance sorting... 
               }
             } // end of "double decker" check
          } // end of click event
        } // only this marker from function argument
      } // end of loop all markers
    }
    Drupal.futurehistoryEntdecken.DrawActive(mapId);

    // after redraw Thumbs mit open or closed Control we can scroll first active in position
    if ($('#thumbnail-pois li.active').filter(":first")) {
      $('#thumbnail-pois').scrollTo($('#thumbnail-pois li.active').filter(":first"), 1000, {offset:3});
    }
  };

  // placesMapAction Function for the google places actions
  Drupal.futurehistoryEntdecken.placesMapAction = function(place, mapId) {
    if (place == '' ){
    } else {
      var fh_cookie = {};                 
      if (place.geometry.viewport) {
        mapCenter = place.geometry.location;
        fh_cookie = {viewport:1, bounds:place.geometry.viewport, point:place.geometry.location } ;
        Drupal.futurehistoryEntdecken[mapId].map.fitBounds(place.geometry.viewport);
        Drupal.futurehistoryEntdecken[mapId].center_marker.setPosition(mapCenter)
      } else {
        mapCenter = place.geometry.location;        
        fh_cookie = {viewport:0, bounds:0, point:place.geometry.location} ;        
        Drupal.futurehistoryEntdecken[mapId].map.setCenter(place.geometry.location);
        Drupal.futurehistoryEntdecken[mapId].map.setZoom(17);
        Drupal.futurehistoryEntdecken[mapId].center_marker.setPosition(mapCenter)        
      }
      $.cookie('fh_geolocation_cookie', JSON.stringify(fh_cookie), {path: '/'});
    }
  }; 

  Drupal.futurehistoryEntdecken.selectFirstOnEnter = function(input){      
    var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;
    function addEventListenerWrapper(type, listener) { 
      if (type == "keydown") { 
        var orig_listener = listener;
        listener = function (event) {
          var suggestion_selected = $(".pac-item-selected").length > 0;
          if ((event.which == 13 ) && !suggestion_selected) { 
            var simulated_downarrow = $.Event("keydown", {
              keyCode:40, 
              which:40
            }); 
            orig_listener.apply(input, [simulated_downarrow]); 
          }
          orig_listener.apply(input, [event]);
        };
      }
      _addEventListener.apply(input, [type, listener]);
    }
    if (input.addEventListener) { 
      input.addEventListener = addEventListenerWrapper; 
    } else if (input.attachEvent) { 
      input.attachEvent = addEventListenerWrapper; 
    }
  };
  //End placesMapAction Function

 
  Drupal.behaviors.futurehistoryEntdecken = {
    attach: function (context, settings) {
      var mapId = '';
      var placesId = '';

      //calculate the mapbox height  
      var mapbox_height = $("html").height() - $("#navbar").height();
      $('.entdecken-container, #entdecken-map, #entdecken-map-nav').css('height',mapbox_height)

      //calculate the thumbnail box height
      var thumbnailbox_height = $("html").height() - $("#navbar").height() - 70;
      $('#entdecken-map-nav #thumbnail-pois').css('height',thumbnailbox_height);

      
      //google places autocomplete each function 
      $('.places-autocomplete', context).each(function() {
        var $this = $(this);
        placesId = this.id;
        var input = Drupal.futurehistoryEntdecken.selectFirstOnEnter(document.getElementById(placesId));

        Drupal.futurehistoryEntdecken[placesId] = {};     
        Drupal.futurehistoryEntdecken[placesId].autocomplete = new google.maps.places.Autocomplete(
          (document.getElementById(placesId)),
          {types: ['geocode']}
        );

        Drupal.futurehistoryEntdecken[placesId].autocomplete.addListener('place_changed', function() {
          fh_place = Drupal.futurehistoryEntdecken[placesId].autocomplete.getPlace();
          //call the map actions function
          Drupal.futurehistoryEntdecken.placesMapAction(fh_place, mapId);
        });
      }); // End EACH Funktion
  


      $('.futurehistory-entdecken-map', context).each(function() {
        // MAP STUFF
        // The MAP div is located in "futurehistory-entdecken-map.tpl.php" and feed with the $atribute options created in "futurehistory_entdecken_plugin_style_google_map.inc" and the associated VIEW in the Drupal Backend
        var $this = $(this);
        mapId = this.id;
        Drupal.futurehistoryEntdecken[mapId] = {};

        //initial map center without cookies
        mapCenter = new google.maps.LatLng(initial_center_lat,initial_center_lon);

        //first cookie check - where did we come from?
        // if cookie ok we override the default map values and initials
        var fh_cookiedata = JSON.parse($.cookie("fh_geolocation_cookie"));
        //console.log(fh_cookiedata);
        
        if (fh_cookiedata != null) {
          mapCenter  = new google.maps.LatLng(fh_cookiedata.point);
          mapZoom = 17;
        }

        Drupal.futurehistoryEntdecken[mapId].map = new google.maps.Map(this, {
          center: mapCenter,
          zoom: mapZoom,
          styles: map_styles,
          mapTypeId: google.maps.MapTypeId.ROADMAP,
          minZoom: min_zoom,
          maxZoom: max_zoom,
          zoomControl: true,
          streetViewControl:false,
          rotateControl:false,
        });
       
     
        // if the cookie contains a viewport override the map zoom with the viewport
        if (fh_cookiedata != null) {
          if (fh_cookiedata.viewport == '1') {
            var map_viewport = fh_cookiedata.bounds;
            Drupal.futurehistoryEntdecken[mapId].map.fitBounds(map_viewport);
          }
        }
  
        // set the "center" - marker to calculate the distance 
        Drupal.futurehistoryEntdecken[mapId].center_marker = new google.maps.Marker({
          position: mapCenter,
          map: Drupal.futurehistoryEntdecken[mapId].map,
          title: 'Search Position',
          id: 'center_marker',
          icon: fh_marker_location,
          zIndex: google.maps.Marker.MAX_ZINDEX
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
          Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);

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
        
        // Filter checkbox-events
        $("a[class=reset-filter-link]").click(function() {
          kategorie = ['Erinnern', 'Stadtbild', 'Tourismus'];  
          $("#erinnern").prop("checked", false );
          $("#stadtbild").prop("checked", false );
          $("#tourismus").prop("checked", false );
          $("#time_slider").slider('values',InitYearRange); // reset 
          $("#time_range").val( "Jahr " + InitYearRange[0] + " - Jahr " + InitYearRange[1] );
          RequestDate = String(InitYearRange[0]) + '--' + String(InitYearRange[1]);
          Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
        });

        $("#erinnern").change(function() {
          $(this).prop("checked") ?  kategorie.push('Erinnern') : kategorie = $.grep(kategorie, function(value) { return value != 'Erinnern'; });
          // wenn nichts dann alles !
          if (kategorie == []) { kategorie = ['Erinnern', 'Stadtbild', 'Tourismus'];}
          Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
	});
        $("#stadtbild").change(function() {
          $(this).prop("checked") ?  kategorie.push('Stadtbild') : kategorie = $.grep(kategorie, function(value) { return value != 'Stadtbild'; });
          // wenn nichts dann alles !
          if (kategorie == []) { kategorie = ['Erinnern', 'Stadtbild', 'Tourismus'];}
          Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
	});
        $("#tourismus").change(function() {
          $(this).prop("checked") ?  kategorie.push('Tourismus') : kategorie = $.grep(kategorie, function(value) { return value != 'Tourismus'; });
          if (kategorie == []) { kategorie = ['Erinnern', 'Stadtbild', 'Tourismus'];}
          // wenn nichts dann alles !
          Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
	});

        Drupal.futurehistoryEntdecken.DateSlider(mapId);

      });  //End EACH Funktion


      // initial unchecked....
      $("#erinnern").prop("checked", false );
      $("#stadtbild").prop("checked", false );
      $("#tourismus").prop("checked", false );
    // ending all the drupal behaviors,atach, settings stuff..
    }
  };
})(jQuery);

(function($) {
  Drupal.futurehistoryEntdecken = Drupal.futurehistoryEntdecken || {};

  //fixed and initial values

  //we need the initial center if someone starts from a bookmark without a cookie - lets see germany
  var _map;
  var RAW = [];
  var markerCluster = null;
  var double_swell = 5;
  var InitYearRange = [ 1000, 2016 ];
  var initial_center_lat = 51.0847813;
  var initial_center_lon = 5.959095;
  var mapCenter;
  var mapZoom = 8;
  var min_zoom = 6;
  var max_zoom = 21;
  var FHclusterIDs = [];
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
  var fh_marker_cluster = new google.maps.MarkerImage(
    '/sites/default/files/gmap-files/fh-poi-blue38.png',
    new google.maps.Size(38, 38),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(19, 19) //anchor point
  );
  var fh_marker_blue_mult = new google.maps.MarkerImage(
    '/sites/default/files/gmap-files/fh-poi-blue.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(12, 12) //anchor point
  );
  var fh_marker_blue = new google.maps.MarkerImage(
    '/sites/default/files/gmap-files/fh-poi-blue.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(12, 12) //anchor point
  );
  var fh_marker_trans = new google.maps.MarkerImage(
    '/sites/default/files/gmap-files/fh-poi-trans25.png',
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
  // remove my  view direction on map (and the one of my children) 
  Drupal.futurehistoryEntdecken.delMapArrow = function(marker) {
    if (marker.viewpos) {
      marker.viewpos.line_a.setMap(null);
      marker.viewpos.line_b.setMap(null);
      marker.viewpos.pie.setMap(null);
      marker.viewpos = null;
    }
    for (var i = 0; i < marker.hidePOIs.length; i++) {
      Drupal.futurehistoryEntdecken.delMapArrow(marker.hidePOIs[i]);
    }
    return false;
  }

  // Function: deactivateMarker
  // deactivate Marker
  Drupal.futurehistoryEntdecken.deactivateMarker = function(mapId, id) {
    var UseIcon = fh_marker_blue;
    for ( var k = 0; k< Drupal.futurehistoryEntdecken[mapId].markers.length; k++) {
      if (Drupal.futurehistoryEntdecken[mapId].markers[k].id === id){
        UseIcon = fh_marker_blue;
        Drupal.futurehistoryEntdecken[mapId].markers[k].activated = false;

        for ( var c = 0; c < FHclusterIDs.length; c++) {
          if (FHclusterIDs[c] === Drupal.futurehistoryEntdecken[mapId].markers[k].id) {
            UseIcon = fh_marker_trans;
            break;
          } 
        }
        //Drupal.futurehistoryEntdecken[mapId].markers[k].setIcon(UseIcon);
        Drupal.futurehistoryEntdecken[mapId].markers[k].setZIndex(google.maps.Marker.MAX_ZINDEX - 1);
        $('#thumbnail-pois li#thumb_'+Drupal.futurehistoryEntdecken[mapId].markers[k].id+'').removeClass('active');
        $('#tc-'+Drupal.futurehistoryEntdecken[mapId].markers[k].id+'').hide();
        //if(Drupal.futurehistoryEntdecken[mapId].map.getZoom() > 18) {
          //Drupal.futurehistoryEntdecken.delMapArrow(id);
        //}
        for ( var n = 0; n < last_active_NIDs.length; n++) {
          if (id === last_active_NIDs[n]) {
            last_active_NIDs.splice(n, 1);
          }
        }
      }
    }
  }

  // Function: setMapArrow
  // Set/Update the view direction on a map
  Drupal.futurehistoryEntdecken.setMapArrow = function(mapId, marker) {

    var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
    if(zoomLevel <= 18) {
      return false;
    }
    if (marker.viewpos) {
      return false;
    }
    var lineSymbol = {
      path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
    };

    var standpunkt = marker.position;
    var distance = 50;
    var heading = marker.direction;
    var half_openangle = marker.angle/2;
        
    var point_a = google.maps.geometry.spherical.computeOffset(standpunkt, distance, heading - half_openangle);
    var point_b = google.maps.geometry.spherical.computeOffset(standpunkt, distance, heading + half_openangle);
        
    marker.viewpos = {}; 
    marker.viewpos.line_a = new google.maps.Polyline({
      path: [standpunkt, point_a],
      icons: [{
        icon: lineSymbol,
        offset: '100%'
       }],
       map: Drupal.futurehistoryEntdecken[mapId].map
    });
        
   marker.viewpos.line_b = new google.maps.Polyline({
      path: [standpunkt, point_b],
      icons: [{
        icon: lineSymbol,
        offset: '100%'
      }],
      map: Drupal.futurehistoryEntdecken[mapId].map
    });
  
    marker.viewpos.pie = new google.maps.Polygon({
      paths: [standpunkt, point_a, point_b],
      strokeColor: '#9E1F81',
      strokeOpacity: 0.6,
      strokeWeight: 1,
      fillColor: '#9E1F81',
      fillOpacity: 0.45,
      map: Drupal.futurehistoryEntdecken[mapId].map
    });

     // Wrapper around addDomListener that removes the listener after the first event
     google.maps.event.addDomListenerOnce(marker.viewpos.pie, 'click', function() {
       Drupal.futurehistoryEntdecken.delMapArrow(marker.id);
       //Drupal.futurehistoryEntdecken.deactivateMarker(mapId, marker.id);
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

    for (var i = 0; i < RAW.length; i++) {
      // check if its in your collections
      //build the mouseover click and mouseout functions

      var onclick = 'onclick="Drupal.futurehistoryEntdecken.markerHighlight(' + RAW[i].id + ', \'click\', \''+ mapId +'\', \'THUMB\')"';
      var info_url = '/node/' + RAW[i].id; 
      var poi_element = '<li id="thumb_' + RAW[i].id + '" '+ onclick + '><div class="ansicht_title"> '+ RAW[i].title + ' | '+ RAW[i].Jahr + ' </div> <img src="'+ RAW[i].mainThumb + '"></li><div id="tc-' + RAW[i].id + '"  class="thumbnail-control"><div class=left><a href="'+info_url+'"> <i class="material-icons">fullscreen</i> Bild<br>Details</a></div><div class="right"> <a href=""><i class="material-icons">collections</i> in meine Sammlung</a></div> ';
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
  };

  Drupal.futurehistoryEntdecken.DrawActive = function(mapId) {
    // remember me Activist
    // first deactivate all
    var UseIcon = fh_marker_blue;
    for ( var i = 0; i< Drupal.futurehistoryEntdecken[mapId].markers.length; i++) {
      Drupal.futurehistoryEntdecken.delMapArrow(Drupal.futurehistoryEntdecken[mapId].markers[i]);
      Drupal.futurehistoryEntdecken[mapId].markers[i].activated = false;

      // Detect marker in cluster?
      UseIcon = fh_marker_blue;
      for ( var c = 0; c < FHclusterIDs.length; c++) {
        if (FHclusterIDs[c] === Drupal.futurehistoryEntdecken[mapId].markers[i].id) {
          UseIcon = fh_marker_trans;
          break;
        }
      }
      //Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(UseIcon);
      Drupal.futurehistoryEntdecken[mapId].markers[i].setZIndex(google.maps.Marker.MAX_ZINDEX - 1);
      $('#thumbnail-pois li#thumb_'+Drupal.futurehistoryEntdecken[mapId].markers[i].id+'').removeClass('active');
      $('#tc-'+Drupal.futurehistoryEntdecken[mapId].markers[i].id+'').hide();
    }
    // second iterate on Activists
    for ( var n = 0; n < last_active_NIDs.length; n++) {
      for ( var i = 0; i< Drupal.futurehistoryEntdecken[mapId].markers.length; i++) {
        if (last_active_NIDs[n] === Drupal.futurehistoryEntdecken[mapId].markers[i].id) {
          Drupal.futurehistoryEntdecken[mapId].markers[i].activated = true;
      
          // Detect marker in cluster?
          UseIcon = fh_marker_violet;
          for ( var c = 0; c < FHclusterIDs.length; c++) {
            if (FHclusterIDs[c] === Drupal.futurehistoryEntdecken[mapId].markers[i].id) {
              UseIcon = fh_marker_trans;
              break;
            }
          }
          //Drupal.futurehistoryEntdecken[mapId].markers[i].setIcon(UseIcon);
          Drupal.futurehistoryEntdecken[mapId].markers[i].setZIndex(google.maps.Marker.MAX_ZINDEX + 1);
          //Drupal.futurehistoryEntdecken.setMapArrow(mapId, Drupal.futurehistoryEntdecken[mapId].markers[i]);
          $('#thumbnail-pois li#thumb_'+last_active_NIDs[n]+'').addClass('active');
          $('#tc-'+last_active_NIDs[n]+'').slideDown("slow");
        }
      }
    }
  }

  // Function: setMapMarkers
  // design and create the Markers
  Drupal.futurehistoryEntdecken.setMapMarkers = function(marker_content, mapId) {

    // Steuerung an MarkerClusterer uebergeben
    // first remove the old marker not in the bbox:
    // if (!$.isEmptyObject(Drupal.futurehistoryEntdecken[mapId].markers)) {
    //   for (var i in Drupal.futurehistoryEntdecken[mapId].markers){
        // remove views
    //     Drupal.futurehistoryEntdecken.delMapArrow(Drupal.futurehistoryEntdecken[mapId].markers[i]);
     //    Drupal.futurehistoryEntdecken[mapId].markers[i].setMap(null);
     //  }
   //  }

    //create the new Markers and push to the map
    // Drupal.futurehistoryEntdecken[mapId].markers = [];

    
    var new_set = [];
    var insert_marker = false;
    var raw_changed = false;
    
    $.each(marker_content, function() {

      new_set.push(this.Nid);

      // persistence ?
      var already_there = false;
      for ( var r = 0; r < RAW.length; r++) {
        if (this.Nid == RAW[r].id) {
          var already_there = true;
          console.log('a ', this.Nid);
          break;
        }
        // ...kann auch in hiddenliste sein.....
        for (var x = 0; x < RAW[r].hideIds.length; x++) {
          if (this.Nid == RAW[r].hideIds[x].id) {
            already_there = true;
            console.log('c ', this.Nid);
            break;
          }
        }
      }


      if (!already_there) {
        raw_changed = true;
        var markerPosition = new google.maps.LatLng(this.lat, this.lon);
        var marker = new google.maps.Marker({
          position: markerPosition,
          map: Drupal.futurehistoryEntdecken[mapId].map,
          title: this.title,
          id: this.Nid,
          icon: fh_marker_blue
        });
        marker.Jahr = this.Jahr;
        // glue our view stuff to the marker-obj
        marker.direction = this.direction;
        marker.angle = this.angle;
        marker.dist = this.dist;
        marker.activated = false;
        // list of ids in same place (def. double swell)
        marker.hideIds = [];
        marker.hidePOIs = [];
        marker.hideother = false;
        marker.hidden = false;
        marker.viewpos = null; 
        marker.mainThumb = this['bild-haupt-thumb']; 

        // filter hidden marker, build list of hidden children
        for ( var r = 0; r < RAW.length; r++) {
          if (marker.id != RAW[r].id) {
            var dist = google.maps.geometry.spherical.computeDistanceBetween(RAW[r].position, marker.position);
            if (dist < double_swell) {
              marker.hidden = true;
              RAW[r].hidePOIs.push(marker);
              RAW[r].hideother = true;
              RAW[r].hideIds.push(marker.id);
              console.log('add hidden ', marker.id, ' to ', RAW[r].id);
              break;
            }
          }
        }
        if (!marker.hidden) {
          console.log('RAW new marker ', this.Nid);
          insert_marker = true;
          // Add Event to highlight the marker and thumbnail 
          google.maps.event.addListener(marker, 'click', function() {
            if (marker.activated === false) {
              console.log('click on inactive', marker);
              marker.activated = true;
              // Unique Active Icon per marker on click
              // deactivate all other
              for (var i = 0; i < RAW.length; i++) {
                if (RAW[i].id != marker.id) {
                  if (RAW[i].viewpos) {
                    Drupal.futurehistoryEntdecken.delMapArrow(RAW[i]);
                    console.log('del viewpos ', RAW[i].id);
                  }
                  if (RAW[i].hideother) {
                    // + symbol
                    RAW[i].setIcon(fh_marker_blue);
                  } else {
                    RAW[i].setIcon(fh_marker_blue);
                  }
                }
              }
              if (marker.hideother) {
                // + symbol
                marker.setIcon(fh_marker_violet);
              } else {
                marker.setIcon(fh_marker_violet);
              }
              // viewpos me and my children
              Drupal.futurehistoryEntdecken.setMapArrow(mapId, marker);
              console.log('set viewpos ', marker.id);
              for (var i = 0; i < marker.hidePOIs.length; i++) {
                Drupal.futurehistoryEntdecken.setMapArrow(mapId,  marker.hidePOIs[i]);
                $('#thumbnail-pois li#thumb_'+marker.hidePOIs[i].id+'').addClass('active');
                console.log('set viewpos of hidden: ', marker.hidePOIs[i].id);
              }
              $('#thumbnail-pois li#thumb_'+marker.id+'').addClass('active');
              $('#tc-'+marker.id+'').slideDown("slow");

            } else if (marker.activated === true) {
              console.log('click on active', marker);
              console.log('see ', RAW.length);
              marker.setIcon(fh_marker_blue);
              marker.activated = false;
              // reset, only one position can be selected
              last_active_NIDs = [];
              //Drupal.futurehistoryEntdecken.deactivateMarker(mapId, marker.id);
              $('#thumbnail-pois li#thumb_'+marker.id+'').removeClass('active');
              $('#tc-'+marker.id+'').hide();
              Drupal.futurehistoryEntdecken.delMapArrow(marker);
              marker.activated = false;
            } else {
              console.log('click on undefined');
            }
          }); 
          RAW.push(marker);
        }
      } // eof marker not already there --> persistence
    }); // eof each marker

    
    var TRANS = [];
    // remove makers outside box / filter criteria
    var persistent = false;
    for ( var r = 0; r < RAW.length; r++) {
      persistent = false;
      for ( var x = 0; x < new_set.length; x++) {
        if (new_set[x] == RAW[r].id) {
          TRANS.push(RAW[r]);
          console.log('ptest ok ', RAW[r].id);
          break;
        }
      }
    }
    RAW = TRANS;
    // wie diff ermitteln?
    raw_changed = true;

    if (raw_changed) {
      if (!$.isEmptyObject(markerCluster)) {
        markerCluster.clearMarkers();
      }
      markerCluster = new Drupal.futurehistoryEntdecken.MarkerClusterer( Drupal.futurehistoryEntdecken[mapId].map, RAW);
    }
  }

  // Function: markerHighlight
  // hover and out the marker and thumbnails
  Drupal.futurehistoryEntdecken.markerHighlight = function(markerId, action, mapId, src) {
    markerId = markerId.toString(); 

    // hover not yet handled
    if (action == "click") {

      // click on Thumb
      if (src == 'THUMB') {
        for ( var r = 0; r < RAW.length; r++) {
          if (markerId == RAW[r].id) {
            RAW[r].active = true;
          }
        } 
      } // eof click on Thumb

    }
    //Drupal.futurehistoryEntdecken.DrawActive(mapId);

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



 
/**
 * @name MarkerClusterer for Google Maps v3
 * @version version 1.0
 * @author Luke Mahe
 * @fileoverview
 * The library creates and manages per-zoom-level clusters for large amounts of
 * markers.
 * <br/>
 * This is a v3 implementation of the
 * <a href="http://gmaps-utility-library-dev.googlecode.com/svn/tags/markerclusterer/"
 * >v2 MarkerClusterer</a>.
 * modified for usage in futurehistoryEntdecken: Ch. Lindenbeck linde@webgis.de
 */

/**
 * @license
 * Copyright 2010 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


/**
 * A Marker Clusterer that clusters markers.
 *
 * @param {google.maps.Map} map The Google map to attach to.
 * @param {Array.<google.maps.Marker>=} opt_markers Optional markers to add to
 *   the cluster.
 * @param {Object=} opt_options support the following options:
 *     'gridSize': (number) The grid size of a cluster in pixels.
 *     'maxZoom': (number) The maximum zoom level that a marker can be part of a
 *                cluster.
 *     'zoomOnClick': (boolean) Whether the default behaviour of clicking on a
 *                    cluster is to zoom into it.
 *     'averageCenter': (boolean) Whether the center of each cluster should be
 *                      the average of all markers in the cluster.
 *     'minimumClusterSize': (number) The minimum number of markers to be in a
 *                           cluster before the markers are hidden and a count
 *                           is shown.
 *     'styles': (object) An object that has style properties:
 *       'url': (string) The image url.
 *       'height': (number) The image height.
 *       'width': (number) The image width.
 *       'anchor': (Array) The anchor position of the label text.
 *       'textColor': (string) The text color.
 *       'textSize': (number) The text size.
 *       'backgroundPosition': (string) The position of the backgound x, y.
 *       'iconAnchor': (Array) The anchor position of the icon x, y.
 * @constructor
 * @extends google.maps.OverlayView
 */
Drupal.futurehistoryEntdecken.MarkerClusterer = function(map, opt_markers, opt_options) {
  // Drupal.futurehistoryEntdecken.MarkerClusterer implements google.maps.OverlayView interface. We use the
  // extend function to extend Drupal.futurehistoryEntdecken.MarkerClusterer with google.maps.OverlayView
  // because it might not always be available when the code is defined so we
  // look for it at the last possible moment. If it doesn't exist now then
  // there is no point going ahead :)
  this.extend(Drupal.futurehistoryEntdecken.MarkerClusterer, google.maps.OverlayView);
  this.map_ = map;

  /**
   * @type {Array.<google.maps.Marker>}
   * @private
   */
  this.markers_ = [];

  /**
   *  @type {Array.<Cluster>}
   */
  this.clusters_ = [];

  this.sizes = [53, 56, 66, 78, 90];

  /**
   * @private
   */
  this.styles_ = [];

  /**
   * @type {boolean}
   * @private
   */
  this.ready_ = false;

  var options = opt_options || {};

  /**
   * @type {number}
   * @private
   */
  //this.gridSize_ = options['gridSize'] || 60;
  this.gridSize_ = options['gridSize'] || 20;

  this.dyngrid = {};
  this.dyngrid['6'] = '40';
  this.dyngrid['7'] = '40';
  this.dyngrid['8'] = '40';
  this.dyngrid['9'] = '40';
  this.dyngrid['10'] = '40';
  this.dyngrid['11'] = '40';
  this.dyngrid['12'] = '40';
  this.dyngrid['13'] = '40';
  this.dyngrid['14'] = '40';
  this.dyngrid['15'] = '30';
  this.dyngrid['16'] = '20';
  this.dyngrid['17'] = '20';
  this.dyngrid['18'] = '20';

  /**
   * @private
   */
  this.minClusterSize_ = options['minimumClusterSize'] || 2;


  /**
   * @type {?number}
   * @private
   */
  // this.maxZoom_ = options['maxZoom'] || null;
  this.maxZoom_ = options['maxZoom'] || 17;

  this.styles_ = options['styles'] || [];

  /**
   * @type {string}
   * @private
   * linde:
   */
  // this.FHclusterIcon = '/sites/default/files/gmap-files/fh-poi-blue.png'
  this.FHclusterIcon = '/sites/default/files/gmap-files/fh-poi-blue38.png'

  /**
   * @type {string}
   * @private
   */
  this.imagePath_ = options['imagePath'] ||
      this.MARKER_CLUSTER_IMAGE_PATH_;

  /**
   * @type {string}
   * @private
   */
  this.imageExtension_ = options['imageExtension'] ||
      this.MARKER_CLUSTER_IMAGE_EXTENSION_;

  /**
   * @type {boolean}
   * @private
   */
  this.zoomOnClick_ = true;

  if (options['zoomOnClick'] != undefined) {
    this.zoomOnClick_ = options['zoomOnClick'];
  }

  /**
   * @type {boolean}
   * @private
   */
  //this.averageCenter_ = false;
  this.averageCenter_ = true;

  if (options['averageCenter'] != undefined) {
    this.averageCenter_ = options['averageCenter'];
  }

  this.setupStyles_();

  this.setMap(map);

  /**
   * @type {number}
   * @private
   */
  this.prevZoom_ = this.map_.getZoom();

  // Add the map event listeners
  var that = this;
  google.maps.event.addListener(this.map_, 'zoom_changed', function() {
    var zoom = that.map_.getZoom();

    if (that.prevZoom_ != zoom) {
      that.prevZoom_ = zoom;
      that.resetViewport();
    }
  });

  google.maps.event.addListener(this.map_, 'idle', function() {
    //bounds = Drupal.futurehistoryEntdecken[mapId].map.getBounds();
    //Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
    that.redraw();
  });

  // Finally, add the markers
  if (opt_markers && opt_markers.length) {
    this.addMarkers(opt_markers, true);
  }
}


/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_PATH_ = '';


/**
 * The marker cluster image path.
 *
 * @type {string}
 * @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.MARKER_CLUSTER_IMAGE_EXTENSION_ = 'png';


/**
 * Extends a objects prototype by anothers.
 *
 * @param {Object} obj1 The object to be extended.
 * @param {Object} obj2 The object to extend with.
 * @return {Object} The new extended object.
 * @ignore
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.extend = function(obj1, obj2) {
  return (function(object) {
    for (var property in object.prototype) {
      this.prototype[property] = object.prototype[property];
    }
    return this;
  }).apply(obj1, [obj2]);
};


/**
 * Implementaion of the interface method.
 * @ignore
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.onAdd = function() {
  this.setReady_(true);
};

/**
 * Implementaion of the interface method.
 * @ignore
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.draw = function() {};

/**
 * Sets up the styles object.
 *
 * @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setupStyles_ = function() {
  if (this.styles_.length) {
    return;
  }

  for (var i = 0, size; size = this.sizes[i]; i++) {
    this.styles_.push({
      // linde  - only one Icon, one size not m1-m5.png
      // url: this.imagePath_ + (i + 1) + '.' + this.imageExtension_,
      //height: size,
      //width: size
      url: this.FHclusterIcon,
      height: 38,
      width: 38 
    });
  }
};

/**
 *  Fit the map to the bounds of the markers in the clusterer.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.fitMapToMarkers = function() {
  var markers = this.getMarkers();
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0, marker; marker = markers[i]; i++) {
    bounds.extend(marker.getPosition());
  }

  this.map_.fitBounds(bounds);
};


/**
 *  Sets the styles.
 *
 *  @param {Object} styles The style to set.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setStyles = function(styles) {
  this.styles_ = styles;
};


/**
 *  Gets the styles.
 *
 *  @return {Object} The styles object.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getStyles = function() {
  return this.styles_;
};


/**
 * Whether zoom on click is set.
 *
 * @return {boolean} True if zoomOnClick_ is set.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.isZoomOnClick = function() {
  return this.zoomOnClick_;
};

/**
 * Whether average center is set.
 *
 * @return {boolean} True if averageCenter_ is set.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.isAverageCenter = function() {
  return this.averageCenter_;
};


/**
 *  Returns the array of markers in the clusterer.
 *
 *  @return {Array.<google.maps.Marker>} The markers.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getMarkers = function() {
  return this.markers_;
};


/**
 *  Returns the number of markers in the clusterer
 *
 *  @return {Number} The number of markers.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getTotalMarkers = function() {
  return this.markers_.length;
};


/**
 *  Sets the max zoom for the clusterer.
 *
 *  @param {number} maxZoom The max zoom level.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setMaxZoom = function(maxZoom) {
  this.maxZoom_ = maxZoom;
};


/**
 *  Gets the max zoom for the clusterer.
 *
 *  @return {number} The max zoom level.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getMaxZoom = function() {
  return this.maxZoom_;
};


/**
 *  The function for calculating the cluster icon image.
 *
 *  @param {Array.<google.maps.Marker>} markers The markers in the clusterer.
 *  @param {number} numStyles The number of styles available.
 *  @return {Object} A object properties: 'text' (string) and 'index' (number).
 *  @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.calculator_ = function(markers, numStyles) {
  var index = 0;
  var count = markers.length;
  var dv = count;
  while (dv !== 0) {
    dv = parseInt(dv / 10, 10);
    index++;
  }

  index = Math.min(index, numStyles);
  return {
    text: count,
    index: index
  };
};


/**
 * Set the calculator function.
 *
 * @param {function(Array, number)} calculator The function to set as the
 *     calculator. The function should return a object properties:
 *     'text' (string) and 'index' (number).
 *
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setCalculator = function(calculator) {
  this.calculator_ = calculator;
};


/**
 * Get the calculator function.
 *
 * @return {function(Array, number)} the calculator function.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getCalculator = function() {
  return this.calculator_;
};


/**
 * Add an array of markers to the clusterer.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.addMarkers = function(markers, opt_nodraw) {
  for (var i = 0, marker; marker = markers[i]; i++) {
    this.pushMarkerTo_(marker);
  }
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Pushes a marker to the clusterer.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.pushMarkerTo_ = function(marker) {
  marker.isAdded = false;
  if (marker['draggable']) {
    // If the marker is draggable add a listener so we update the clusters on
    // the drag end.
    var that = this;
    google.maps.event.addListener(marker, 'dragend', function() {
      marker.isAdded = false;
      that.repaint();
    });
  }
  this.markers_.push(marker);
};


/**
 * Adds a marker to the clusterer and redraws if needed.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @param {boolean=} opt_nodraw Whether to redraw the clusters.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.addMarker = function(marker, opt_nodraw) {
  this.pushMarkerTo_(marker);
  if (!opt_nodraw) {
    this.redraw();
  }
};


/**
 * Removes a marker and returns true if removed, false if not
 *
 * @param {google.maps.Marker} marker The marker to remove
 * @return {boolean} Whether the marker was removed or not
 * @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.removeMarker_ = function(marker) {
  var index = -1;
  if (this.markers_.indexOf) {
    index = this.markers_.indexOf(marker);
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        index = i;
        break;
      }
    }
  }

  if (index == -1) {
    // Marker is not in our list of markers.
    return false;
  }

  marker.setMap(null);

  this.markers_.splice(index, 1);

  return true;
};


/**
 * Remove a marker from the cluster.
 *
 * @param {google.maps.Marker} marker The marker to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 * @return {boolean} True if the marker was removed.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.removeMarker = function(marker, opt_nodraw) {
  var removed = this.removeMarker_(marker);

  // linde
  //opt_nodraw = false;

  if (!opt_nodraw && removed) {
    this.resetViewport();
    this.redraw();
    return true;
  } else {
   return false;
  }
};


/**
 * Removes an array of markers from the cluster.
 *
 * @param {Array.<google.maps.Marker>} markers The markers to remove.
 * @param {boolean=} opt_nodraw Optional boolean to force no redraw.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.removeMarkers = function(markers, opt_nodraw) {
  var removed = false;

  // linde
  // opt_nodraw = false;

  for (var i = 0, marker; marker = markers[i]; i++) {
    var r = this.removeMarker_(marker);
    removed = removed || r;
  }

  if (!opt_nodraw && removed) {
    this.resetViewport();
    this.redraw();
    return true;
  }
};


/**
 * Sets the clusterer's ready state.
 *
 * @param {boolean} ready The state.
 * @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setReady_ = function(ready) {
  if (!this.ready_) {
    this.ready_ = ready;
    this.createClusters_();
  }
};


/**
 * Returns the number of clusters in the clusterer.
 *
 * @return {number} The number of clusters.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getTotalClusters = function() {
  return this.clusters_.length;
};


/**
 * Returns the google map that the clusterer is associated with.
 *
 * @return {google.maps.Map} The map.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getMap = function() {
  return this.map_;
};


/**
 * Sets the google map that the clusterer is associated with.
 *
 * @param {google.maps.Map} map The map.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setMap = function(map) {
  this.map_ = map;
};


/**
 * Returns the size of the grid.
 *
 * @return {number} The grid size.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getGridSize = function() {
  //console.log('z ', this.map_.getZoom());
  //console.log('gridSize: ', dyngrid[this.map_.getZoom()]);
  return this.dyngrid[this.map_.getZoom()];

  //return this.gridSize_;
};


/**
 * Sets the size of the grid.
 *
 * @param {number} size The grid size.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setGridSize = function(size) {
  this.gridSize_ = size;
};


/**
 * Returns the min cluster size.
 *
 * @return {number} The grid size.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getMinClusterSize = function() {
  return this.minClusterSize_;
};

/**
 * Sets the min cluster size.
 *
 * @param {number} size The grid size.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setMinClusterSize = function(size) {
  this.minClusterSize_ = size;
};


/**
 * Extends a bounds object by the grid size.
 *
 * @param {google.maps.LatLngBounds} bounds The bounds to extend.
 * @return {google.maps.LatLngBounds} The extended bounds.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getExtendedBounds = function(bounds) {
  var projection = this.getProjection();

  // Turn the bounds into latlng.
  var tr = new google.maps.LatLng(bounds.getNorthEast().lat(),
      bounds.getNorthEast().lng());
  var bl = new google.maps.LatLng(bounds.getSouthWest().lat(),
      bounds.getSouthWest().lng());

  // Convert the points to pixels and the extend out by the grid size.
  var trPix = projection.fromLatLngToDivPixel(tr);
  //this.setGridSize(this.getGridSize());
  //console.log (this.getGridSize());
  //console.log (this.gridSize_);
  var dynGridSize = parseInt(this.getGridSize());
  //trPix.x += this.gridSize_;
  //trPix.y -= this.gridSize_;
  trPix.x += dynGridSize;
  trPix.y -= dynGridSize;

  var blPix = projection.fromLatLngToDivPixel(bl);
  //blPix.x -= this.gridSize_;
  //blPix.y += this.gridSize_;
  blPix.x -= dynGridSize;
  blPix.y += dynGridSize;

  // Convert the pixel points back to LatLng
  var ne = projection.fromDivPixelToLatLng(trPix);
  var sw = projection.fromDivPixelToLatLng(blPix);

  // Extend the bounds to contain the new bounds.
  bounds.extend(ne);
  bounds.extend(sw);

  return bounds;
};


/**
 * Determins if a marker is contained in a bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @param {google.maps.LatLngBounds} bounds The bounds to check against.
 * @return {boolean} True if the marker is in the bounds.
 * @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.isMarkerInBounds_ = function(marker, bounds) {
  return bounds.contains(marker.getPosition());
};


/**
 * Clears all clusters and markers from the clusterer.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.clearMarkers = function() {
  this.resetViewport(true);

  // Set the markers a empty array.
  this.markers_ = [];
};


/**
 * Clears all existing clusters and recreates them.
 * @param {boolean} opt_hide To also hide the marker.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.resetViewport = function(opt_hide) {
  // Remove all the clusters
  for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
    cluster.remove();
  }

  // Reset the markers to not be added and to be invisible.
  for (var i = 0, marker; marker = this.markers_[i]; i++) {
    marker.isAdded = false;
    if (opt_hide) {
      marker.setMap(null);
    }
  }

  this.clusters_ = [];
};

/**
 *
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.repaint = function() {
  var oldClusters = this.clusters_.slice();
  this.clusters_.length = 0;
  this.resetViewport();
  this.redraw();

  // Remove the old clusters.
  // Do it in a timeout so the other clusters have been drawn first.
  window.setTimeout(function() {
    for (var i = 0, cluster; cluster = oldClusters[i]; i++) {
      cluster.remove();
    }
  }, 0);
};


/**
 * Redraws the clusters.
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.redraw = function() {
  this.createClusters_();
};


/**
 * Calculates the distance between two latlng locations in km.
 * @see http://www.movable-type.co.uk/scripts/latlong.html
 *
 * @param {google.maps.LatLng} p1 The first lat lng point.
 * @param {google.maps.LatLng} p2 The second lat lng point.
 * @return {number} The distance between the two points in km.
 * @private
*/
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.distanceBetweenPoints_ = function(p1, p2) {
  if (!p1 || !p2) {
    return 0;
  }

  var R = 6371; // Radius of the Earth in km
  var dLat = (p2.lat() - p1.lat()) * Math.PI / 180;
  var dLon = (p2.lng() - p1.lng()) * Math.PI / 180;
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(p1.lat() * Math.PI / 180) * Math.cos(p2.lat() * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
};


/**
 * Add a marker to a cluster, or creates a new cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.addToClosestCluster_ = function(marker) {
  var distance = 40000; // Some large number
  var clusterToAddTo = null;
  var pos = marker.getPosition();
  for (var i = 0, cluster; cluster = this.clusters_[i]; i++) {
    var center = cluster.getCenter();
    if (center) {
      var d = this.distanceBetweenPoints_(center, marker.getPosition());
      if (d < distance) {
        distance = d;
        clusterToAddTo = cluster;
      }
    }
  }

  if (clusterToAddTo && clusterToAddTo.isMarkerInClusterBounds(marker)) {
    clusterToAddTo.addMarker(marker);
    // remember marker as Cluster point
    FHclusterIDs.push(marker.id);
  } else {
    var cluster = new Drupal.futurehistoryEntdecken.Cluster(this);
    cluster.addMarker(marker);
    //FHclusterIDs.push(marker.id);
    this.clusters_.push(cluster);
  }
};

/**
 * Creates the clusters.
 *
 * @private
 */
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.createClusters_ = function() {
  if (!this.ready_) {
    return;
  }

  FHclusterIDs = [];
  // Get our current map view bounds.
  // Create a new bounds object so we don't affect the map.
  var mapBounds = new google.maps.LatLngBounds(this.map_.getBounds().getSouthWest(),
      this.map_.getBounds().getNorthEast());
  var bounds = this.getExtendedBounds(mapBounds);

  for (var i = 0, marker; marker = this.markers_[i]; i++) {
    if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
      this.addToClosestCluster_(marker);
    }
  }
};


/**
 * A cluster that contains markers.
 *
 * @param {Drupal.futurehistoryEntdecken.MarkerClusterer} markerClusterer The markerclusterer that this
 *     cluster is associated with.
 * @constructor
 * @ignore
 */
Drupal.futurehistoryEntdecken.Cluster = function(markerClusterer) {
  this.markerClusterer_ = markerClusterer;
  this.map_ = markerClusterer.getMap();
  this.gridSize_ = markerClusterer.getGridSize();
  this.minClusterSize_ = markerClusterer.getMinClusterSize();
  this.averageCenter_ = markerClusterer.isAverageCenter();
  this.center_ = null;
  this.markers_ = [];
  this.bounds_ = null;
  this.clusterIcon_ = new Drupal.futurehistoryEntdecken.ClusterIcon(this, markerClusterer.getStyles(),
      markerClusterer.getGridSize());
}

/**
 * Determins if a marker is already added to the cluster.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker is already added.
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.isMarkerAlreadyAdded = function(marker) {
  if (this.markers_.indexOf) {
    return this.markers_.indexOf(marker) != -1;
  } else {
    for (var i = 0, m; m = this.markers_[i]; i++) {
      if (m == marker) {
        return true;
      }
    }
  }
  return false;
};


/**
 * Add a marker the cluster.
 *
 * @param {google.maps.Marker} marker The marker to add.
 * @return {boolean} True if the marker was added.
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.addMarker = function(marker) {
  if (this.isMarkerAlreadyAdded(marker)) {
    return false;
  }

  if (!this.center_) {
    this.center_ = marker.getPosition();
    this.calculateBounds_();
  } else {
    if (this.averageCenter_) {
      var l = this.markers_.length + 1;
      var lat = (this.center_.lat() * (l-1) + marker.getPosition().lat()) / l;
      var lng = (this.center_.lng() * (l-1) + marker.getPosition().lng()) / l;
      this.center_ = new google.maps.LatLng(lat, lng);
      this.calculateBounds_();
    }
  }

  marker.isAdded = true;
  this.markers_.push(marker);

  var len = this.markers_.length;

  // modified linde, not all single poinzts in every zoomlevel were drawn
  if (len < this.minClusterSize_ && marker.getMap() != this.map_) {
    // Min cluster size not reached so show the marker.
    // ok, hier noch der getIcon-Trick für die Persistenz:
    marker.setIcon(marker.getIcon());
    marker.setMap(this.map_);
  }

  if (len == this.minClusterSize_) {
    // Hide the markers that were showing.
    for (var i = 0; i < len; i++) {
      this.markers_[i].setMap(null);
    }
  }

  if (len >= this.minClusterSize_) {
    marker.setMap(null);
  }

  this.updateIcon();
  return true;
};


/**
 * Returns the marker clusterer that the cluster is associated with.
 *
 * @return {Drupal.futurehistoryEntdecken.MarkerClusterer} The associated marker clusterer.
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.getMarkerClusterer = function() {
  return this.markerClusterer_;
};


/**
 * Returns the bounds of the cluster.
 *
 * @return {google.maps.LatLngBounds} the cluster bounds.
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.getBounds = function() {
  var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
  var markers = this.getMarkers();
  for (var i = 0, marker; marker = markers[i]; i++) {
    bounds.extend(marker.getPosition());
  }
  return bounds;
};


/**
 * Removes the cluster
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.remove = function() {
  this.clusterIcon_.remove();
  this.markers_.length = 0;
  delete this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {number} The cluster center.
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.getSize = function() {
  return this.markers_.length;
};


/**
 * Returns the center of the cluster.
 *
 * @return {Array.<google.maps.Marker>} The cluster center.
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.getMarkers = function() {
  return this.markers_;
};


/**
 * Returns the center of the cluster.
 *
 * @return {google.maps.LatLng} The cluster center.
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.getCenter = function() {
  return this.center_;
};


/**
 * Calculated the extended bounds of the cluster with the grid.
 *
 * @private
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.calculateBounds_ = function() {
  var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
  this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
};


/**
 * Determines if a marker lies in the clusters bounds.
 *
 * @param {google.maps.Marker} marker The marker to check.
 * @return {boolean} True if the marker lies in the bounds.
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.isMarkerInClusterBounds = function(marker) {
  return this.bounds_.contains(marker.getPosition());
};


/**
 * Returns the map that the cluster is associated with.
 *
 * @return {google.maps.Map} The map.
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.getMap = function() {
  return this.map_;
};


/**
 * Updates the cluster icon
 */
Drupal.futurehistoryEntdecken.Cluster.prototype.updateIcon = function() {
  var zoom = this.map_.getZoom();
  var mz = this.markerClusterer_.getMaxZoom();

  if (mz && zoom > mz) {
    // The zoom is greater than our max zoom so show all the markers in cluster.
    for (var i = 0, marker; marker = this.markers_[i]; i++) {
      marker.setMap(this.map_);
    }
    return;
  }

  if (this.markers_.length < this.minClusterSize_) {
    // Min cluster size not yet reached.
    this.clusterIcon_.hide();
    return;
  }

  var numStyles = this.markerClusterer_.getStyles().length;
  var sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
  this.clusterIcon_.setCenter(this.center_);
  this.clusterIcon_.setSums(sums);
  this.clusterIcon_.show();
};


/**
 * A cluster icon
 *
 * @param {Cluster} cluster The cluster to be associated with.
 * @param {Object} styles An object that has style properties:
 *     'url': (string) The image url.
 *     'height': (number) The image height.
 *     'width': (number) The image width.
 *     'anchor': (Array) The anchor position of the label text.
 *     'textColor': (string) The text color.
 *     'textSize': (number) The text size.
 *     'backgroundPosition: (string) The background postition x, y.
 * @param {number=} opt_padding Optional padding to apply to the cluster icon.
 * @constructor
 * @extends google.maps.OverlayView
 * @ignore
 */
Drupal.futurehistoryEntdecken.ClusterIcon = function(cluster, styles, opt_padding) {
  cluster.getMarkerClusterer().extend(Drupal.futurehistoryEntdecken.ClusterIcon, google.maps.OverlayView);

  this.styles_ = styles;
  this.padding_ = opt_padding || 0;
  this.cluster_ = cluster;
  this.center_ = null;
  this.map_ = cluster.getMap();
  this.div_ = null;
  this.sums_ = null;
  this.visible_ = false;

  this.setMap(this.map_);
}


/**
 * Triggers the clusterclick event and zoom's if the option is set.
 *
 * @param {google.maps.MouseEvent} event The event to propagate
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.triggerClusterClick = function(event) {
  var markerClusterer = this.cluster_.getMarkerClusterer();

  // Trigger the clusterclick event.
  google.maps.event.trigger(markerClusterer, 'clusterclick', this.cluster_, event);

  if (markerClusterer.isZoomOnClick()) {
    // Zoom into the cluster.
    this.map_.fitBounds(this.cluster_.getBounds());
  }
};


/**
 * Adding the cluster icon to the dom.
 * @ignore
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.onAdd = function() {
  this.div_ = document.createElement('DIV');
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);
    this.div_.innerHTML = this.sums_.text;
  }

  var panes = this.getPanes();
  panes.overlayMouseTarget.appendChild(this.div_);

  var that = this;
  var isDragging = false;
  google.maps.event.addDomListener(this.div_, 'click', function(event) {
    // Only perform click when not preceded by a drag
    if (!isDragging) {
      that.triggerClusterClick(event);
    }
  });
  google.maps.event.addDomListener(this.div_, 'mousedown', function() {
    isDragging = false;
  });
  google.maps.event.addDomListener(this.div_, 'mousemove', function() {
    isDragging = true;
  });
};


/**
 * Returns the position to place the div dending on the latlng.
 *
 * @param {google.maps.LatLng} latlng The position in latlng.
 * @return {google.maps.Point} The position in pixels.
 * @private
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.getPosFromLatLng_ = function(latlng) {
  var pos = this.getProjection().fromLatLngToDivPixel(latlng);

  if (typeof this.iconAnchor_ === 'object' && this.iconAnchor_.length === 2) {
    pos.x -= this.iconAnchor_[0];
    pos.y -= this.iconAnchor_[1];
  } else {
    pos.x -= parseInt(this.width_ / 2, 10);
    pos.y -= parseInt(this.height_ / 2, 10);
  }
  return pos;
};


/**
 * Draw the icon.
 * @ignore
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.draw = function() {
  if (this.visible_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.top = pos.y + 'px';
    this.div_.style.left = pos.x + 'px';
  }
};


/**
 * Hide the icon.
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.hide = function() {
  if (this.div_) {
    this.div_.style.display = 'none';
  }
  this.visible_ = false;
};


/**
 * Position and show the icon.
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.show = function() {
  if (this.div_) {
    var pos = this.getPosFromLatLng_(this.center_);
    this.div_.style.cssText = this.createCss(pos);
    this.div_.style.display = '';
  }
  this.visible_ = true;
};


/**
 * Remove the icon from the map
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.remove = function() {
  this.setMap(null);
};


/**
 * Implementation of the onRemove interface.
 * @ignore
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.onRemove = function() {
  if (this.div_ && this.div_.parentNode) {
    this.hide();
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
};


/**
 * Set the sums of the icon.
 *
 * @param {Object} sums The sums containing:
 *   'text': (string) The text to display in the icon.
 *   'index': (number) The style index of the icon.
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.setSums = function(sums) {
  this.sums_ = sums;
  this.text_ = sums.text;
  this.index_ = sums.index;
  if (this.div_) {
    this.div_.innerHTML = sums.text;
  }

  this.useStyle();
};


/**
 * Sets the icon to the the styles.
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.useStyle = function() {
  var index = Math.max(0, this.sums_.index - 1);
  index = Math.min(this.styles_.length - 1, index);
  var style = this.styles_[index];
  this.url_ = style['url'];
  this.height_ = style['height'];
  this.width_ = style['width'];
  this.textColor_ = style['textColor'];
  this.anchor_ = style['anchor'];
  this.textSize_ = style['textSize'];
  this.backgroundPosition_ = style['backgroundPosition'];
  this.iconAnchor_ = style['iconAnchor'];
};


/**
 * Sets the center of the icon.
 *
 * @param {google.maps.LatLng} center The latlng to set as the center.
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.setCenter = function(center) {
  this.center_ = center;
};


/**
 * Create the css text based on the position of the icon.
 *
 * @param {google.maps.Point} pos The position.
 * @return {string} The css style text.
 */
Drupal.futurehistoryEntdecken.ClusterIcon.prototype.createCss = function(pos) {
  var style = [];
  style.push('background-image:url(' + this.url_ + ');');
  var backgroundPosition = this.backgroundPosition_ ? this.backgroundPosition_ : '0 0';
  style.push('background-position:' + backgroundPosition + ';');

  if (typeof this.anchor_ === 'object') {
    if (typeof this.anchor_[0] === 'number' && this.anchor_[0] > 0 &&
        this.anchor_[0] < this.height_) {
      style.push('height:' + (this.height_ - this.anchor_[0]) +
          'px; padding-top:' + this.anchor_[0] + 'px;');
    } else if (typeof this.anchor_[0] === 'number' && this.anchor_[0] < 0 &&
        -this.anchor_[0] < this.height_) {
      style.push('height:' + this.height_ + 'px; line-height:' + (this.height_ + this.anchor_[0]) +
          'px;');
    } else {
      style.push('height:' + this.height_ + 'px; line-height:' + this.height_ +
          'px;');
    }
    if (typeof this.anchor_[1] === 'number' && this.anchor_[1] > 0 &&
        this.anchor_[1] < this.width_) {
      style.push('width:' + (this.width_ - this.anchor_[1]) +
          'px; padding-left:' + this.anchor_[1] + 'px;');
    } else {
      style.push('width:' + this.width_ + 'px; text-align:center;');
    }
  } else {
    style.push('height:' + this.height_ + 'px; line-height:' +
        this.height_ + 'px; width:' + this.width_ + 'px; text-align:center;');
  }

  var txtColor = this.textColor_ ? this.textColor_ : 'white';
  var txtSize = this.textSize_ ? this.textSize_ : 14;

  style.push('cursor:pointer; top:' + pos.y + 'px; left:' +
      pos.x + 'px; color:' + txtColor + '; position:absolute; font-size:' +
      txtSize + 'px; font-family:Arial,sans-serif; font-weight:bold');
  return style.join('');
};
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
       
        _map = Drupal.futurehistoryEntdecken[mapId].map;
        console.log('NEW _map ',_map);
     
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

 
/*
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
*/
        
        // start google maps IDLE function and ask for the boundingbox .getBounds
        // todo: maybe the idle function is not the best choice? the pois load realy slow
        // ??? linde doppelte idel-Func
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

(function($) {
  Drupal.futurehistoryEntdecken = Drupal.futurehistoryEntdecken || {};

  //fixed and initial values

  var CALL_onpopstate = false;
  var RAW = [];
  var CAT = {};
  var DEFAULT_ZOOM = 17;
  var LAST_ACTIVE_NID = -1;
  var markerCluster;
  var InitYearRange = [ 1000, 2016 ];
  var YearRange = [];
  // we need the initial center if someone starts from a bookmark without a cookie - lets go to germany
  var mapCenter = undefined;
  var mapIdGlobal = undefined;
  var LAST_place = undefined;
  var mapZoom = 8;
  var min_zoom = 6;
  var max_zoom = 21;
  var FHclusterIDs = [];
  var bounds;
  var RequestDate = 'all';
  var poi_url = '/de/fh_view/fh_bbox_pois';
  var cat_url = '/de/fh_view/fh_view_taxonomy.json';
  var marker_content = [];
  var sort = 'dist';
  var fh_place;
  // Filterbox kategorie: initial keine Auswahl -> kein kriterium
  var kategorie = [];

  // Style the gmap markers blue and violet
  var fh_marker_cluster = new google.maps.MarkerImage(
    '/sites/all/modules/futurehistory_entdecken/map-images/fh-poi-blue38.png',
    new google.maps.Size(38, 38),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(19, 19) //anchor point
  );
  var fh_marker_blue_cross = new google.maps.MarkerImage(
    '/sites/all/modules/futurehistory_entdecken/map-images/fh-poi-blue-cross.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(12, 12) //anchor point
  );
  var fh_marker_blue = new google.maps.MarkerImage(
    '/sites/all/modules/futurehistory_entdecken/map-images/fh-poi-blue.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(12, 12) //anchor point
  );
  // initial empty marker with click event --> icon to map via RAW (after clusterfilter....)
  var fh_marker_trans = new google.maps.MarkerImage(
    '/sites/all/modules/futurehistory_entdecken/map-images/fh-poi-trans25.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(12, 12) //anchor point
  );
  var fh_marker_violet = new google.maps.MarkerImage(
    '/sites/all/modules/futurehistory_entdecken/map-images/fh-poi-violet.png',
    new google.maps.Size(25, 25),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(12, 12) //anchor point
  );
  var fh_marker_location = new google.maps.MarkerImage(
    '/sites/all/modules/futurehistory_entdecken/map-images/location.png',
    new google.maps.Size(15, 32),
    new google.maps.Point(0, 0), //origin
    new google.maps.Point(7, 32) //anchor point
  );

  //google map style elements
  var map_styles = [ { "featureType": "poi.park", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.attraction", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.business", "stylers": [ { "visibility": "off" } ] },{ "featureType": "poi.government", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.medical", "stylers": [ { "visibility": "off" } ] },{ "featureType": "poi.school", "stylers": [ { "visibility": "off" } ] },{ "featureType": "poi.place_of_worship", "stylers": [ { "visibility": "on" } ] },{ "featureType": "poi.school", "stylers": [ { "visibility": "off" } ] }];

  // Function: markMapCenter
  // set the "center" - marker to calculate the distance
  Drupal.futurehistoryEntdecken.markMapCenter = function(mapId, Center) {
    if (Drupal.futurehistoryEntdecken[mapId].center_marker == undefined) {
      Drupal.futurehistoryEntdecken[mapId].center_marker = new google.maps.Marker({
        position: Center,
        map: Drupal.futurehistoryEntdecken[mapId].map,
        title: 'Search Position',
        id: 'center_marker',
        icon: fh_marker_location,
        zIndex: google.maps.Marker.MAX_ZINDEX
      });
      // console.log('new center mark ', Drupal.futurehistoryEntdecken[mapId].center_marker.getPosition().lat(), Drupal.futurehistoryEntdecken[mapId].center_marker.getPosition().lng());
    } else { 
      // console.log('move center mark to ', Center);
      Drupal.futurehistoryEntdecken[mapId].center_marker.setPosition(Center);
    }
  };

  // Function: delMapArrow
  // remove the view direction on a map
  Drupal.futurehistoryEntdecken.delMapArrow = function(marker) {
    // remove marker viewdirection
    marker.pie.setMap(null);
    marker.activated = false;
    // console.log(' del marker viewdir', marker.id);
    return false;
  }

  // Function: closeThumb
  Drupal.futurehistoryEntdecken.closeThumb = function(marker) {
    $('#thumbnail-pois li#thumb_'+marker.id+'').removeClass('active');
    $('#tc-'+marker.id+'').hide();
    marker.activated = false;
    return false;
  }


  // Function: deactivateAllMarker
  // deactivate all Marker
  Drupal.futurehistoryEntdecken.deactivateAllMarker = function(mapId) {
    for ( var i = 0; i < RAW.length; i++) {
      // console.log('call Deactivate Marker', RAW[i].id);
      Drupal.futurehistoryEntdecken.deactivateMarker(mapId, RAW[i].id);
    }
  }

  // Function: deactivateMarker
  // deactivate Marker
  Drupal.futurehistoryEntdecken.deactivateMarker = function(id, mapId) {
    for ( var i = 0; i < RAW.length; i++) {
      if (RAW[i].id === id) {
        // console.log('func deactM ', RAW[i].id);
        RAW[i].activated = false;
        if (RAW[i].hideother) {
          // console.log('set fh_marker_blue_cross ', RAW[i].id);
          RAW[i].setIcon(fh_marker_blue_cross);
          // iterate through hidden marker list
          for ( var x = 0; x < RAW[i].hidePOIs.length; x++) {
            // console.log('Deactivate hidden ', RAW[i].hidePOIs[x].id);
            Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
            $('#thumbnail-pois li#thumb_'+RAW[i].hidePOIs[x].id+'').removeClass('active');
            $('#tc-'+RAW[i].hidePOIs[x].id+'').hide();
          }
        } // all hidden marker
        Drupal.futurehistoryEntdecken.delMapArrow(RAW[i]);
        $('#thumbnail-pois li#thumb_'+id+'').removeClass('active');
        $('#tc-'+id+'').hide();
      } else {
        // test if id is in hidden list
        for ( var x = 0; x < RAW[i].hidePOIs.length; x++) {
          if (RAW[i].hidePOIs[x].id === id) { 
            Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
            RAW[i].hidePOIs[x].activated = false;
            RAW[i].setIcon(fh_marker_blue_cross);
          }
        }
      }
    }
  }

  // Function: setMapArrow
  // Set/Update the view direction on a map
  Drupal.futurehistoryEntdecken.setMapArrow = function(marker, mapId) {

    // console.log(' set marker viewdir', marker.pie);
    marker.pie.setMap(null);
    var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
    if(zoomLevel <= 18) {
      return false;
    }
    var i = marker.id;
    var standpunkt = marker.position;
    var distance = 50;
    var heading = marker.direction;
    var half_openangle = marker.angle/2;

    var point_a = google.maps.geometry.spherical.computeOffset(standpunkt, distance, heading - half_openangle);
    var point_b = google.maps.geometry.spherical.computeOffset(standpunkt, distance, heading + half_openangle);

    // console.log('setMapArrow lat: ', marker.getPosition().lat(), ' lng: ', marker.getPosition().lng());
    marker.pie = new google.maps.Polygon({
      paths: [standpunkt, point_a, point_b],
      strokeColor: '#9E1F81',
      strokeOpacity: 0.6,
      strokeWeight: 1,
      fillColor: '#9E1F81',
      fillOpacity: 0.45,
      map: Drupal.futurehistoryEntdecken[mapId].map
    });

    // Wrapper around addDomListener that removes the listener after the first event
    google.maps.event.addDomListenerOnce(marker.pie, 'click', function() {
      // console.log(' oneway click event on viewpos  ', i, ' map ', mapId);
      Drupal.futurehistoryEntdecken.deactivateViewPos(i, mapId);
      Drupal.futurehistoryEntdecken.resetMarkerIcon(i, mapId);
      // close all on parent click --> Drupal.futurehistoryEntdecken.deactivateMarker(i, mapId);
    });
    return false; // if called from <a>-Tag
  }

  //Function: DateSlider
  //used for initialization abnd reset
  Drupal.futurehistoryEntdecken.DateSlider = function (mapId, InitYearRange){
    // the Date Range : date=all <-- all dates, date=--1990 <-- all bevfore 1990, date=1990-- <-- all after 1990, date=1800--1990 <-- all between 1800 and 1990
    // date slider stuff (linde@webgis.de, 2016/05)
    $("#time_slider").slider({
      range: true,
      min: parseInt(Drupal.settings.futurehistoryEntdecken.first_date),
      max: parseInt(Drupal.settings.futurehistoryEntdecken.last_date),
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
    var bbox_top = bounds.getNorthEast().lat();
    var bbox_right = bounds.getNorthEast().lng();
    var bbox_left = bounds.getSouthWest().lng();
    var bbox = bbox_left + ',' + bbox_bottom + ',' + bbox_right + ',' + bbox_top;
    var RequestArgs = {};

    // console.log('getmarker for kategory: ', kategorie.toString(), ' len ', kategorie.toString().length);
    if (kategorie.length) {
      RequestArgs = {bbox : bbox, date : RequestDate, kategorie_id : kategorie.toString() }
    } else {
      RequestArgs = {bbox : bbox, date : RequestDate }
    }
    // start the ajax request
    $.ajax({
      url: poi_url ,
      method: 'get',
      data: RequestArgs,
      dataType: 'json',
      success: function(data) {
        var marker_content = data;
        if(!tourdisply_is_Active){
          console.log("tourdisply_is_Active");
          console.log("tourdisply_is_Active");
          console.log(tourdisply_is_Active);
          // call the marker and thumbnail functions
          // console.log('ajax success... call setMapMarkers');
          Drupal.futurehistoryEntdecken.setMapMarkers(marker_content, mapId);
          Drupal.futurehistoryEntdecken.setMapThumbnails(marker_content, mapId, mapCenter);
          aggregateToursAuthorData(data, mapId, mapCenter);
        }
      }
    });
  }

  /**
   * aggregateToursAuthorData
   *
   * Testing tour Data
   *
   * @param data
   */
  function aggregateToursAuthorData(data, mapId, mapCenter) {
    var item, attr, tourdata;
    var tours_unique = [];
    var toursDataInResult = [];
    var pois_by_author = [];
    var uidAuthorData = [];

    // reset
    // pois_by_nid = [];

    for (item in data) {
      if (pois_by_author[data[item]['uname']] === undefined) {
        pois_by_author[data[item]['uname']] = [];
      }
      pois_by_author[data[item]['uname']].push(data[item]);
      for (attr in data[item]) {
        pois_by_nid[data[item]['Nid']] = data[item];
        if (attr === "tour_id" && data[item][attr] !== "NULL") {
          tours_unique[data[item][attr]] = data[item];
        }
      }
    }

    for (tourdata in tours_unique) {
      toursDataInResult.push(tours_unique[tourdata]);
    }

    for (user in pois_by_author) {
      uidAuthorData[user] = {count: pois_by_author[user].length, uid: pois_by_author[user][0]['uid']};
    }

    setUpdateAuthor(uidAuthorData);
    setUpdateTours(toursDataInResult);

    ////  TODO: REFACTOR ALL CHANGES
    initializeAccordions();


    //// DEMO CALL
    // showTourOnMap(toursDataInResult[0]["tour_id"]);


  }



// Removes the markers from the map, but keeps them in the array.
  function clearDirectionsMarkers() {
    if (directionsDisplay.setMap) {
      // reset RAW
      while(RAW[0]) {
        RAW.pop().setMap(null);
      }
      directionsDisplay.setMap(null);
    }
    tourdisply_is_Active = false;
    jQuery('#tour_selector').parent().find('h3').first().find('span').last().html("Keine Tour gewählt");
  }
  /**
   *
   * @param tourID
   */
  function showTourOnMap(tour_id) {
    // todo: verhalten bei verschieben wenn strecke bestehen beleibt  / wegfallen soll

    // start the ajax request to get tour details
    $.ajax({
      url: tour_url,
      method: 'get',
      data: "tour_id=" + tour_id,
      dataType: 'json',
      success: function (tourdata) {
        var original_tourdata = [];
        for (item in tourdata) {
          if ('nid' in tourdata[item]) {
            original_tourdata.push(pois_by_nid[tourdata[item]['nid']]);
          }
        }

        clearDirectionsMarkers();

        var directionsService = new google.maps.DirectionsService;
        directionsDisplay = new google.maps.DirectionsRenderer;
        directionsDisplay.setMap(Drupal.futurehistoryEntdecken[mapIdGlobal].map);
        directionsDisplay.setOptions({suppressMarkers: true});
        // TEST update Map mit bestehender Markerauswahl - neue funktion zeichnet wegstrecken
        calculateAndDisplayRoute(directionsService, directionsDisplay, original_tourdata);
        tourdisply_is_Active = true;
        console.log("-----------> tourdisply_is_Active");
        console.log(tourdisply_is_Active);

        // timeout needed to set markers - sometimes they dont show up - possibly due directions && marker update interference
        var tout = setTimeout(
            function () {
              Drupal.futurehistoryEntdecken.setMapMarkers(original_tourdata, mapIdGlobal);
              Drupal.futurehistoryEntdecken.setMapThumbnails(original_tourdata, mapIdGlobal, mapCenter);
              clearTimeout(tout);
            }, 500);
      }
    });

  }

  /**
   * Init Accordions function Filter UI
   */
  function initializeAccordions() {
    var icons = {
      header: "ui-icon-circle-arrow-e",
      activeHeader: "ui-icon-circle-arrow-s"
    };
    $("#accordion").accordion({
      icons: icons,
      heightStyle: "content"
    });
  }

  /**
   *
   */
  var author = [];
  var pois_by_nid = [];
  var directionsDisplay = [];
  var tourdisply_is_Active = false;
  var tour_url = '/de/fh_view/list_tour_content';

  /**
   *
   */

  /**
   * setUpdateAuthor - set Author filter UI
   *
   * @param authorData
   */
  function setUpdateAuthor(authorData) {
    var $authors = $('#author_selector');
    $authors.html('');
    for (authorname in authorData) {
      var count = authorData[authorname].count;
      var uid = authorData[authorname].uid;
      var ischecked = Boolean($.inArray(uid, author) !== -1);
      if (ischecked) {
        $('#author_selector').parent()
      }
      // .prop('checked', true);
      $('<label />', {'for': 'cb' + uid, text: authorname + " (" + count + ")"}).appendTo($authors);
      $('<input />', {type: 'checkbox', uid: 'cb' + uid, value: uid}).prop('checked', ischecked).appendTo($authors);
    }

    $("#author_selector input").change(function (e) {
      var getCheckedVals = function () {
        var allVals = [];
        $("#author_selector input:checked").each(function () {
          allVals.push($(this).val());
        });
        return allVals;
      }
      // set global author to be evaluated later elsewhere
      author = getCheckedVals();

      //TODO: was soll mit autoren passieren / immer alle darstellen vs. nur die noch verfügbaren darstellen
      //
      Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapIdGlobal, mapCenter);
    });
  }

  /**
   *
   * @param tourData
   */
  function setUpdateTours(toursFilteredData) {
    console.log('setUpdateTours');
    var $tours = $('#tour_selector');
    $tours.html('');
    var tour_url_detail = "/de/fh_view/list_tours";

    for (var i = 0; i < toursFilteredData.length; i++) {
      var toursItem = toursFilteredData[i];

      $.ajax({
        url: tour_url_detail,
        method: 'get',
        data: "tour_id=" + toursItem.tour_id,
        dataType: 'json',
        success: function (tourdetails) {
          var distance = tourdetails[0].distance;
          var tour_titel = tourdetails[0].title;
          var zeitraum = tourdetails[0].tour_start_date + "/" + tourdetails[0].tour_end_date;
          var autor = tourdetails[0].name;
          var tour_id = tourdetails[0].tour_id;
          var buildTourMarkup = function () {
            var $tour = $('<div />', {'class': 'tour_id_' + tour_id + " tour_selector"});
            var $tour_status = $('<div />', {'class': 'status'});
            var $tour_info = $('<div />', {'class': 'info', "data-tourid": tour_id});
            $tour_info.append("<span>" + tour_titel + " / " + zeitraum + "</span>");
            $tour_info.append("<span>" + distance + " / " + autor + "</span>");
            var $tour_details = $('<div />', {'class': 'details'});

            $tour_info.click(function (e) {
              showTourOnMap(tour_id);
              jQuery('#tour_selector').parent().find('h3').first().find('span').last().html(tour_titel);
            });

            $tour_status.appendTo($tour);
            $tour_info.appendTo($tour);
            $tour_details.appendTo($tour);
            $tour.appendTo($tours);

          }
          buildTourMarkup();
        }
      });

    }
  }

  function calculateAndDisplayRoute(directionsService, directionsDisplay, original_tourdata) {
    var waypts = [];
    for (var i = 0; i < original_tourdata.length; i++) {
      if (i === 0) {
        // Start EndPunkt benötigen Datenformat mit lng/lat oder Text e.g. New York,US
        my_origin = original_tourdata[i]['lat'] + "," + original_tourdata[i]['lon'];
      } else if (i === original_tourdata.length - 1) {
        my_destination = original_tourdata[i]['lat'] + "," + original_tourdata[i]['lon'];
      } else {
        // waypoints benörigen datenformat mit folgender Struktur info
        waypts.push({
          location: new google.maps.LatLng(original_tourdata[i]['lat'], original_tourdata[i]['lon']),
          stopover: true
        });
      }
    }

    directionsService.route({
      origin: my_origin,
      destination: my_destination,
      waypoints: waypts,
      optimizeWaypoints: true,
      travelMode: google.maps.TravelMode.WALKING
    }, function (response, status) {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsDisplay.setDirections(response);
      } else {
        window.alert('Directions request failed due to ' + status);
      }
    });
  }

  // Function: setMapThumbnails
  // list the marker Thumbnails and fill the LI elements wit IDs
  Drupal.futurehistoryEntdecken.setMapThumbnails = function(marker_content, mapId, mapCenter) {
    $('#thumbnail-pois').empty();

    // thumb-sort: distance from center versus age
    if (sort == 'dist') {
      // sort after distance from center/ or later from clicked point....
      var dist;
      var sortCenter = mapCenter;
      if (Drupal.futurehistoryEntdecken[mapId].center_marker != undefined) {
        sortCenter = Drupal.futurehistoryEntdecken[mapId].center_marker.getPosition();
      }

      for ( var i = 0; i< marker_content.length; i++) {
        dist = google.maps.geometry.spherical.computeDistanceBetween(new google.maps.LatLng(marker_content[i].lat, marker_content[i].lon), sortCenter);
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
    } else {
      // global var sort = year (sort by age)
      marker_content.sort(function (a, b) {
        if (a.Jahr > b.Jahr) {
          return 1;
        }
        if (a.Jahr < b.Jahr) {
          return -1;
        }
        // a must be equal to b
        return 0;
      });
    }

    for (var i = 0; i < marker_content.length; i++) {
      // check if its in your collections
      //build the mouseover click and mouseout functions
      var nid = marker_content[i]['Nid'];
      var onclick_thumb  = 'onclick="Drupal.futurehistoryEntdecken.markerStateChange(' + nid + ', \'click\', \''+ mapId +'\', \'THUMB\')"';
      var onclick_detail = 'onclick="Drupal.futurehistoryEntdecken.setLastViewCookie(' + nid + ',  \''+ mapId +'\')"';
      var info_url = '/node/' + nid;
      var poi_element = '<li id="thumb_' + nid + '" '+ onclick_thumb + '><div class="ansicht_title"> '+ marker_content[i]['title'] + ' | '+ marker_content[i]['Jahr'] + ' </div> <img src="'+ marker_content[i]['bild-haupt-thumb'] + '"></li><div id="tc-' + nid + '"  class="thumbnail-control"><div class="left" '+ onclick_detail + '><a href="'+info_url+'"> <i class="material-icons">fullscreen</i> Bild<br>Details</a></div><div class="right"> <i class="material-icons">collections</i> in meine Sammlung</div> ';
      $('#thumbnail-pois').append(poi_element);
    }

    // persistence step 4
    // remember active thumbs after ajax call / new marker set
    for ( var n = 0; n < RAW.length; n++) {
      // activate the selected thumbs if control not already open
      if (RAW[n].activated) {
        if ( $('#tc-'+RAW[n].id+'').is(":hidden") ) {
          $('#thumbnail-pois li#thumb_'+RAW[n].id+'').addClass('active');
          // all activated with open controls
          $('#tc-'+RAW[n].id+'').show();
        }
      }
      // hidden children
      for ( var x = 0; x < RAW[n].hidePOIs.length; x++) {
        if (RAW[n].hidePOIs[x].activated) {
          if ( $('#tc-'+RAW[n].hidePOIs[x].id+'').is(":hidden") ) {
            $('#thumbnail-pois li#thumb_'+RAW[n].hidePOIs[x].id+'').addClass('active');
            $('#tc-'+RAW[n].hidePOIs[x].id+'').show();
          }
        }
      }
    }

    // scroll to last not working, append dummy space
    $('#thumbnail-pois').append('<div id="dummy" style="height:100px;"></div>');

    // BUG --> so hat das nicht funktioniert: if ($('#thumbnail-pois li.active').filter(":first")) {
    // test for existing selector in jquery:
    if ($('#thumbnail-pois li.active').filter(":first").length) {
      // after redraw Thumbs mit open or closed Control we can scroll first active in position
      // console.log('scroll thumbs to active ');
      $('#thumbnail-pois').scrollTo($('#thumbnail-pois li.active').filter(":first"), 10, {offset:3});
    } else {
      // after redraw Thumbs with non-active scroll to top
      // e.g changing place
      // console.log('scroll thumbs to top ');
      $('#thumbnail-pois').scrollTo($('#thumbnail-pois li').filter(":first"), 10, {offset:3});
    }
    // call thumbs persistence engine 
    Drupal.futurehistoryEntdecken.BackFromBildDetail(mapId);
  };

  // Function: BackFromBildDetail
  Drupal.futurehistoryEntdecken.BackFromBildDetail = function(mapId) {
    // persistenz step 3, back from BildDetail
    if ( LAST_ACTIVE_NID > -1 ) {
      // console.log('persistenz step 3, back from BildDetail LAST_ACTIVE_NID ', LAST_ACTIVE_NID);
      for ( var r = 0; r < RAW.length; r++) {
        if ( RAW[r].id == LAST_ACTIVE_NID ) {
          RAW[r].activated = true;
          // console.log('persistenz step 3, activate thumb of marker ', LAST_ACTIVE_NID);
          $('#thumbnail-pois li#thumb_'+RAW[r].id+'').addClass('active');
          $('#tc-'+RAW[r].id+'').show();
          RAW[r].setIcon(fh_marker_violet);
          Drupal.futurehistoryEntdecken.setMapArrow(RAW[r], mapId);
        }
        for ( var x = 0; x < RAW[r].hidePOIs.length; x++) {
          if ( RAW[r].hidePOIs[x].id == LAST_ACTIVE_NID ) {
            RAW[r].hidePOIs[x].activated = true;
            // console.log('persistenz step 3, activate thumb of hidden marker ', LAST_ACTIVE_NID);
            $('#thumbnail-pois li#thumb_'+RAW[r].hidePOIs[x].id+'').addClass('active');
            $('#tc-'+RAW[r].hidePOIs[x].id+'').show();
            RAW[r].setIcon(fh_marker_violet);
            Drupal.futurehistoryEntdecken.setMapArrow(RAW[r].hidePOIs[x], mapId);
          }
        }
      }
      if ($('#thumbnail-pois li.active').filter(":first")) {
         // console.log('persistenz step 3, scroll active Thumb');
        $('#thumbnail-pois').scrollTo($('#thumbnail-pois li.active').filter(":first"), 1000, {offset:3});
      }
      // reset LAST_ACTIVE_NID is only a signal from cookie
      LAST_ACTIVE_NID = -1
    } 
  }

  Drupal.futurehistoryEntdecken.setLastViewCookie = function(nid,mapId) {
     // console.log(" clicked Bild Detail ", nid);
     var mapzoom = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
     var mapcenter = Drupal.futurehistoryEntdecken[mapId].map.getCenter();
     var maplat = mapcenter.lat();
     var maplng = mapcenter.lng();
     var place_lat = 91;
     var place_lng = 181;
     if (Drupal.futurehistoryEntdecken[mapId].center_marker != undefined) {
       place_lat = Drupal.futurehistoryEntdecken[mapId].center_marker.getPosition().lat();
       place_lng = Drupal.futurehistoryEntdecken[mapId].center_marker.getPosition().lng();
     }
     var fh_cookie_view = {viewport:1, lat:maplat, lng:maplng, zoom:mapzoom, nid:nid, place_lat:place_lat, place_lng:place_lng};
     // console.log(' delete fh_geolocation_cookie ');
     $.cookie('fh_geolocation_cookie', null, { path: '/' });
     // console.log(' set fh_lastview_cookie ', fh_cookie_view);
     $.cookie('fh_lastview_cookie', JSON.stringify(fh_cookie_view), {path: '/'});
  }

  // Function: setMapMarkers
  // design and create the Markers
  Drupal.futurehistoryEntdecken.setMapMarkers = function(marker_content, mapId) {

    // persistenz step 1 save to LAST
    var LAST = [];
    for ( var r = 0; r < RAW.length; r++) {
      // viewdir geometries still remains in map, decoupled from marker
      RAW[r].pie.setMap(null);
      for ( var x = 0; x < RAW[r].hidePOIs.length; x++) {
         RAW[r].hidePOIs[x].pie.setMap(null);
      }
      LAST.push(RAW[r]);
    }
    // reset RAW
    while(RAW[0]) {
      RAW.pop().setMap(null);
    }

    $.each(marker_content, function() {
      var markerPosition = new google.maps.LatLng(this.lat, this.lon);
      var marker = new google.maps.Marker({
        position: markerPosition,
        map: null,
        title: this.title,
        id: this.Nid,
        icon: fh_marker_trans
      });
      // glue our view stuff to the marker-obj
      marker.direction = this.direction;
      marker.angle = this.angle;
      marker.dist = this.dist;
      marker.pie = new google.maps.Polygon({});
      marker.hideother = false;
      marker.hidden = false;
      marker.incluster = true;
      marker.clusterBounds = undefined;
      marker.hidden_active_counter = 0;
      marker.activated = false;
      marker.hideIds = [];
      marker.hidePOIs = [];

      // console.log('Add Listener Click-Event to marker id ', marker.id);
      google.maps.event.addListener(marker, 'click', function() {
        // console.log('click on id ', marker.id);
        Drupal.futurehistoryEntdecken.markerStateChange(marker.id, 'click', mapId, 'MAP');
      });
      RAW.push(marker);
    });

    // Reduce POIs by chaining neardistance POIS together
    var double_swell = 5;

    // filter hidden marker, build list of hidden children
    // console.log('in RAW before hidden-filter ', RAW.length);
    for ( var r = 0; r < RAW.length; r++) {
      // initial
      RAW[r].activated = false;
      RAW[r].pie.setMap(null);
      RAW[r].hidden_active_counter = 0;
      for ( var x = 0; x < RAW.length; x++) {
        if (RAW[r].id != RAW[x].id && (RAW[r].hidden != true && RAW[x].hidden != true)) {
          var dist = google.maps.geometry.spherical.computeDistanceBetween(RAW[r].position, RAW[x].position);
          if (dist < double_swell) {
            RAW[x].pie.setMap(null);
            RAW[x].hidden = true;
            // same origin for viewpos pies
            RAW[x].position = RAW[r].position;
            RAW[r].hideIds.push(RAW[x].id);
            RAW[r].hidePOIs.push(RAW[x]);
            RAW[r].hideother = true;
            RAW[r].setIcon(fh_marker_blue_cross);
            // console.log('add hidden x -> r ', RAW[x].id, ' to ', RAW[r].id);
            if ( LAST_ACTIVE_NID > -1 ) {
              if  ( RAW[x].id == LAST_ACTIVE_NID ) {
                 RAW[x].activated = true;
                 // console.log('last active hidden ID ', RAW[x].id);
                 RAW[r].setIcon(fh_marker_violet);
                 // console.log('show hidden poi viewpos ', RAW[x].id);
                 Drupal.futurehistoryEntdecken.setMapArrow(RAW[x], mapId);
              }
            }
          }
        }
      } // inner loop list hidden POIs
      if (RAW[r].hidden) {
        // already sorted in hidden list of sombody other
        // splice later
        continue;
      } 
    } // outer loop

    var r = RAW.length
    while (r--) {
      if (RAW[r].hidden == true) {
        // console.log('remove hidden from RAW ', RAW[r].id);
        RAW.splice(r, 1);
      }
    }
    // console.log('in RAW after hidden-filter ', RAW.length);

    // persistenz step 2 - after zoom, pan --> transfer state
    for ( var a = 0; a < LAST.length; a++) {
      for ( var r = 0; r < RAW.length; r++) {
        if ( RAW[r].id == LAST[a].id ) {
          // console.log('transfer state of marker ', LAST[a].id, ' to ', LAST[a].activated);
          RAW[r].activated = LAST[a].activated;
          for ( var b = 0; b < LAST[a].hidePOIs.length; b++) {
            for ( var x = 0; x < RAW[r].hidePOIs.length; x++) {
              if  ( RAW[r].hidePOIs[x].id == LAST[a].hidePOIs[b].id ) {
                // console.log('transfer state of hidden list member ', LAST[a].hidePOIs[b].id, ' > ', LAST[a].hidePOIs[b].activated);
                RAW[r].hidePOIs[x].activated = LAST[a].hidePOIs[b].activated
                // break;
              }
            }
          }
        }
      }
    }

    // set Icons / pie
    for ( var r = 0; r < RAW.length; r++) {
      if ( RAW[r].activated ) {
        Drupal.futurehistoryEntdecken.setMapArrow(RAW[r], mapId);
        RAW[r].setIcon(fh_marker_violet);
      }  else {
        // handle inactive
        if ( RAW[r].hideother ) {
          RAW[r].setIcon(fh_marker_blue_cross);
        } else {
          RAW[r].setIcon(fh_marker_blue);
        }
      }
      // look for active marker in hidden list
      for ( var x = 0; x < RAW[r].hidePOIs.length; x++) {
        if ( RAW[r].hidePOIs[x].activated ) {
          RAW[r].setIcon(fh_marker_violet);
          Drupal.futurehistoryEntdecken.setMapArrow(RAW[r].hidePOIs[x], mapId);
        }
      }
    }

    if (typeof markerCluster != "undefined") {
      // console.log('REMOVE last markerCluster ');
      markerCluster.setMap(null);
    }
    // console.log('NEW MarkerClusterer');
    markerCluster = new Drupal.futurehistoryEntdecken.MarkerClusterer(
      Drupal.futurehistoryEntdecken[mapId].map,
      RAW
    );
  }

  // Function: markerStateChange
  // hover and out the marker and thumbnails
  Drupal.futurehistoryEntdecken.markerStateChange = function(markerId, action, mapId, src) {
    markerId = markerId.toString();

    var ThumbInClusterProcessing = false;
    if ( src == 'THUMB' ) {
      // console.log('Click on Thumb ID ', markerId);
      for ( var i = 0; i < RAW.length; i++) {

        // first test incluster --> mark activated and leave here because zoom_event reload and reprocess all
        if ( RAW[i].id == markerId && RAW[i].incluster && RAW[i].activated == false) {
          // console.log(' zoom to cluster extend and exit markerStateChange ', markerId)
          // save state before cluster zoom: Lost avtive state before 
          LAST_ACTIVE_NID = markerId;
          Drupal.futurehistoryEntdecken[mapId].map.fitBounds(RAW[i].clusterBounds);
          RAW[i].activated = true;
          return false;
        }
        // test incluster of hidden --> leave here because zoom_event reload and reprocess all
        for ( var x = 0; x < RAW[i].hidePOIs.length; x++) {
          if ( RAW[i].hidePOIs[x].id == markerId) {
             if (RAW[i].incluster && RAW[i].hidePOIs[x].activated == false) {
               // console.log(' HIDDEN: zoom to cluster extend and exit markerStateChange ', markerId);
               // save state before cluster zoom: Lost avtive state before 
               LAST_ACTIVE_NID = markerId;
               Drupal.futurehistoryEntdecken[mapId].map.fitBounds(RAW[i].clusterBounds);
               RAW[i].hidePOIs[x].activated = true;
               return false;
             }
          }
        }
        // eof incluster test, if we passed here, (no inactive) thumb in cluster clicked
        // ...just close already open thumbs if they again in cluster (user zoomed out with still activated thumb)
      }

      activatedID = -1;
      for ( var i = 0; i < RAW.length; i++) {
        // check the state of this marker = ID only, no processing of all other marker...
        if ( RAW[i].id == markerId) {
          // markerId: parent clicked
          // console.log(' ID RAW[i].activated ', markerId, RAW[i].activated);
          if ( RAW[i].activated == true ) {
            // active parent thumb clicked --> close
            Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].id, mapId);
          } else {
            // inactive parent thumb clicked --> open
            activatedID = markerId;
            RAW[i].activated = true;
            $('#thumbnail-pois li#thumb_'+markerId+'').addClass('active');
            $('#tc-'+RAW[i].id+'').slideDown("slow");
            RAW[i].setIcon(fh_marker_violet);
            Drupal.futurehistoryEntdecken.setMapArrow(RAW[i], mapId);
            // deactivate all activated in this hiddenlist of parent
            for ( var y = 0; y < RAW[i].hidePOIs.length; y++) {
              if ( RAW[i].hidePOIs[y].activated == true) {
                Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].hidePOIs[y].id, mapId);
              }
            }
          }
        } else {
          // clicked on thumb of child marker
          for ( var x = 0; x < RAW[i].hidePOIs.length; x++) {
            if ( RAW[i].hidePOIs[x].id == markerId) { 
              // console.log(' ID RAW[i].hidePOIs[x].activated ', markerId, RAW[i].hidePOIs[x].activated);
              if (RAW[i].hidePOIs[x].activated == true) {
                // click on thumb of active child clicked  
                Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].hidePOIs[x].id, mapId);
              } else {
                // click on thumb of inactive child clicked  
                activatedID = markerId;
                RAW[i].hidePOIs[x].activated = true;
                $('#thumbnail-pois li#thumb_'+RAW[i].hidePOIs[x].id+'').addClass('active');
                $('#tc-'+RAW[i].hidePOIs[x].id+'').slideDown("slow");
                RAW[i].setIcon(fh_marker_violet);
                Drupal.futurehistoryEntdecken.setMapArrow(RAW[i].hidePOIs[x], mapId);
              }
            }
          } // eof loop all hidden Marker
        }
      }
      // deactivate all other, except the just activated 
      // console.log('just activated ID ', activatedID);
      for ( var i = 0; i < RAW.length; i++) {
        var found_in_hidden_list = false; 
        for ( var x = 0; x < RAW[i].hidePOIs.length; x++) {
          if ( RAW[i].hidePOIs[x].id == activatedID) {
            found_in_hidden_list = true; 
          } else {
            Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].hidePOIs[x].id, mapId);
          }
        }
        if ( RAW[i].id != activatedID && !found_in_hidden_list) {
          // deaktivate marker and all hidden marker
          Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].id, mapId);
        }
      }
      // console.log('leave THUMBclick with ANIMATION_RUNNING_NID: ', ANIMATION_RUNNING_NID);
      // click on thumb, job finished here
      return;
    }
    // Handling Marker selection in Map
    // console.log('select map marker - call markerStateChange on ', markerId, ' RAW data ', RAW);
    var activateIDX = -1;
    var deactivateIDX = -1;
    for ( var i = 0; i < RAW.length; i++) {
      if (RAW[i].id == markerId) {
        if (!RAW[i].activated) {
          activateIDX = i;
          // console.log('signal activate parent ', markerId);
        } else {
          // console.log('click on active: signal deactivate parent ', markerId);
          deactivateIDX = i;
        }
      }
    }
    if ( activateIDX > -1) {
      // activate selected marker, hide all other
      // console.log('activate ', RAW[activateIDX].id);
      RAW[activateIDX].activated = true;
      Drupal.futurehistoryEntdecken.setActiveMarker(RAW[activateIDX].id, mapId);
      // signal set: activate all in list of hidden
      for ( var x = 0; x < RAW[activateIDX].hidePOIs.length; x++) {
        RAW[activateIDX].hidePOIs[x].activated = true;
        // console.log('activate hidden child', markerId);
      }
      // hide all other 
      for ( var i = 0; i < RAW.length; i++) {
        for ( var x = 0; x < RAW[i].hidePOIs.length; x++) {
          if ( RAW[i].hidePOIs[x].id != markerId && RAW[i].id != markerId && RAW[i].hidePOIs[x].activated == true) {
            // console.log('---  deactivate hidden active marker', RAW[i].hidePOIs[x].id);
            Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].hidePOIs[x].id, mapId);
          }
        }
        if (RAW[i].id != markerId) {
          if (!RAW[i].activated) {
            Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].id, mapId);
          }
        }
      }
    }
    if ( deactivateIDX > -1) {
      // deactivate parent
      // console.log('deactivate parent', RAW[deactivateIDX].id);
      RAW[deactivateIDX].activated = false;
      Drupal.futurehistoryEntdecken.deactivateMarker(RAW[deactivateIDX].id, mapId);
      // signal set: deactivate all in list of hidden
      for ( var x = 0; x < RAW[deactivateIDX].hidePOIs.length; x++) {
        RAW[deactivateIDX].hidePOIs[x].activated = false;
        Drupal.futurehistoryEntdecken.deactivateMarker(RAW[deactivateIDX].hidePOIs[x].id, mapId);
        // console.log('deactivate hidden child', RAW[deactivateIDX].hidePOIs[x].id);
      }
    }
    if ($('#thumbnail-pois li.active').filter(":first")) {
      $('#thumbnail-pois').scrollTo($('#thumbnail-pois li.active').filter(":first"), 1000, {offset:3});
    }
  }

  // Function: deactivateViewPos
  Drupal.futurehistoryEntdecken.deactivateViewPos = function(markerID, mapId) {
    for ( var i = 0; i < RAW.length; i++) {
      if (RAW[i].id == markerID) {
        Drupal.futurehistoryEntdecken.delMapArrow(RAW[i]);
        Drupal.futurehistoryEntdecken.closeThumb(RAW[i]);
      } else {
        // additionally check for hidden active marker
        for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
          if (RAW[i].hidePOIs[x].id == markerID) {
            Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
            Drupal.futurehistoryEntdecken.closeThumb(RAW[i].hidePOIs[x]);
          }
        }
      }
    }
  }

   // Function: resetMarkerIcon
  Drupal.futurehistoryEntdecken.resetMarkerIcon = function(markerID, mapId) {
    // reset marker icon if necessary...
    // Falltüren check
    for ( var i = 0; i < RAW.length; i++) {
      var ActIcon = undefined;
      if (RAW[i].id == markerID) {
        if ( RAW[i].activated == false ) {
          ActIcon = fh_marker_blue;
          if (RAW[i].hideother) {
            ActIcon = fh_marker_blue_cross;
          }
          for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
            if ( RAW[i].hidePOIs[x].activated == true ) {
              ActIcon = fh_marker_violet;
            }
          }
        } else {
          ActIcon = fh_marker_violet;
        }
      } 
      if ( ActIcon === undefined) {
        // additionally check for hidden active marker
        var active_in_hidden_list = false;
        for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
          if ( RAW[i].hidePOIs[x].activated == true ) {
            active_in_hidden_list = true;
          }
        }
        for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
          if (RAW[i].hidePOIs[x].id == markerID) {
            if ( active_in_hidden_list == true ||  RAW[i].activated ) {
               ActIcon = fh_marker_violet;
            } else {
               ActIcon = fh_marker_blue_cross;
            }
          }
        }
      }
      if (ActIcon !== undefined) {
        RAW[i].setIcon(ActIcon); 
      }
    }
  }


  // Function: deactivateMarker
  Drupal.futurehistoryEntdecken.deactivateMarker = function(markerID, mapId) {
    var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();

    for ( var i = 0; i < RAW.length; i++) {
      if (RAW[i].id == markerID) {
        $('#thumbnail-pois li#thumb_'+RAW[i].id+'').removeClass('active');
        $('#tc-'+RAW[i].id+'').hide();
        Drupal.futurehistoryEntdecken.delMapArrow(RAW[i]);
        RAW[i].activated = false;
        // console.log('deactivate ', RAW[i].id)
        if (RAW[i].hideother) {
          RAW[i].setIcon(fh_marker_blue_cross);
          for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
            if ( zoomLevel > 18 ) {
              Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
            }
            $('#thumbnail-pois li#thumb_'+RAW[i].hidePOIs[x].id+'').removeClass('active');
            $('#tc-'+RAW[i].hidePOIs[x].id+'').hide();
            RAW[i].hidePOIs[x].activated = false;
          }
        } else {
          RAW[i].setIcon(fh_marker_blue);
        }
      } else {
        // additionally check for hidden active marker
        for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
          if (RAW[i].hidePOIs[x].id == markerID) {
            $('#thumbnail-pois li#thumb_'+RAW[i].hidePOIs[x].id+'').removeClass('active');
            $('#tc-'+RAW[i].hidePOIs[x].id+'').hide();
            RAW[i].hidePOIs[x].activated = false;
            if ( zoomLevel > 18 ) {
              Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
            }
          }
        }
      }
    }
  }

  // Function: setActiveMarker
  Drupal.futurehistoryEntdecken.setActiveMarker = function(activate_parent, mapId) {

    // console.log('in setActiveMarker ', activate_parent);
    for ( var i = 0; i < RAW.length; i++) {
      if (RAW[i].id == activate_parent) {
        $('#thumbnail-pois li#thumb_'+RAW[i].id+'').addClass('active');
        $('#tc-'+RAW[i].id+'').slideDown("slow");
        // console.log('activate ', RAW[i].id)
        RAW[i].activated = true;
        RAW[i].setIcon(fh_marker_violet);
        Drupal.futurehistoryEntdecken.setMapArrow(RAW[i], mapId);

        for ( var x = 0; x < RAW[i].hidePOIs.length; x++) {
          // console.log('activate hidden thumbs ', RAW[i].hidePOIs[x].id);
          $('#thumbnail-pois li#thumb_'+RAW[i].hidePOIs[x].id+'').addClass('active');
          $('#tc-'+RAW[i].hidePOIs[x].id+'').slideDown("slow");
          Drupal.futurehistoryEntdecken.setMapArrow(RAW[i].hidePOIs[x], mapId);
        }
      } else {
        // deactivate all other
        if ( RAW[i].activated ) {
          // console.log('deactivate ', RAW[i].id)
          Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].id, mapId);
          //Drupal.futurehistoryEntdecken.delMapArrow(RAW[i]);
          for ( var x = 0; x < RAW[i].hidePOIs.length; x++) {
            Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].hidePOIs[x].id, mapId);
            //Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
          }
        }
      }
    }
  }

  // placesMapAction Function for the google places actions
  Drupal.futurehistoryEntdecken.placesMapAction = function(place, mapId) {
    if ( place.geometry != undefined){
      // console.log('place ', place);
      var fh_cookie = {};
      LAST_place = place.geometry.location;
      mapCenter = place.geometry.location;
      if (place.geometry.viewport) {
        fh_cookie = {viewport:1, bounds:place.geometry.viewport, point:place.geometry.location } ;
        Drupal.futurehistoryEntdecken[mapId].map.fitBounds(place.geometry.viewport);
      } else {
        fh_cookie = {viewport:0, bounds:0, point:place.geometry.location} ;
        Drupal.futurehistoryEntdecken[mapId].map.setCenter(place.geometry.location);
        Drupal.futurehistoryEntdecken[mapId].map.setZoom(DEFAULT_ZOOM);
      }
      Drupal.futurehistoryEntdecken.markMapCenter(mapId, mapCenter);
      //console.log(' setCookie fh_geolocation_cookie ', JSON.stringify(fh_cookie));
      $.cookie('fh_geolocation_cookie', JSON.stringify(fh_cookie), {path: '/'});
    }
  };
  //End placesMapAction Function

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
  this.gridSize_ = options['gridSize'] || 40;

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
  this.dyngrid['15'] = '40';
  this.dyngrid['16'] = '40';
  this.dyngrid['17'] = '40';
  this.dyngrid['18'] = '40';
  this.dyngrid['19'] = '40';
  this.dyngrid['20'] = '40';
  this.dyngrid['21'] = '40';
  this.dyngrid['22'] = '40';
  this.dyngrid['23'] = '40';

/*
  this.dyngrid['13'] = '50';
  this.dyngrid['14'] = '40';
  this.dyngrid['15'] = '30';
  this.dyngrid['16'] = '20';
  this.dyngrid['17'] = '18';
  this.dyngrid['18'] = '16';
*/

  /**
   * @private
   */
  this.minClusterSize_ = options['minimumClusterSize'] || 5;


  /**
   * @type {?number}
   * @private
   */
  // Global var
  this.maxZoom_ = options['maxZoom'] || max_zoom;

  this.styles_ = options['styles'] || [];

  /**
   * @type {string}
   * @private
   * linde:
   */
  // this.FHclusterIcon = '/sites/default/files/gmap-files/fh-poi-blue.png'
  this.FHclusterIcon = '/sites/all/modules/futurehistory_entdecken/map-images/fh-poi-blue38.png'

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
  // linde: complete replaced
  /*
  var that = this;
  google.maps.event.addListener(this.map_, 'zoom_changed', function() {
    var zoom = that.map_.getZoom();

    if (that.prevZoom_ != zoom) {
      that.prevZoom_ = zoom;
      //that.repaint();
      //that.resetViewport(true);
    }
  });

  // double idle listener: getmarkers --> Filter hidden -> createCluster
  google.maps.event.addListener(this.map_, 'idle', function() {
    // console.log('----------------------- that.redraw() idle func');
    that.redraw();
  });
  */

  // Finally, add the markers
  if (opt_markers && opt_markers.length) {
    // console.log('Finally, add the markers to the Clusterer: ', opt_markers.length);
    this.addMarkers(opt_markers, false);
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
Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.onRemove = function () {
    this.setReady_(false);
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
  // zoom out - cluster eat single pois if true
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
    // console.log('Dragend CLUSTER event');
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
 if (ready == this.ready_) {return;}
  this.ready_ = ready;
  if (this.ready_) {
    if (!this.map) return;
    this.map_ = this.map;
    this.prevZoom_ = this.map.getZoom();

    // Add the map event listeners
    var that = this;
    this.zoom_changed_listener = google.maps.event.addListener(this.map_, 'zoom_changed', function() {
        var zoom = that.map_.getZoom();
        // console.log(' MarkerClusterer.prototype.setReady_ ZOOM changed func... ');
        if (that.prevZoom_ != zoom) {
          that.prevZoom_ = zoom;
          that.resetViewport();
        }
    });
    this.idle_listener = google.maps.event.addListener(this.map_, 'idle', function() {
        // console.log(' MarkerClusterer.prototype.setReady_ IDLE func... ');
        that.redraw();
    });

    // console.log(' former here were drawn the single markers independent from beeing cluster-member... ');
    // lindes cluster separator

    this.createClusters_();
    if(this.markers_ && this.markers_.length){
      for (var c = 0, cluster; cluster = this.clusters_[c]; c++) {
        // console.log('check all cluster length ', cluster.markers_.length);
        for ( var m = 0; m < cluster.markers_.length; m++) {
          if (cluster.markers_.length < this.minClusterSize_) {
            for ( var r = 0; r < RAW.length; r++) {
              if (RAW[r].id == cluster.markers_[m].id) {
                RAW[r].incluster = false;
                // console.log('incluster = false ', RAW[r].id);
              }
            }
            if (cluster.markers_[m].hidden == false) {
              // console.log('marker not in cluster ', cluster.markers_[m].id, ' data ', cluster.markers_[m]);
              cluster.markers_[m].setMap(this.map_);
            } else {
              // console.log('do not draw hidden pois', cluster.markers_[m].id);
              for ( var x = 0; x < cluster.markers_[m].hidePOIs.length; x++) {
                // console.log('iterate hidden list ', cluster.markers_[m].hidePOIs[x]);
                if ( cluster.markers_[m].hidePOIs[x].activated ) {     
                  // console.log('but draw viewpos of activated hidden pois', cluster.markers_[m].hidePOIs[x].id);
                  Drupal.futurehistoryEntdecken.setMapArrow(cluster.markers_[m].hidePOIs[x], mapId);
                }
              }
            }
          } else {
            // Cluster extent to RAW-data (Thumb-Click...)
            for ( var r = 0; r < RAW.length; r++) {
              if (RAW[r].id == cluster.markers_[m].id) {
                RAW[r].clusterBounds = cluster.getBounds();
                // console.log('incluster = false ', RAW[r].id);
              }
            }
          }
        }
      }
    }
  } else {
    this.resetViewport(true);
    if(this.zoom_changed_listener) {
        google.maps.event.removeListener(this.zoom_changed_listener);
        this.zoom_changed_listener = undefined;
    }
    if(this.idle_listener) {
        google.maps.event.removeListener(this.idle_listener);
        this.idle_listener = undefined;
    }
    this.map_ = null;
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
  // console.log('zoom ', this.map_.getZoom());
  // console.log('gridSize: ', dyngrid[this.map_.getZoom()]);
  return this.dyngrid[this.map_.getZoom()];

  //return thisteClusters_.gridSize_;
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
  // console.log (this.getGridSize());
  // console.log (this.gridSize_);
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
  this.resetViewport(true);
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
  // console.log('redraw by calling createClusters_()');
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
    // console.log('addMarker to cluster ', marker.id, ' C: ', clusterToAddTo.markers_);
    clusterToAddTo.addMarker(marker,true);
  } else {
    var cluster = new Drupal.futurehistoryEntdecken.Cluster(this);
    // console.log('addMarker to NEW cluster ', marker.id);
    cluster.addMarker(marker);
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
    // console.log('not ready in createClusters_()');
    return;
  }
  // Get our current map view bounds.
  // Create a new bounds object so we don't affect the map.
  // console.log('ready in createClusters_()');
  var mapBounds = new google.maps.LatLngBounds(this.map_.getBounds().getSouthWest(),
      this.map_.getBounds().getNorthEast());
  var bounds = this.getExtendedBounds(mapBounds);

  for (var i = 0, marker; marker = this.markers_[i]; i++) {
    if (!marker.isAdded && this.isMarkerInBounds_(marker, bounds)) {
      // console.log('+ createClusters_()', marker.id);
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
  //marker.setMap(null);
  this.markers_.push(marker);

  var len = this.markers_.length;

  if (len < this.minClusterSize_ && marker.getMap() != this.map_) {
    // Min cluster size not reached so show the marker.
    //marker.setIcon(fh_marker_blue);
    //marker.setMap(this.map_);
    marker.setMap(null);
  }


  if (len == this.minClusterSize_) {
    // Hide the markers that were showing.
    for (var i = 0; i < len; i++) {
      // console.log('marker in cluster ',marker.id);
      //FHclusterIDs.push(marker.id);
      //console.log('push FHclusterIDs: ',marker.id);
      marker.setMap(null);
    }
  }


  if (len >= this.minClusterSize_) {
    //FHclusterIDs.push(marker.id);
    // console.log('push FHclusterIDs: ',marker.id);
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
      // console.log('maxzoom show all single marker');
      marker.setMap(this.map_);
    }
    return;
  }

  if (this.markers_.length < this.minClusterSize_) {
    // Min cluster size not yet reached.
    // console.log('Min cluster size not yet reached clusterIcon_.hide() ');
    this.clusterIcon_.hide();
    return;
  }

  var numStyles = this.markerClusterer_.getStyles().length;
  var sums = this.markerClusterer_.getCalculator()(this.markers_, numStyles);
  this.clusterIcon_.setCenter(this.center_);
  this.clusterIcon_.setSums(sums);
  // console.log('clusterIcon_.setSums(sums) ', sums);
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
      console.log("Drupal.behaviors.futurehistoryEntdecken");
      console.log("INIT");
      var mapId = '';
      var placesId = '';

      // Daniel Frings: Portal first & last date :)
      // var portal_date_first = Drupal.settings.futurehistoryEntdecken.first_date;
      // var portal_date_last = Drupal.settings.futurehistoryEntdecken.last_date;
      InitYearRange = [ Drupal.settings.futurehistoryEntdecken.first_date, Drupal.settings.futurehistoryEntdecken.last_date ];

      // console.log('time bounds fotos: ', portal_date_first + ' - ' + portal_date_last);

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
          // call the map actions function
          // console.log('place changed ... delete last_viewcookie...');
          Drupal.futurehistoryEntdecken.placesMapAction(fh_place, mapId);
        });
      }); // End EACH Funktion



      $('.futurehistory-entdecken-map', context).each(function() {


        // MAP STUFF
        // The MAP div is located in "futurehistory-entdecken-map.tpl.php" 
        // and feed with the $atribute options created in "futurehistory_entdecken_plugin_style_google_map.inc" i
        // and the associated VIEW in the Drupal Backend

        var $this = $(this);
        mapIdGlobal = mapId = this.id;
        Drupal.futurehistoryEntdecken[mapId] = {};

        // ajax request to get categories
        $.ajax({
          url: cat_url,
          // mapping must be complete before continuing, keep callback slim
          async: false, 
          method: 'get',
          data: {vid:'6'},
          dataType: 'json',
          success: function(data) {
            var kategory_selector_content = '<form><fieldset><table id="kategory_selector_table">'
            var cnt = 1;
            for ( var i=0; i < data.length; i++) {
              // build categorie mapping for usage in permalinks
              var key = data[i]['Begriff-ID'];
              var kn  = data[i].name;
              // build GUI for categorie filter
              CAT[key] = kn;
              if (i % 3 === 0) {
                 kategory_selector_content += '<tr>'
              }
              kategory_selector_content += '<td><label><input type="checkbox" id="cat_' + key + '" name="cat_' + key + '" value="' + key + '" checked="checked">&nbsp;' + kn + '</label></td>';
              if ((i+1) % 3 === 0) {
                 kategory_selector_content += '</tr>'
              }
            }
            kategory_selector_content += '</table></fieldset></form>';

            // estabilsh Cat selction GUI in DIV
            $('#kategory_selector').html(kategory_selector_content);
            for ( key in CAT ) {
              toggleCategory(key);
            }
          }
        });


        // first cookie check - where did we come from?
        // if cookie ok we override the default map values and initials
        var fh_geolocation_cookie_data = JSON.parse($.cookie("fh_geolocation_cookie"));
        // console.log(' fh_geolocation_cookie_data ', fh_geolocation_cookie_data);
        
        var fh_lastview_cookiedata = JSON.parse($.cookie('fh_lastview_cookie'));

        if (mapCenter == undefined) {
          // in der Nähe von Kassel mit der Zoomstufe 6
          // console.log(' mapCenter undefined ');
          var initial_center_lat = 51.31491849367987;
          var initial_center_lng = 9.460614849999956; 
          mapCenter =  new google.maps.LatLng(initial_center_lat,initial_center_lng);
          mapZoom = 6;
        } 
        else {
          mapZoom = DEFAULT_ZOOM;
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
        // initial clear center marker, redo from URL, cookies or places
        Drupal.futurehistoryEntdecken[mapId].center_marker = undefined;

        if (window.location.hash.length > 1) {
          // set view parameters from URL hash
          // console.log(' set location from URL ', window.location.hash);
          mapCenter = new google.maps.LatLng(parseFloat(window.location.hash.split('#')[1]), parseFloat(window.location.hash.split('#')[2]));
          mapZoom = parseInt(window.location.hash.split('#')[3]);
          kategorie = window.location.hash.split('#')[4].split(',');
          // console.log('get kategorie from hash ID ', kategorie);

          YearRange[0] = parseInt(window.location.hash.split('#')[5].split('--')[0]);
          YearRange[1] = parseInt(window.location.hash.split('#')[5].split('--')[1]);
          RequestDate = String(YearRange[0]) + '--' + String(YearRange[1]);
          sort = window.location.hash.split('#')[6];
          // console.log('RequestDate from hash ', YearRange);
          // console.log('sort from hash ', sort);
          Drupal.futurehistoryEntdecken[mapId].map.setCenter(mapCenter);
          Drupal.futurehistoryEntdecken[mapId].map.setZoom(mapZoom);
        } else if (fh_geolocation_cookie_data != null) {
            // if the cookie fh_geolocation_cookie_data contains a viewport override the map zoom with the viewport
            // console.log('No URL instructions, use fh_geolocation_cookie_data ', fh_geolocation_cookie_data);
            // Overwrite: 2016-11-23: Zoomstufe bei 
            // Strasse + Hausnummer + Stadt 
            // Strasse + Stadt 
            // Gebäude + Stadt 
            // einheitlich 17
            mapZoom = DEFAULT_ZOOM;
            Drupal.futurehistoryEntdecken[mapId].map.setZoom(DEFAULT_ZOOM);
            if (parseInt(fh_geolocation_cookie_data.viewport) == 1) {
              var map_viewport = fh_geolocation_cookie_data.bounds;
              Drupal.futurehistoryEntdecken[mapId].map.fitBounds(map_viewport);
            } else if (parseFloat(fh_geolocation_cookie_data.point.lat) && parseFloat(fh_geolocation_cookie_data.point.lng)) {
              mapCenter  = new google.maps.LatLng(fh_geolocation_cookie_data.point);
              Drupal.futurehistoryEntdecken[mapId].map.setCenter(mapCenter);
            }
            Drupal.futurehistoryEntdecken.markMapCenter(mapId, new google.maps.LatLng(fh_geolocation_cookie_data.point));
            mapCenter = Drupal.futurehistoryEntdecken[mapId].map.getCenter();
            // console.log(' delete fh_geolocation_cookie ');
          $.cookie('fh_geolocation_cookie', null, { path: '/' });
        } else if (fh_lastview_cookiedata != null) {
            // Back from BildDetail
            // console.log('Back from BildDetail fh_lastview_cookiedata ', fh_lastview_cookiedata);
            if (fh_lastview_cookiedata.viewport == '1') {
              LAST_ACTIVE_NID = fh_lastview_cookiedata.nid;

              var markLat = parseFloat(fh_lastview_cookiedata.place_lat);
              var markLng = parseFloat(fh_lastview_cookiedata.place_lng);
              if ( markLat <= 90 && markLng <= 180) {
                // ...is a place on earth
                var markCenter =  new google.maps.LatLng(markLat, markLng);
                Drupal.futurehistoryEntdecken.markMapCenter(mapId, markCenter);
              }

              // global var
              mapCenter = new google.maps.LatLng(parseFloat(fh_lastview_cookiedata.lat),parseFloat(fh_lastview_cookiedata.lng));
              Drupal.futurehistoryEntdecken[mapId].map.setCenter(mapCenter);
              Drupal.futurehistoryEntdecken[mapId].map.setZoom(parseFloat(fh_lastview_cookiedata.zoom));
              if(fh_lastview_cookiedata.zoom <=18) {
                Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
              }
              else {
                Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.HYBRID);
                Drupal.futurehistoryEntdecken[mapId].map.setTilt(0);
              }
            }
            // use cookie only once, remove
            // console.log(' delete fh_lastview_cookiedata ');
            $.cookie('fh_lastview_cookie', null, { path: '/' });
        }

        // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
        window.onpopstate = function(event) {
          CALL_onpopstate = true;
          // console.log(" !! onpopstate location: " + document.location + " state ==  " + JSON.stringify(event.state));
          
          var laststate = JSON.parse(JSON.stringify(event.state));
          if (laststate) {
            // console.log(' HISTORY back...', laststate.view );
            $('#places-autocomplete-map').val('');
            $('#places-autocomplete-map').blur();
            var LastMapCenter = new google.maps.LatLng(parseFloat(laststate.view.split('#')[1]), parseFloat(laststate.view.split('#')[2]));
            mapZoom = parseInt(laststate.view.split('#')[3]);
            Drupal.futurehistoryEntdecken[mapId].map.setCenter(LastMapCenter);
            Drupal.futurehistoryEntdecken[mapId].map.setZoom(mapZoom);
          }
        };

        // start google maps IDLE function and ask for the boundingbox .getBounds
        // todo: maybe the idle function is not the best choice? the pois load realy slow
        google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, 'idle', function() {
            bounds = Drupal.futurehistoryEntdecken[mapId].map.getBounds();
            if (Drupal.futurehistoryEntdecken[mapId].center_marker == undefined) {
              // center marker not present, comming from FH start location selection.... set initial Center Marker
              mapCenter = new google.maps.LatLng(Drupal.futurehistoryEntdecken[mapId].map.getCenter().lat(),Drupal.futurehistoryEntdecken[mapId].map.getCenter().lng());
              Drupal.futurehistoryEntdecken.markMapCenter(mapId, mapCenter);
            }
            Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
	});

        // right click set hash to reconstruct view from URL
        google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, "rightclick", function(event) {
          var coords = Drupal.futurehistoryEntdecken[mapId].map.getCenter();
          var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();

          var CC = Drupal.futurehistoryEntdecken[mapId].map.controls[google.maps.ControlPosition.TOP_CENTER];
          if (CC.length) {
            CC.forEach( function ( element, index ) {
              CC.clear(index);
            } );
            return;
          }
          var reqDate = String($("#time_slider").slider("values", 0) + "--" + $("#time_slider").slider("values", 1));
          var baseUrl = window.location.origin+window.location.pathname;
          var centerControlDiv = document.createElement('div');
          var permaUrl  =  baseUrl + encodeURI('#' + coords.lat() +
                                  '#' + coords.lng() +
                                  '#' + Drupal.futurehistoryEntdecken[mapId].map.getZoom() +
                                  '#' + kategorie.toString() +
                                  '#' + reqDate +
                                  '#' + sort);

          var permalink = '<a href="' + permaUrl + '">' + permaUrl + '</a>';
          centerControlDiv.index = 1;
          var centerControl = new CenterControl(centerControlDiv, Drupal.futurehistoryEntdecken[mapId].map, permalink);
          centerControlDiv.index = 1;
          Drupal.futurehistoryEntdecken[mapId].map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
        });

        google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, 'dragend', function() {
           // use new center for sorting markers if no place defined 
           // set global
           //mapCenter =  new google.maps.LatLng(Drupal.futurehistoryEntdecken[mapId].map.getCenter().lat(),Drupal.futurehistoryEntdecken[mapId].map.getCenter().lng());
           mapCenter = Drupal.futurehistoryEntdecken[mapId].map.getCenter();
           var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
           // history back again fires a dragend or zoom_changed event via onpopState, then we stay in place.... filter out
           if (!CALL_onpopstate) {
             var view = '#' + encodeURI(mapCenter.lat() + '#' + mapCenter.lng() + '#' + Drupal.futurehistoryEntdecken[mapId].map.getZoom());
             history.pushState({view:view}, '', '');
             // console.log(' pushState ', view );
           } else {
             CALL_onpopstate = false;
           }
        });

        // switch the map type on established zoom level
        google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, 'zoom_changed', function() {
          // console.log(' zoom_changed, pushState ');
          var coords = Drupal.futurehistoryEntdecken[mapId].map.getCenter();
          var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
          if(zoomLevel <=18) {
            Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
          }
          else {
            Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.HYBRID);
            Drupal.futurehistoryEntdecken[mapId].map.setTilt(0);
          }
          // history back again fires a dragend or zoom_changed event via onpopState, then we stay in place.... filter out
          if (!CALL_onpopstate) {
            var view = '#' + encodeURI(coords.lat() + '#' + coords.lng() + '#' + Drupal.futurehistoryEntdecken[mapId].map.getZoom());
            history.pushState({view:view}, '', '');
            // console.log(' pushState ', view );
          } else {
            CALL_onpopstate = false;
          }
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
          clearDirectionsMarkers();
          kategorie = ['all'];
          for ( key in CAT ) {
            // deactivate all checkboxes
            $('#cat_'+key).prop("checked", false );
          }
          $("#time_slider").slider('values',InitYearRange); // reset
          $("#time_range").val( "Jahr " + InitYearRange[0] + " - Jahr " + InitYearRange[1] );
          RequestDate = String(InitYearRange[0]) + '--' + String(InitYearRange[1]);
          // console.log(' kategorie array: ', kategorie);
          Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);

        });

        // sort checkboxes 
        $("#fh_sort_dist").change(function() {
          $(this).prop("checked") ?  sort = 'dist' : sort = 'year';
          // console.log('sort criteria change to ', sort);
          Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
          $('#thumbnail-pois').scrollTo($('#thumbnail-pois li').filter(":first"), 10, {offset:3});
	});
        $("#fh_sort_year").change(function() {
          $(this).prop("checked") ?  sort = 'year' : sort = 'dist';
          // console.log('sort criteria change to ', sort);
          Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
          $('#thumbnail-pois').scrollTo($('#thumbnail-pois li').filter(":first"), 10, {offset:3});
	});

        // Daniel Frings: initial Portal first & last date :)
        //var portal_date_first = Drupal.settings.futurehistoryEntdecken.first_date;
        //var portal_date_last = Drupal.settings.futurehistoryEntdecken.last_date;
        InitYearRange = [ Drupal.settings.futurehistoryEntdecken.first_date, Drupal.settings.futurehistoryEntdecken.last_date ];
        if (YearRange.length) {
          // YearRange from URL hash
          Drupal.futurehistoryEntdecken.DateSlider(mapId, YearRange);
       } else {
          Drupal.futurehistoryEntdecken.DateSlider(mapId, InitYearRange);
       }

      });  //End EACH Funktion

      // reflect THUMB sort criteria from URL hash if present
      if (sort == 'year') { 
        $("#fh_sort_year").prop('checked', true);
      }
      if (sort == 'dist') { 
        $("#fh_sort_dist").prop('checked', true);
      }

      // reflect kategorie from URL hash if present
      for ( key in CAT ) {
        if (kategorie.indexOf(key) > -1) { 
          $('#cat_'+key).prop('checked', true);
          //console.log('Activate checkbox ', CAT[key]);
        } else {
          $('#cat_'+key).prop('checked', false);
        }
      }

      function toggleCategory(IDcat) {
        $('#cat_'+IDcat).change(function(IDcat) {
          // console.log('cat checkbox ', $(this).val(),' checked ? ',  $(this).prop("checked"));
          var actKat = $(this).val();
          // rebuild kategorie arry depending on checkbox state
          $(this).prop("checked") ?  kategorie.push($(this).val()) : kategorie = $.grep(kategorie, function(v) { return v != actKat; });
          // console.log(' toggleCategory change event, new kategorie array: ', kategorie);
          if (kategorie.length > 1) {
            // there is a category filter and perhaps all:
            // remove all if present
            var k = kategorie.length
            while (k--) {
              if (kategorie[k] == 'all') {
                kategorie.splice(k, 1);
              }
            }
          }
          // console.log(' using kategorie array for new Request: ', kategorie);
          Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
        });
      }

      function CenterControl(controlDiv, map, link) {

        // Set CSS for the control border.
        var controlUI = document.createElement('div');
        controlUI.style.backgroundColor = '#fff';
        controlUI.style.border = '2px solid #fff';
        controlUI.style.borderRadius = '3px';
        controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
        controlUI.style.cursor = 'pointer';
        controlUI.style.marginBottom = '22px';
        controlUI.style.textAlign = 'center';
        controlUI.title = 'right click to copy link, right click in map to hide link';
        controlDiv.appendChild(controlUI);

        // Set CSS for the control interior.
        var controlText = document.createElement('div');
        controlText.style.color = 'rgb(25,25,25)';
        controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
        controlText.style.fontSize = '12px';
        controlText.style.lineHeight = '20px';
        controlText.style.paddingLeft = '5px';
        controlText.style.paddingRight = '5px';
        controlText.innerHTML = link;
        controlUI.appendChild(controlText);

      }

    // ending all the drupal behaviors,atach, settings stuff..
    }
  };
})(jQuery);

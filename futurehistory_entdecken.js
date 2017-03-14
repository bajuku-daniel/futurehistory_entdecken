(function ($) {
    Drupal.futurehistoryEntdecken = Drupal.futurehistoryEntdecken || {};

    //fixed and initial values

    var CALL_onpopstate = false;
    var RAW = [];
    var CAT = {};
    var DEFAULT_ZOOM = 17;
    var LAST_ACTIVE_NID = -1;
    var markerCluster;
    var InitYearRange = [1000, 2016];
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
    var overlay_url = '/de/flag-lists/links/js' // add nid in the request
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

    // Function: generateModal
    // Generate the Modal "add to tour / collection" - modal link structure in flag_list.module and futurehistory-entdecken-map.tpl.php
    Drupal.futurehistoryEntdecken.generateModal = function (nid, mapId) {
        var tourCreateAccess = Drupal.settings.futurehistoryEntdecken.tour_access;  // get the acces setting generated in futurehistory_entdecken_plugin_style_google_map.php

        if (tourCreateAccess == true) {
            $.get(overlay_url + '?nid=' + nid, function (html) {
                $('#add-to-modal .modal-add-body').html(html); // get and push the html
                $('#add-to-modal').modal('show', {backdrop: 'static'});
                Drupal.flagLink(); // call flaglink funktion for the link toggle
                Drupal.futurehistoryEntdecken.setLastViewCookie(nid, mapId);
            });
        } else {
            Drupal.futurehistoryEntdecken.setLastViewCookie(nid, mapId);
            $('#login-modal').modal('show', {backdrop: 'static'}); // not authorized - log me in scotty ;)
        }
    }

    //google map style elements
    var map_styles = [{"featureType": "poi.park", "stylers": [{"visibility": "on"}]}, {
        "featureType": "poi.attraction",
        "stylers": [{"visibility": "on"}]
    }, {"featureType": "poi.business", "stylers": [{"visibility": "off"}]}, {
        "featureType": "poi.government",
        "stylers": [{"visibility": "on"}]
    }, {"featureType": "poi.medical", "stylers": [{"visibility": "off"}]}, {
        "featureType": "poi.school",
        "stylers": [{"visibility": "off"}]
    }, {"featureType": "poi.place_of_worship", "stylers": [{"visibility": "on"}]}, {
        "featureType": "poi.school",
        "stylers": [{"visibility": "off"}]
    }];
    // Function: markMapCenter
    // set the "center" - marker to calculate the distance
    Drupal.futurehistoryEntdecken.markMapCenter = function (mapId, Center) {
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
    Drupal.futurehistoryEntdecken.delMapArrow = function (marker) {
        // remove marker viewdirection
        marker.pie.setMap(null);
        marker.activated = false;
        // console.log(' del marker viewdir', marker.id);
        return false;
    }

    // Function: closeThumb
    Drupal.futurehistoryEntdecken.closeThumb = function (marker) {
        $('#thumbnail-pois li#thumb_' + marker.id + '').removeClass('active');
        $('#tc-' + marker.id + '').hide();
        marker.activated = false;
        return false;
    }


    // Function: deactivateAllMarker
    // deactivate all Marker
    Drupal.futurehistoryEntdecken.deactivateAllMarker = function (mapId) {
        for (var i = 0; i < RAW.length; i++) {
            // console.log('call Deactivate Marker', RAW[i].id);
            Drupal.futurehistoryEntdecken.deactivateMarker(mapId, RAW[i].id);
        }
    }

    // Function: deactivateMarker
    // deactivate Marker
    Drupal.futurehistoryEntdecken.deactivateMarker = function (id, mapId) {
        for (var i = 0; i < RAW.length; i++) {
            if (RAW[i].id === id) {
                // console.log('func deactM ', RAW[i].id);
                RAW[i].activated = false;
                if (RAW[i].hideother) {
                    // console.log('set fh_marker_blue_cross ', RAW[i].id);
                    RAW[i].setIcon(fh_marker_blue_cross);
                    // iterate through hidden marker list
                    for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                        // console.log('Deactivate hidden ', RAW[i].hidePOIs[x].id);
                        Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
                        $('#thumbnail-pois li#thumb_' + RAW[i].hidePOIs[x].id + '').removeClass('active');
                        $('#tc-' + RAW[i].hidePOIs[x].id + '').hide();
                    }
                } // all hidden marker
                Drupal.futurehistoryEntdecken.delMapArrow(RAW[i]);
                $('#thumbnail-pois li#thumb_' + id + '').removeClass('active');
                $('#tc-' + id + '').hide();
            } else {
                // test if id is in hidden list
                for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
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
    Drupal.futurehistoryEntdecken.setMapArrow = function (marker, mapId) {

        // console.log(' set marker viewdir', marker.pie);
        marker.pie.setMap(null);
        var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
        if (zoomLevel <= 18) {
            return false;
        }
        var i = marker.id;
        var standpunkt = marker.position;
        var distance = 50;
        var heading = marker.direction;
        var half_openangle = marker.angle / 2;

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
        google.maps.event.addDomListenerOnce(marker.pie, 'click', function () {
            // console.log(' oneway click event on viewpos  ', i, ' map ', mapId);
            Drupal.futurehistoryEntdecken.deactivateViewPos(i, mapId);
            Drupal.futurehistoryEntdecken.resetMarkerIcon(i, mapId);
            // close all on parent click --> Drupal.futurehistoryEntdecken.deactivateMarker(i, mapId);
        });
        return false; // if called from <a>-Tag
    }

    //Function: DateSlider
    //used for initialization abnd reset
    Drupal.futurehistoryEntdecken.DateSlider = function (mapId, InitYearRange) {
        // the Date Range : date=all <-- all dates, date=--1990 <-- all bevfore 1990, date=1990-- <-- all after 1990, date=1800--1990 <-- all between 1800 and 1990
        // date slider stuff (linde@webgis.de, 2016/05)
        $("#time_slider").slider({
            range: true,
            min: parseInt(Drupal.settings.futurehistoryEntdecken.first_date),
            max: parseInt(Drupal.settings.futurehistoryEntdecken.last_date),
            values: InitYearRange,
            slide: function (event, ui) {
                $("#time_range").val("Jahr " + ui.values[0] + " - Jahr " + ui.values[1]);
                RequestDate = String(ui.values[0]) + '--' + String(ui.values[1]);
            }
        });
        // time range display in GUI
        $("#time_range").val("Jahr " + $("#time_slider").slider("values", 0) + " - Jahr " + $("#time_slider").slider("values", 1));
        // on stop Slider inteaction: fire gmap idle event --> ajax Request....
        $("#time_slider").on("slidestop", function (event, ui) {
            Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
        });


    };

    //Function: getMarkers
    //Returns a Marker array from the bbox request // sets class indictor according to selected filters
    //Parameters: bounds, date, kategorie

    Drupal.futurehistoryEntdecken.getMarkers = function (bounds, RequestDate, kategorie, sort, mapId, mapCenter) {
        _log("window.firstCall");
        _log(arguments.callee.caller.name);
        if (window.firstCall === undefined) {
            window.firstCall = false;
            var state = checkStateCookie();
            if(state !== false){
                // _log(state);
                // _log(state.initializeOnPageLoad);
                RequestDate = state.RequestDate;
                kategorie = state.kategorie;
                author = state.author;
                mapCenter = state.mapcenter;
                lastShowTourOnMapCall = state.lastShowTourOnMapCall;
                // tourdisply_is_Active = state.tourdisply_is_Active;
                // _log("window.firstCall END");
            }
        }

        clearAjaxCalls();
        initializeRequestArgIndicator();

        var RequestArgs = getRequestArgs(bounds, RequestDate, kategorie);


        // start the ajax request
        ajaxXHR["gm"] = $.ajax({
            url: poi_url,
            method: 'get',
            data: RequestArgs,
            dataType: 'json',
            success: function (data) {
                var marker_content = data;
                if (!tourdisply_is_Active) {
                    if (directionsDisplay.setMap) {
                        directionsDisplay.setMap(null);
                        directionsDisplay.setDirections({routes: []});
                    }
                    Drupal.futurehistoryEntdecken.setMapMarkers(marker_content, mapId);
                    Drupal.futurehistoryEntdecken.setMapThumbnails(marker_content, mapId, mapCenter);
                    Drupal.futurehistoryEntdecken.initializeToursAuthorCategoryData(data);
                    setStateCookie(RequestDate);

                }
            }
        });
    }



    /**
     * initializeToursAuthorCategoryData
     *
     * Parse result Data for Filter interaction
     *
     * @param data
     */
    Drupal.futurehistoryEntdecken.initializeToursAuthorCategoryData = function (data) {
        var item, attr, tourdata;
        var tours_unique = [];
        var toursDataInResult = [];
        var pois_by_author = [];
        var pois_by_category = [];
        var uidAuthorData = [];

        // reset
        // pois_by_nid = [];

        var cat_ids_by_name = [];
        for (key in CAT) {
            cat_ids_by_name[CAT[key]] = key;
        }

        currentResultCount = data.length;

        for (item in data) {
            if (pois_by_author[data[item]['uname']] === undefined) {
                pois_by_author[data[item]['uname']] = [];
            }
            pois_by_author[data[item]['uname']].push(data[item]);

            if (data[item]['kategorie'] !== null) {
                // categories can be in csv format
                //
                var kategorie_texts = data[item]['kategorie'];
                if (kategorie_texts.indexOf(',') != -1) {
                    kategorie_texts = data[item]['kategorie'].split(',');
                } else {
                    kategorie_texts = [kategorie_texts];
                }

                var len = kategorie_texts.length;
                var kategorie_text;
                while (len--) {
                    kategorie_text = $.trim(kategorie_texts.splice(0, 1)[0]);
                    var kategorie_id = cat_ids_by_name[kategorie_text];

                    if (kategorie_id !== undefined) {
                        if (!isArray(pois_by_category[kategorie_id])) {
                            pois_by_category[kategorie_id] = [];
                        }
                        pois_by_category[kategorie_id].push(data[item]);
                    }
                }
            }

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
        setUpdateCategories(pois_by_category);
        initializeAccordions();



    }


    /**
     * global variables
     *
     */
    var author = [];
    var ajaxXHR = [];
    var pois_by_nid = [];
    var directionsDisplay = [];
    var tourdisply_is_Active = false;
    var tour_url = '/de/fh_view/list_tour_content';
    var use_eval_to_call_last_calculateAndDisplayRoute = '';
    var lastShowTourOnMapCall = [];
    var requestArgIndicatorClass = "";
    var currentResultCount = 0;

// Function wrapping code.
// fn - reference to function.
// context - what you want "this" to be.
// params - array of parameters to pass to function.
    var wrapFunction = function (fn, context, params) {
        return function () {
            fn.apply(context, params);
        };
    }

    function isArray(obj) {
        return !!obj && obj.constructor === Array;
    }

    function _log(value) {
        try {
            console.log(arguments.callee.caller.name+': ',value);
        } catch (err) {
            // no problems when no console
        }
    }

    function enableFilterUI() {
        jQuery("#time_slider").slider('enable');
        jQuery("#thumbnail-filter-box input:radio").attr('disabled', false);
        jQuery("#thumbnail-filter-box input:checkbox").attr('disabled', false);
        $("#kategory_selector").prev().removeClass("ui-state-disabled");
        $("#author_selector").prev().removeClass("ui-state-disabled");
    }

    function disbleFilterUI() {
        jQuery("#time_slider").slider('disable');
        jQuery("#thumbnail-filter-box input:radio").attr('disabled', true);
        jQuery("#thumbnail-filter-box input:checkbox").attr('disabled', true);
        $("#kategory_selector").prev().addClass("ui-state-disabled");
        $("#author_selector").prev().addClass("ui-state-disabled");
    }

    /**
     *
     * @param tourID
     */
    function showTourOnMap(tour_id, tourname, distance) {
        // _log("showTourOnMap",tour_id,tourname,distance);

        lastShowTourOnMapCall = [tour_id, tourname, distance];
        // start the ajax request to get tour details
        ajaxXHR["stom"] = $.ajax({
            url: tour_url,
            method: 'get',
            data: "tour_id=" + tour_id,
            dataType: 'json',
            success: function (tourdata) {
                var original_tourdata = [];
                for (item in tourdata) {
                    if ('nid' in tourdata[item]) {
                        var poi = pois_by_nid[tourdata[item]['nid']];
                        if(typeof poi !== 'undefined'){
                            original_tourdata.push(poi);
                        }

                    }
                }

                // clearDirectionsMarkers();
                if (directionsDisplay.setMap) {
                    directionsDisplay.setMap(null);
                    directionsDisplay.setDirections({routes: []});
                }

                var directionsService = new google.maps.DirectionsService;
                directionsDisplay = new google.maps.DirectionsRenderer({
                    polylineOptions: {
                        strokeOpacity: 0.8,
                    }
                });
                directionsDisplay.setMap(Drupal.futurehistoryEntdecken[mapIdGlobal].map);
                directionsDisplay.setOptions({suppressMarkers: true});

                calculateAndDisplayRoute(directionsService, directionsDisplay, original_tourdata, distance);
                use_eval_to_call_last_calculateAndDisplayRoute = wrapFunction(calculateAndDisplayRoute, this, [directionsService, directionsDisplay, original_tourdata, distance]);

                tourdisply_is_Active = true;
                setStateCookie(RequestDate);
                jQuery('#tour_selector').parent().find('h3').first().find('span').last().html(tourname);

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



    function initializeRequestArgIndicator() {
        if (tourdisply_is_Active && (requestArgIndicatorClass.indexOf("tour") == -1)) {
            requestArgIndicatorClass += ' tour';
        } else {
            requestArgIndicatorClass = '';
        }

        // check kategorie for changes
        if (isArray(kategorie) && kategorie.length > 0 && kategorie[0] !== 'all' && (requestArgIndicatorClass.indexOf("kategorie") ==-1)) {
            requestArgIndicatorClass = requestArgIndicatorClass + ' kategorie';
        }

        // check author for changes
        if (author.constructor === Array && author.length > 1 && (requestArgIndicatorClass.indexOf("author") ==-1)) {
            requestArgIndicatorClass = requestArgIndicatorClass + ' author';
        } else if (author.constructor === Array && author.length == 1 && (requestArgIndicatorClass.indexOf("author") ==-1)) {
            requestArgIndicatorClass = requestArgIndicatorClass + ' author';
        }

        // check date range for changes
        var dateDefaultStateCheck = (RequestDate !== 'all') &&
            (RequestDate !== (parseInt(Drupal.settings.futurehistoryEntdecken.first_date) + "--" + parseInt(Drupal.settings.futurehistoryEntdecken.last_date)));
        if (dateDefaultStateCheck && (requestArgIndicatorClass.indexOf("date") == -1)) {
            requestArgIndicatorClass = requestArgIndicatorClass + ' date';
        }

        // update class on filter button
        $('#thumbnail-navigation-filter-button').attr('class', requestArgIndicatorClass);
        if(requestArgIndicatorClass === ""){
            $("#reset-filter-link").hide();
        }else{
            $("#reset-filter-link").show();
        }
    }

    function getRequestArgs(bounds, RequestDate, kategorie) {
        var bbox_bottom = bounds.getSouthWest().lat();
        var bbox_top = bounds.getNorthEast().lat();
        var bbox_right = bounds.getNorthEast().lng();
        var bbox_left = bounds.getSouthWest().lng();
        var bbox = bbox_left + ',' + bbox_bottom + ',' + bbox_right + ',' + bbox_top;
        var RequestArgs = {};
        _log("AUTOR "+author)
        if (author.constructor === Array && author.length > 1) {
            // 1,2,3 (AND) and 1+2+3(OR).
            author = author.join("+");
        } else if (author.constructor === Array && author.length == 1) {
            // single
            author = author;
        } else {
            // all
            author = "all";
        }


        if (kategorie.length) {
            // 1,2,3 (AND) and 1+2+3(OR).
            RequestArgs = {bbox: bbox, date: RequestDate, kategorie_id: kategorie.join(','), autor_uid: author}
        } else {
            RequestArgs = {bbox: bbox, date: RequestDate, autor_uid: author}
        }
        _log(RequestArgs)
        return RequestArgs;
    }

    // Removes the markers from the map, but keeps them in the array.
    function clearDirectionsMarkers() {
        enableFilterUI();
        if (directionsDisplay.setMap) {
            // reset RAW
            while (RAW[0]) {
                RAW.pop().setMap(null);
            }
            directionsDisplay.setMap(null);
        }
        tourdisply_is_Active = false;
        use_eval_to_call_last_calculateAndDisplayRoute = '';

        jQuery('#tour_selector').prev().find('span').last().html("Keine Tour gewählt");
        jQuery('.tour_selector').removeClass('active');
    }

    function clearFilterSettings() {
        author = [];
        tourdisply_is_Active = false;
        requestArgIndicatorClass = "";
    }

    function clearAjaxCalls() {
        // clear running xhr processes
        for (var i = 0; i < ajaxXHR.length; i++) {
            ajaxXHR[i].abort();
        }
        ajaxXHR = [];
    }


    /**
     * check state cookie for initializeOnPageLoad
     * returns cookie values and set map settings on initialization
     *
     * @returns {boolean}
     */
    function checkStateCookie() {
        var cookie_data = JSON.parse($.cookie("fh_state_cookie"));

        if ((cookie_data) && (cookie_data.initializeOnPageLoad !== 'undefined' || cookie_data.initializeOnPageLoad !== null) && Boolean(cookie_data.initializeOnPageLoad) === true) {
            // _log(cookie_data);
            author = cookie_data.author;
            kategorie = cookie_data.kategorie;
            mapCenter = new google.maps.LatLng(parseFloat(cookie_data.lat), parseFloat(cookie_data.lng));
            Drupal.futurehistoryEntdecken[mapIdGlobal].map.setCenter(mapCenter);
            Drupal.futurehistoryEntdecken[mapIdGlobal].map.setZoom(parseFloat(cookie_data.zoom));
            if (cookie_data.RequestDate !== 'all') {
                Drupal.futurehistoryEntdecken.DateSlider(mapIdGlobal, cookie_data.RequestDate.split("--"));
            }

            return cookie_data;
        }
        return false;
    }


    /**
     * Store current map/filter settings in cookie
     *
     * @param RequestDate
     */
    function setStateCookie(RequestDate){
        var mapzoom = Drupal.futurehistoryEntdecken[mapIdGlobal].map.getZoom();
        var mapcenter = Drupal.futurehistoryEntdecken[mapIdGlobal].map.getCenter();
        var maplat = mapcenter.lat();
        var maplng = mapcenter.lng();


        var activeFilters = {
            initializeOnPageLoad: false,
            lat: maplat,
            lng: maplng,
            RequestDate: RequestDate,
            mapcenter: mapcenter,
            zoom: mapzoom
        };

        activeFilters['tourdisply_is_Active'] = tourdisply_is_Active;
        activeFilters['lastShowTourOnMapCall'] = lastShowTourOnMapCall;
        activeFilters['author'] = tourdisply_is_Active;
        activeFilters['author'] = author;
        activeFilters['kategorie'] = kategorie;
        activeFilters['bounds'] = bounds;
        activeFilters['RequestDate'] = RequestDate;

        $.cookie('fh_state_cookie', JSON.stringify(activeFilters), {path: '/'});
        // _log(activeFilters);
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
            collapsible: true,
            heightStyle: "content"
        });
        $("#accordion").on("accordionbeforeactivate", function () {
            return !arguments[1].newHeader.hasClass("ui-state-disabled");
        })

        // todo: refactor
        // KATEGORIE HEADER
        var selectedCategorylables = '';
        jQuery("#kategory_selector input:checked").each(function () {
            var nexttext = $(this).parent().text();
            if (nexttext.indexOf('(')) {
                nexttext = nexttext.substring(0, nexttext.indexOf('('));
            }
            selectedCategorylables += ' ' + nexttext;
        });
        if (selectedCategorylables.length > 0) {
            jQuery('#kategory_selector').prev().find('span').last().html(selectedCategorylables);
        } else {
            jQuery('#kategory_selector').prev().find('span').last().html("Keine Kategorien gewählt");
        }

        // AUTOR HEADER
        // todo: auto filter not working yet - view has to be extended
        var selectedAutorlables = '';
        jQuery("#author_selector input:checked").each(function () {
            var nexttext = $(this).parent().text();
            if (nexttext.indexOf('(')) {
                nexttext = nexttext.substring(0, nexttext.indexOf('('));
            }
            selectedAutorlables += ' ' + nexttext;
        });
        if (selectedAutorlables.length > 0) {
            jQuery('#author_selector').prev().find('span').last().html(selectedAutorlables);
        } else if (author !== '' && author !== 'all') {
            // _log(author);
            // jQuery('#author_selector').prev().find('span').last().html(author);
        }else {
            jQuery('#author_selector').prev().find('span').last().html("Kein Autor gewählt");
        }

        $(".fh-reset-filter-count").html(currentResultCount);


    }


    /**
     * setUpdateAuthor - set Author filter UI
     *
     * @param authorData
     */
    function setUpdateAuthor(authorData) {
        var $authors = $('#author_selector');
        // $authors.html('');
        // check if author has selection and force/keep display of author // case when 0 results with active filters
        if (isArray(author) && author.length > 0 && ($authors.find("input[value='" + author[0] + "']").size() > 0)) {
            $a = $authors.find("label[for='cb" + author[0] + "']");
           //update count
            for (authorname in authorData) {
                var count = authorData[authorname].count;
            }

            $a.find("span").text(' ('+count+')');
            $b = $authors.find("input[value='" + author[0] + "']");
            $authors.html('<table id="kategory_selector_table"><tr><td></td><td></td><td></td></tr></table>').find('td:first').append($a).append($b);
        } else {
            // $authors.find('label').remove();
            // $authors.find('input').remove();
            $authors.html('');

            var authorsDom = "<table id='kategory_selector_table'>";
            var i = 0;
            for (authorname in authorData) {
                var count = authorData[authorname].count;
                var uid = authorData[authorname].uid;
                var ischecked = Boolean($.inArray(uid, author) !== -1);
                if(ischecked){
                    ischecked = " checked='checked'";
                }else{
                    ischecked = '';
                }


                if (i % 3 === 0) {
                    authorsDom += '<tr>'
                }
                // add selected author item also for initial load e.g. from cookie data
                if (!isArray(author) || author[0] !== uid || $authors.find("input[value='" + author[0] + "']").size() == 0) {
                    authorsDom += '<td><label for="cb' + uid + '" ><input type="checkbox" uid="cb' + uid + '" value="' + uid + '"  '+ischecked+' \>&nbsp;' + authorname + '<span>(' + count + ')</span></label></td>';
                }
                if ((i + 1) % 3 === 0) {
                    authorsDom += '</tr>'
                }

                i++;
            }
            authorsDom += "</table>";
            $(authorsDom).appendTo($authors);
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

            Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapIdGlobal, mapCenter);
        });
    }

    /**
     * Updates/sets the result count on category filters
     *
     * @param pois_by_category
     */
    function setUpdateCategories(pois_by_category) {
        var labels = $("#kategory_selector_table:first td label");

        labels.each(function () {
            var count = 0;
            var value = $(this).find('input').first().val();
            $(this).find('span').remove();


            if (pois_by_category[value] !== undefined) {
                count = pois_by_category[value].length;
            }

            $(this).append("<span>(" + count + ")</span>");

            if(kategorie.indexOf(value) !== -1){
                $(this).find('input').prop( "checked", true );
            }

        });
    }


    /**
     * set/updates tour filter markup/data
     *
     * todo refactor
     * @param toursFilteredData
     */
    function setUpdateTours(toursFilteredData) {
        var $tours = $('#tour_selector');
        $tours.html('');
        var tour_url_detail = "/de/fh_view/list_tours";
        var tdd = new Array();

        var prepareFilterOutput = function () {
            for (var key in tdd) {
                tdd[key].appendTo($tours);
            }
            $('.tourtip').tooltipster({
                theme: 'tooltipster-noir',
                trigger: 'hover',
                contentAsHTML: true,
                debug: false,
                interactive: true,
                maxWidth: 300
            });
        };


        _log("toursFilteredData");
        _log(toursFilteredData);
        clearAjaxCalls();
        $("#tour_selector").html();
        // call to get tour data
        // could be one ajax call only
        var request_result_count = 0;
        for (var i = 0; i < toursFilteredData.length; i++) {
            var toursItem = toursFilteredData[i];
            var last = (i == toursFilteredData.length - 1);
            ajaxXHR["sut_" + i] = $.ajax({
                url: tour_url_detail,
                method: 'get',
                data: "tour_id=" + toursItem.tour_id,
                dataType: 'json',
                indexValue: i,
                last: last,
                success: function (tourdetails, i) {
                    request_result_count++;

                    var distance = tourdetails[0].distance;
                    var tour_titel = tourdetails[0].title;
                    var zeitraum = tourdetails[0].tour_start_date + "-" + tourdetails[0].tour_end_date;
                    var autor = tourdetails[0].name;
                    var tour_id = tourdetails[0].tour_id;
                    var description = tourdetails[0].description;
                    var buildTourMarkup = function () {
                        if( $('.tour_id_'+lastShowTourOnMapCall[0]).size() > 0){
                            return;
                        }
                        var distanceConvert = function () {
                            var distanceC;
                            if (distance > 999) {
                                distanceC = distance / 1000;
                                distanceC = distanceC.toFixed(2) + " km"
                            } else {
                                distanceC = distance + ' m';
                            }
                            return distanceC;
                        };

                        var $tour = $('<div />', {'class': 'tour_id_' + tour_id + " tour_selector"});
                        var $tour_status = $('<div />', {'class': 'status ui-icon-caret-1-e'});
                        var $tour_info = $('<div />', {
                            'class': 'info',
                            "data-tourid": tour_id,
                            "data-distance": distance
                        });
                        $tour_info.append("<span>" + tour_titel + " | " + zeitraum + "</span></br>");
                        $tour_info.append("<span>Strecke: " + distanceConvert() + " | von: " + autor + "</span>");
                        var $tour_details = $('<div />', {'class': 'details'});
                        var tour_detail_content = "<h4>" + tour_titel + "</h4><span>" + distanceConvert() + " | " + zeitraum + "</span></br><p>" + description + "</p>";
                        $tour_details.append("<span class='tour_id_" + tour_id + " tourtip' title='" + tour_detail_content + "'><img width='20px' src='/sites/all/modules/futurehistory_entdecken/map-images/info.png'></span>");

                        $tour_info.click(function (e) {
                            if ($(this).parent().hasClass('active')) {
                                clearDirectionsMarkers();
                                Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapIdGlobal, mapCenter);
                                jQuery('.tour_selector').removeClass('active');
                            } else {
                                jQuery('.tour_selector').removeClass('active');
                                $(this).parent().addClass('active');

                                clearAjaxCalls();
                                showTourOnMap(tour_id, tour_titel, distance);
                                disbleFilterUI();
                                initializeRequestArgIndicator();

                            }
                        });

                        $tour_status.appendTo($tour);
                        $tour_info.appendTo($tour);
                        $tour_details.appendTo($tour);
                        tdd[distance] = $tour;
                    }

                    buildTourMarkup();

                    if (request_result_count === toursFilteredData.length) {
                        prepareFilterOutput();

                        // tours on pageload must be loaded after other filters have been processed
                        // Filter mostly (!cat) do rely on valid results
                        if(lastShowTourOnMapCall.length === 3 && window.firstCall === false){
                            window.firstCall = "second";
                            $('.tour_id_'+lastShowTourOnMapCall[0]+" .info").trigger('click');
                        }
                    }
                }
            });
        }


    }

    /**
     * Display tour on Map
     *
     * @param directionsService
     * @param directionsDisplay
     * @param original_tourdata
     * @param distance
     */
    function calculateAndDisplayRoute(directionsService, directionsDisplay, original_tourdata, distance) {
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
                var polylineOptions = {
                    strokeColor: '#A04E9C',
                    strokeOpacity: 0.8,
                    strokeWeight: 5
                };

                if (distance > 10000) {
                    polylineOptions.strokeOpacity = 0;
                }

                directionsDisplay.setOptions({
                    polylineOptions: polylineOptions
                });

                directionsDisplay.setDirections(response);
            } else {
                window.alert('Directions request failed due to ' + status);
            }
        });
    }





    // Function: setMapThumbnails
    // list the marker Thumbnails and fill the LI elements wit IDs
    Drupal.futurehistoryEntdecken.setMapThumbnails = function (marker_content, mapId, mapCenter) {
        $('#thumbnail-pois').empty();

        // thumb-sort: distance from center versus age
        if (sort == 'dist') {
            // sort after distance from center/ or later from clicked point....
            var dist;
            var sortCenter = mapCenter;
            if (Drupal.futurehistoryEntdecken[mapId].center_marker != undefined) {
                sortCenter = Drupal.futurehistoryEntdecken[mapId].center_marker.getPosition();
            }

            for (var i = 0; i < marker_content.length; i++) {
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
            var onclick_thumb = 'onclick="Drupal.futurehistoryEntdecken.markerStateChange(' + nid + ', \'click\', \'' + mapId + '\', \'THUMB\')"';
            var onclick_detail = 'onclick="Drupal.futurehistoryEntdecken.setLastViewCookie(' + nid + ',  \'' + mapId + '\')"';
            var onclick_modal = 'onclick="Drupal.futurehistoryEntdecken.generateModal(' + nid + ',  \'' + mapId + '\')"';
            var info_url = '/node/' + nid;
            var poi_element = '<li id="thumb_' + nid + '" ' + onclick_thumb + '><div class="ansicht_title"> ' + marker_content[i]['title'] + ' | ' + marker_content[i]['Jahr'] + ' </div> <img src="' + marker_content[i]['bild-haupt-thumb'] + '"></li><div id="tc-' + nid + '"  class="thumbnail-control"><div class="left" ' + onclick_modal + ' ><a class="ansicht-collection-dynamic-modal ' + nid + '""><i class="material-icons">library_add</i>Hinzu-<br>fügen</a></div><div class="right" ' + onclick_detail + ' ><a href="' + info_url + '"> <i class="material-icons">fullscreen</i> Bild<br>Details</a>';
            $('#thumbnail-pois').append(poi_element);
        }

        // persistence step 4
        // remember active thumbs after ajax call / new marker set
        for (var n = 0; n < RAW.length; n++) {
            // activate the selected thumbs if control not already open
            if (RAW[n].activated) {
                if ($('#tc-' + RAW[n].id + '').is(":hidden")) {
                    $('#thumbnail-pois li#thumb_' + RAW[n].id + '').addClass('active');
                    // all activated with open controls
                    $('#tc-' + RAW[n].id + '').show();
                }
            }
            // hidden children
            for (var x = 0; x < RAW[n].hidePOIs.length; x++) {
                if (RAW[n].hidePOIs[x].activated) {
                    if ($('#tc-' + RAW[n].hidePOIs[x].id + '').is(":hidden")) {
                        $('#thumbnail-pois li#thumb_' + RAW[n].hidePOIs[x].id + '').addClass('active');
                        $('#tc-' + RAW[n].hidePOIs[x].id + '').show();
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
            $('#thumbnail-pois').scrollTo($('#thumbnail-pois li.active').filter(":first"), 10, {offset: 3});
        } else {
            // after redraw Thumbs with non-active scroll to top
            // e.g changing place
            // console.log('scroll thumbs to top ');
            $('#thumbnail-pois').scrollTo($('#thumbnail-pois li').filter(":first"), 10, {offset: 3});
        }
        // call thumbs persistence engine
        Drupal.futurehistoryEntdecken.BackFromBildDetail(mapId);
    };

    // Function: BackFromBildDetail
    Drupal.futurehistoryEntdecken.BackFromBildDetail = function (mapId) {
        // persistenz step 3, back from BildDetail
        if (LAST_ACTIVE_NID > -1) {
            // console.log('persistenz step 3, back from BildDetail LAST_ACTIVE_NID ', LAST_ACTIVE_NID);
            for (var r = 0; r < RAW.length; r++) {
                if (RAW[r].id == LAST_ACTIVE_NID) {
                    RAW[r].activated = true;
                    // console.log('persistenz step 3, activate thumb of marker ', LAST_ACTIVE_NID);
                    $('#thumbnail-pois li#thumb_' + RAW[r].id + '').addClass('active');
                    $('#tc-' + RAW[r].id + '').show();
                    RAW[r].setIcon(fh_marker_violet);
                    Drupal.futurehistoryEntdecken.setMapArrow(RAW[r], mapId);
                }
                for (var x = 0; x < RAW[r].hidePOIs.length; x++) {
                    if (RAW[r].hidePOIs[x].id == LAST_ACTIVE_NID) {
                        RAW[r].hidePOIs[x].activated = true;
                        // console.log('persistenz step 3, activate thumb of hidden marker ', LAST_ACTIVE_NID);
                        $('#thumbnail-pois li#thumb_' + RAW[r].hidePOIs[x].id + '').addClass('active');
                        $('#tc-' + RAW[r].hidePOIs[x].id + '').show();
                        RAW[r].setIcon(fh_marker_violet);
                        Drupal.futurehistoryEntdecken.setMapArrow(RAW[r].hidePOIs[x], mapId);
                    }
                }
            }
            if ($('#thumbnail-pois li.active').filter(":first")) {
                // console.log('persistenz step 3, scroll active Thumb');
                $('#thumbnail-pois').scrollTo($('#thumbnail-pois li.active').filter(":first"), 1000, {offset: 3});
            }
            // reset LAST_ACTIVE_NID is only a signal from cookie
            LAST_ACTIVE_NID = -1
        }
    }

    Drupal.futurehistoryEntdecken.setLastViewCookie = function (nid, mapId) {
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
        var fh_cookie_view = {
            viewport: 1,
            lat: maplat,
            lng: maplng,
            zoom: mapzoom,
            nid: nid,
            place_lat: place_lat,
            place_lng: place_lng
        };

        // console.log(' delete fh_geolocation_cookie ');
        $.cookie('fh_geolocation_cookie', null, {path: '/'});
        // console.log(' set fh_lastview_cookie ', fh_cookie_view);
        $.cookie('fh_lastview_cookie', JSON.stringify(fh_cookie_view), {path: '/'});
    }

    // Function: setMapMarkers
    // design and create the Markers
    Drupal.futurehistoryEntdecken.setMapMarkers = function (marker_content, mapId) {

        // persistenz step 1 save to LAST
        var LAST = [];
        for (var r = 0; r < RAW.length; r++) {
            // viewdir geometries still remains in map, decoupled from marker
            RAW[r].pie.setMap(null);
            for (var x = 0; x < RAW[r].hidePOIs.length; x++) {
                RAW[r].hidePOIs[x].pie.setMap(null);
            }
            LAST.push(RAW[r]);
        }
        // reset RAW
        while (RAW[0]) {
            RAW.pop().setMap(null);
        }

        $.each(marker_content, function () {
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
            google.maps.event.addListener(marker, 'click', function () {
                // console.log('click on id ', marker.id);
                Drupal.futurehistoryEntdecken.markerStateChange(marker.id, 'click', mapId, 'MAP');
                // TODO : JUST TESTING
                if (use_eval_to_call_last_calculateAndDisplayRoute !== '') {
                    // use_eval_to_call_last_calculateAndDisplayRoute();
                }

            });
            RAW.push(marker);
        });

        // Reduce POIs by chaining neardistance POIS together
        var double_swell = 5;

        // filter hidden marker, build list of hidden children
        // console.log('in RAW before hidden-filter ', RAW.length);
        for (var r = 0; r < RAW.length; r++) {
            // initial
            RAW[r].activated = false;
            RAW[r].pie.setMap(null);
            RAW[r].hidden_active_counter = 0;
            for (var x = 0; x < RAW.length; x++) {
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
                        if (LAST_ACTIVE_NID > -1) {
                            if (RAW[x].id == LAST_ACTIVE_NID) {
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
        for (var a = 0; a < LAST.length; a++) {
            for (var r = 0; r < RAW.length; r++) {
                if (RAW[r].id == LAST[a].id) {
                    // console.log('transfer state of marker ', LAST[a].id, ' to ', LAST[a].activated);
                    RAW[r].activated = LAST[a].activated;
                    for (var b = 0; b < LAST[a].hidePOIs.length; b++) {
                        for (var x = 0; x < RAW[r].hidePOIs.length; x++) {
                            if (RAW[r].hidePOIs[x].id == LAST[a].hidePOIs[b].id) {
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
        for (var r = 0; r < RAW.length; r++) {
            if (RAW[r].activated) {
                Drupal.futurehistoryEntdecken.setMapArrow(RAW[r], mapId);
                RAW[r].setIcon(fh_marker_violet);
            } else {
                // handle inactive
                if (RAW[r].hideother) {
                    RAW[r].setIcon(fh_marker_blue_cross);
                } else {
                    RAW[r].setIcon(fh_marker_blue);
                }
            }
            // look for active marker in hidden list
            for (var x = 0; x < RAW[r].hidePOIs.length; x++) {
                if (RAW[r].hidePOIs[x].activated) {
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
    Drupal.futurehistoryEntdecken.markerStateChange = function (markerId, action, mapId, src) {
        // if marker belongs to active tour recenter tour
        if(tourdisply_is_Active){
            use_eval_to_call_last_calculateAndDisplayRoute();
        }

        markerId = markerId.toString();

        var ThumbInClusterProcessing = false;
        if (src == 'THUMB') {
            // console.log('Click on Thumb ID ', markerId);
            for (var i = 0; i < RAW.length; i++) {

                // first test incluster --> mark activated and leave here because zoom_event reload and reprocess all
                if (RAW[i].id == markerId && RAW[i].incluster && RAW[i].activated == false) {
                    // console.log(' zoom to cluster extend and exit markerStateChange ', markerId)
                    // save state before cluster zoom: Lost avtive state before
                    LAST_ACTIVE_NID = markerId;
                    Drupal.futurehistoryEntdecken[mapId].map.fitBounds(RAW[i].clusterBounds);
                    RAW[i].activated = true;
                    return false;
                }
                // test incluster of hidden --> leave here because zoom_event reload and reprocess all
                for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                    if (RAW[i].hidePOIs[x].id == markerId) {
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
            for (var i = 0; i < RAW.length; i++) {
                // check the state of this marker = ID only, no processing of all other marker...
                if (RAW[i].id == markerId) {
                    // markerId: parent clicked
                    // console.log(' ID RAW[i].activated ', markerId, RAW[i].activated);
                    if (RAW[i].activated == true) {
                        // active parent thumb clicked --> close
                        Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].id, mapId);
                    } else {
                        // inactive parent thumb clicked --> open
                        activatedID = markerId;
                        RAW[i].activated = true;
                        $('#thumbnail-pois li#thumb_' + markerId + '').addClass('active');
                        $('#tc-' + RAW[i].id + '').slideDown("slow");
                        RAW[i].setIcon(fh_marker_violet);
                        Drupal.futurehistoryEntdecken.setMapArrow(RAW[i], mapId);
                        // deactivate all activated in this hiddenlist of parent
                        for (var y = 0; y < RAW[i].hidePOIs.length; y++) {
                            if (RAW[i].hidePOIs[y].activated == true) {
                                Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].hidePOIs[y].id, mapId);
                            }
                        }
                    }
                } else {
                    // clicked on thumb of child marker
                    for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                        if (RAW[i].hidePOIs[x].id == markerId) {
                            // console.log(' ID RAW[i].hidePOIs[x].activated ', markerId, RAW[i].hidePOIs[x].activated);
                            if (RAW[i].hidePOIs[x].activated == true) {
                                // click on thumb of active child clicked
                                Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].hidePOIs[x].id, mapId);
                            } else {
                                // click on thumb of inactive child clicked
                                activatedID = markerId;
                                RAW[i].hidePOIs[x].activated = true;
                                $('#thumbnail-pois li#thumb_' + RAW[i].hidePOIs[x].id + '').addClass('active');
                                $('#tc-' + RAW[i].hidePOIs[x].id + '').slideDown("slow");
                                RAW[i].setIcon(fh_marker_violet);
                                Drupal.futurehistoryEntdecken.setMapArrow(RAW[i].hidePOIs[x], mapId);
                            }
                        }
                    } // eof loop all hidden Marker
                }
            }
            // deactivate all other, except the just activated
            // console.log('just activated ID ', activatedID);
            for (var i = 0; i < RAW.length; i++) {
                var found_in_hidden_list = false;
                for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                    if (RAW[i].hidePOIs[x].id == activatedID) {
                        found_in_hidden_list = true;
                    } else {
                        Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].hidePOIs[x].id, mapId);
                    }
                }
                if (RAW[i].id != activatedID && !found_in_hidden_list) {
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
        for (var i = 0; i < RAW.length; i++) {
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
        if (activateIDX > -1) {
            // activate selected marker, hide all other
            // console.log('activate ', RAW[activateIDX].id);
            RAW[activateIDX].activated = true;
            Drupal.futurehistoryEntdecken.setActiveMarker(RAW[activateIDX].id, mapId);
            // signal set: activate all in list of hidden
            for (var x = 0; x < RAW[activateIDX].hidePOIs.length; x++) {
                RAW[activateIDX].hidePOIs[x].activated = true;
                // console.log('activate hidden child', markerId);
            }
            // hide all other
            for (var i = 0; i < RAW.length; i++) {
                for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                    if (RAW[i].hidePOIs[x].id != markerId && RAW[i].id != markerId && RAW[i].hidePOIs[x].activated == true) {
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
        if (deactivateIDX > -1) {
            // deactivate parent
            // console.log('deactivate parent', RAW[deactivateIDX].id);
            RAW[deactivateIDX].activated = false;
            Drupal.futurehistoryEntdecken.deactivateMarker(RAW[deactivateIDX].id, mapId);
            // signal set: deactivate all in list of hidden
            for (var x = 0; x < RAW[deactivateIDX].hidePOIs.length; x++) {
                RAW[deactivateIDX].hidePOIs[x].activated = false;
                Drupal.futurehistoryEntdecken.deactivateMarker(RAW[deactivateIDX].hidePOIs[x].id, mapId);
                // console.log('deactivate hidden child', RAW[deactivateIDX].hidePOIs[x].id);
            }
        }
        if ($('#thumbnail-pois li.active').filter(":first")) {
            $('#thumbnail-pois').scrollTo($('#thumbnail-pois li.active').filter(":first"), 1000, {offset: 3});
        }

    }

    // Function: deactivateViewPos
    Drupal.futurehistoryEntdecken.deactivateViewPos = function (markerID, mapId) {
        for (var i = 0; i < RAW.length; i++) {
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
    Drupal.futurehistoryEntdecken.resetMarkerIcon = function (markerID, mapId) {
        // reset marker icon if necessary...
        // Falltüren check
        for (var i = 0; i < RAW.length; i++) {
            var ActIcon = undefined;
            if (RAW[i].id == markerID) {
                if (RAW[i].activated == false) {
                    ActIcon = fh_marker_blue;
                    if (RAW[i].hideother) {
                        ActIcon = fh_marker_blue_cross;
                    }
                    for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                        if (RAW[i].hidePOIs[x].activated == true) {
                            ActIcon = fh_marker_violet;
                        }
                    }
                } else {
                    ActIcon = fh_marker_violet;
                }
            }
            if (ActIcon === undefined) {
                // additionally check for hidden active marker
                var active_in_hidden_list = false;
                for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                    if (RAW[i].hidePOIs[x].activated == true) {
                        active_in_hidden_list = true;
                    }
                }
                for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                    if (RAW[i].hidePOIs[x].id == markerID) {
                        if (active_in_hidden_list == true || RAW[i].activated) {
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
    Drupal.futurehistoryEntdecken.deactivateMarker = function (markerID, mapId) {
        var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();

        for (var i = 0; i < RAW.length; i++) {
            if (RAW[i].id == markerID) {
                $('#thumbnail-pois li#thumb_' + RAW[i].id + '').removeClass('active');
                $('#tc-' + RAW[i].id + '').hide();
                Drupal.futurehistoryEntdecken.delMapArrow(RAW[i]);
                RAW[i].activated = false;
                // console.log('deactivate ', RAW[i].id)
                if (RAW[i].hideother) {
                    RAW[i].setIcon(fh_marker_blue_cross);
                    for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                        if (zoomLevel > 18) {
                            Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
                        }
                        $('#thumbnail-pois li#thumb_' + RAW[i].hidePOIs[x].id + '').removeClass('active');
                        $('#tc-' + RAW[i].hidePOIs[x].id + '').hide();
                        RAW[i].hidePOIs[x].activated = false;
                    }
                } else {
                    RAW[i].setIcon(fh_marker_blue);
                }
            } else {
                // additionally check for hidden active marker
                for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                    if (RAW[i].hidePOIs[x].id == markerID) {
                        $('#thumbnail-pois li#thumb_' + RAW[i].hidePOIs[x].id + '').removeClass('active');
                        $('#tc-' + RAW[i].hidePOIs[x].id + '').hide();
                        RAW[i].hidePOIs[x].activated = false;
                        if (zoomLevel > 18) {
                            Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
                        }
                    }
                }
            }
        }
    }

    // Function: setActiveMarker
    Drupal.futurehistoryEntdecken.setActiveMarker = function (activate_parent, mapId) {

        // console.log('in setActiveMarker ', activate_parent);
        for (var i = 0; i < RAW.length; i++) {
            if (RAW[i].id == activate_parent) {
                $('#thumbnail-pois li#thumb_' + RAW[i].id + '').addClass('active');
                $('#tc-' + RAW[i].id + '').slideDown("slow");
                // console.log('activate ', RAW[i].id)
                RAW[i].activated = true;
                RAW[i].setIcon(fh_marker_violet);
                Drupal.futurehistoryEntdecken.setMapArrow(RAW[i], mapId);

                for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                    // console.log('activate hidden thumbs ', RAW[i].hidePOIs[x].id);
                    $('#thumbnail-pois li#thumb_' + RAW[i].hidePOIs[x].id + '').addClass('active');
                    $('#tc-' + RAW[i].hidePOIs[x].id + '').slideDown("slow");
                    Drupal.futurehistoryEntdecken.setMapArrow(RAW[i].hidePOIs[x], mapId);
                }
            } else {
                // deactivate all other
                if (RAW[i].activated) {
                    // console.log('deactivate ', RAW[i].id)
                    Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].id, mapId);
                    //Drupal.futurehistoryEntdecken.delMapArrow(RAW[i]);
                    for (var x = 0; x < RAW[i].hidePOIs.length; x++) {
                        Drupal.futurehistoryEntdecken.deactivateMarker(RAW[i].hidePOIs[x].id, mapId);
                        //Drupal.futurehistoryEntdecken.delMapArrow(RAW[i].hidePOIs[x]);
                    }
                }
            }
        }
    }

    // placesMapAction Function for the google places actions
    Drupal.futurehistoryEntdecken.placesMapAction = function (place, mapId) {
        if (place.geometry != undefined) {
            // console.log('place ', place);
            var fh_cookie = {};
            LAST_place = place.geometry.location;
            mapCenter = place.geometry.location;
            if (place.geometry.viewport) {
                fh_cookie = {viewport: 1, bounds: place.geometry.viewport, point: place.geometry.location};
                Drupal.futurehistoryEntdecken[mapId].map.fitBounds(place.geometry.viewport);
            } else {
                fh_cookie = {viewport: 0, bounds: 0, point: place.geometry.location};
                Drupal.futurehistoryEntdecken[mapId].map.setCenter(place.geometry.location);
                Drupal.futurehistoryEntdecken[mapId].map.setZoom(DEFAULT_ZOOM);
            }
            Drupal.futurehistoryEntdecken.markMapCenter(mapId, mapCenter);
            //console.log(' setCookie fh_geolocation_cookie ', JSON.stringify(fh_cookie));
            $.cookie('fh_geolocation_cookie', JSON.stringify(fh_cookie), {path: '/'});
        }
    };
    //End placesMapAction Function

    Drupal.futurehistoryEntdecken.selectFirstOnEnter = function (input) {
        var _addEventListener = (input.addEventListener) ? input.addEventListener : input.attachEvent;

        function addEventListenerWrapper(type, listener) {
            if (type == "keydown") {
                var orig_listener = listener;
                listener = function (event) {
                    var suggestion_selected = $(".pac-item-selected").length > 0;
                    if ((event.which == 13 ) && !suggestion_selected) {
                        var simulated_downarrow = $.Event("keydown", {
                            keyCode: 40,
                            which: 40
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
    Drupal.futurehistoryEntdecken.MarkerClusterer = function (map, opt_markers, opt_options) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.extend = function (obj1, obj2) {
        return (function (object) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.onAdd = function () {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.draw = function () {
    };

    /**
     * Sets up the styles object.
     *
     * @private
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setupStyles_ = function () {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.fitMapToMarkers = function () {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setStyles = function (styles) {
        this.styles_ = styles;
    };


    /**
     *  Gets the styles.
     *
     *  @return {Object} The styles object.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getStyles = function () {
        return this.styles_;
    };


    /**
     * Whether zoom on click is set.
     *
     * @return {boolean} True if zoomOnClick_ is set.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.isZoomOnClick = function () {
        return this.zoomOnClick_;
    };

    /**
     * Whether average center is set.
     *
     * @return {boolean} True if averageCenter_ is set.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.isAverageCenter = function () {
        return this.averageCenter_;
    };


    /**
     *  Returns the array of markers in the clusterer.
     *
     *  @return {Array.<google.maps.Marker>} The markers.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getMarkers = function () {
        return this.markers_;
    };


    /**
     *  Returns the number of markers in the clusterer
     *
     *  @return {Number} The number of markers.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getTotalMarkers = function () {
        return this.markers_.length;
    };


    /**
     *  Sets the max zoom for the clusterer.
     *
     *  @param {number} maxZoom The max zoom level.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setMaxZoom = function (maxZoom) {
        this.maxZoom_ = maxZoom;
    };


    /**
     *  Gets the max zoom for the clusterer.
     *
     *  @return {number} The max zoom level.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getMaxZoom = function () {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.calculator_ = function (markers, numStyles) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setCalculator = function (calculator) {
        this.calculator_ = calculator;
    };


    /**
     * Get the calculator function.
     *
     * @return {function(Array, number)} the calculator function.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getCalculator = function () {
        return this.calculator_;
    };


    /**
     * Add an array of markers to the clusterer.
     *
     * @param {Array.<google.maps.Marker>} markers The markers to add.
     * @param {boolean=} opt_nodraw Whether to redraw the clusters.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.addMarkers = function (markers, opt_nodraw) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.pushMarkerTo_ = function (marker) {
        marker.isAdded = false;
        if (marker['draggable']) {
            // If the marker is draggable add a listener so we update the clusters on
            // the drag end.
            // console.log('Dragend CLUSTER event');
            var that = this;
            google.maps.event.addListener(marker, 'dragend', function () {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.addMarker = function (marker, opt_nodraw) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.removeMarker_ = function (marker) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.removeMarker = function (marker, opt_nodraw) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.removeMarkers = function (markers, opt_nodraw) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setReady_ = function (ready) {
        if (ready == this.ready_) {
            return;
        }
        this.ready_ = ready;
        if (this.ready_) {
            if (!this.map) return;
            this.map_ = this.map;
            this.prevZoom_ = this.map.getZoom();

            // Add the map event listeners
            var that = this;
            this.zoom_changed_listener = google.maps.event.addListener(this.map_, 'zoom_changed', function () {
                var zoom = that.map_.getZoom();
                // console.log(' MarkerClusterer.prototype.setReady_ ZOOM changed func... ');
                if (that.prevZoom_ != zoom) {
                    that.prevZoom_ = zoom;
                    that.resetViewport();
                }
            });
            this.idle_listener = google.maps.event.addListener(this.map_, 'idle', function () {
                // console.log(' MarkerClusterer.prototype.setReady_ IDLE func... ');
                that.redraw();
            });

            // console.log(' former here were drawn the single markers independent from beeing cluster-member... ');
            // lindes cluster separator

            this.createClusters_();
            if (this.markers_ && this.markers_.length) {
                for (var c = 0, cluster; cluster = this.clusters_[c]; c++) {
                    // console.log('check all cluster length ', cluster.markers_.length);
                    for (var m = 0; m < cluster.markers_.length; m++) {
                        if (cluster.markers_.length < this.minClusterSize_) {
                            for (var r = 0; r < RAW.length; r++) {
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
                                for (var x = 0; x < cluster.markers_[m].hidePOIs.length; x++) {
                                    // console.log('iterate hidden list ', cluster.markers_[m].hidePOIs[x]);
                                    if (cluster.markers_[m].hidePOIs[x].activated) {
                                        // console.log('but draw viewpos of activated hidden pois', cluster.markers_[m].hidePOIs[x].id);
                                        Drupal.futurehistoryEntdecken.setMapArrow(cluster.markers_[m].hidePOIs[x], mapId);
                                    }
                                }
                            }
                        } else {
                            // Cluster extent to RAW-data (Thumb-Click...)
                            for (var r = 0; r < RAW.length; r++) {
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
            if (this.zoom_changed_listener) {
                google.maps.event.removeListener(this.zoom_changed_listener);
                this.zoom_changed_listener = undefined;
            }
            if (this.idle_listener) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getTotalClusters = function () {
        return this.clusters_.length;
    };


    /**
     * Returns the google map that the clusterer is associated with.
     *
     * @return {google.maps.Map} The map.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getMap = function () {
        return this.map_;
    };


    /**
     * Sets the google map that the clusterer is associated with.
     *
     * @param {google.maps.Map} map The map.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setMap = function (map) {
        this.map_ = map;
    };


    /**
     * Returns the size of the grid.
     *
     * @return {number} The grid size.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getGridSize = function () {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setGridSize = function (size) {
        this.gridSize_ = size;
    };


    /**
     * Returns the min cluster size.
     *
     * @return {number} The grid size.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getMinClusterSize = function () {
        return this.minClusterSize_;
    };

    /**
     * Sets the min cluster size.
     *
     * @param {number} size The grid size.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.setMinClusterSize = function (size) {
        this.minClusterSize_ = size;
    };


    /**
     * Extends a bounds object by the grid size.
     *
     * @param {google.maps.LatLngBounds} bounds The bounds to extend.
     * @return {google.maps.LatLngBounds} The extended bounds.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.getExtendedBounds = function (bounds) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.isMarkerInBounds_ = function (marker, bounds) {
        return bounds.contains(marker.getPosition());
    };


    /**
     * Clears all clusters and markers from the clusterer.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.clearMarkers = function () {
        this.resetViewport(true);

        // Set the markers a empty array.
        this.markers_ = [];
    };


    /**
     * Clears all existing clusters and recreates them.
     * @param {boolean} opt_hide To also hide the marker.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.resetViewport = function (opt_hide) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.repaint = function () {
        var oldClusters = this.clusters_.slice();
        this.clusters_.length = 0;
        this.resetViewport(true);
        this.redraw();

        // Remove the old clusters.
        // Do it in a timeout so the other clusters have been drawn first.
        window.setTimeout(function () {
            for (var i = 0, cluster; cluster = oldClusters[i]; i++) {
                cluster.remove();
            }
        }, 0);
    };


    /**
     * Redraws the clusters.
     */
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.redraw = function () {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.distanceBetweenPoints_ = function (p1, p2) {
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.addToClosestCluster_ = function (marker) {
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
            clusterToAddTo.addMarker(marker, true);
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
    Drupal.futurehistoryEntdecken.MarkerClusterer.prototype.createClusters_ = function () {
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
    Drupal.futurehistoryEntdecken.Cluster = function (markerClusterer) {
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
    Drupal.futurehistoryEntdecken.Cluster.prototype.isMarkerAlreadyAdded = function (marker) {
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
    Drupal.futurehistoryEntdecken.Cluster.prototype.addMarker = function (marker) {
        if (this.isMarkerAlreadyAdded(marker)) {
            return false;
        }

        if (!this.center_) {
            this.center_ = marker.getPosition();
            this.calculateBounds_();
        } else {
            if (this.averageCenter_) {
                var l = this.markers_.length + 1;
                var lat = (this.center_.lat() * (l - 1) + marker.getPosition().lat()) / l;
                var lng = (this.center_.lng() * (l - 1) + marker.getPosition().lng()) / l;
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
    Drupal.futurehistoryEntdecken.Cluster.prototype.getMarkerClusterer = function () {
        return this.markerClusterer_;
    };


    /**
     * Returns the bounds of the cluster.
     *
     * @return {google.maps.LatLngBounds} the cluster bounds.
     */
    Drupal.futurehistoryEntdecken.Cluster.prototype.getBounds = function () {
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
    Drupal.futurehistoryEntdecken.Cluster.prototype.remove = function () {
        this.clusterIcon_.remove();
        this.markers_.length = 0;
        delete this.markers_;
    };


    /**
     * Returns the center of the cluster.
     *
     * @return {number} The cluster center.
     */
    Drupal.futurehistoryEntdecken.Cluster.prototype.getSize = function () {
        return this.markers_.length;
    };


    /**
     * Returns the center of the cluster.
     *
     * @return {Array.<google.maps.Marker>} The cluster center.
     */
    Drupal.futurehistoryEntdecken.Cluster.prototype.getMarkers = function () {
        return this.markers_;
    };


    /**
     * Returns the center of the cluster.
     *
     * @return {google.maps.LatLng} The cluster center.
     */
    Drupal.futurehistoryEntdecken.Cluster.prototype.getCenter = function () {
        return this.center_;
    };


    /**
     * Calculated the extended bounds of the cluster with the grid.
     *
     * @private
     */
    Drupal.futurehistoryEntdecken.Cluster.prototype.calculateBounds_ = function () {
        var bounds = new google.maps.LatLngBounds(this.center_, this.center_);
        this.bounds_ = this.markerClusterer_.getExtendedBounds(bounds);
    };


    /**
     * Determines if a marker lies in the clusters bounds.
     *
     * @param {google.maps.Marker} marker The marker to check.
     * @return {boolean} True if the marker lies in the bounds.
     */
    Drupal.futurehistoryEntdecken.Cluster.prototype.isMarkerInClusterBounds = function (marker) {
        return this.bounds_.contains(marker.getPosition());
    };


    /**
     * Returns the map that the cluster is associated with.
     *
     * @return {google.maps.Map} The map.
     */
    Drupal.futurehistoryEntdecken.Cluster.prototype.getMap = function () {
        return this.map_;
    };


    /**
     * Updates the cluster icon
     */
    Drupal.futurehistoryEntdecken.Cluster.prototype.updateIcon = function () {
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
    Drupal.futurehistoryEntdecken.ClusterIcon = function (cluster, styles, opt_padding) {
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
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.triggerClusterClick = function (event) {
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
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.onAdd = function () {
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
        google.maps.event.addDomListener(this.div_, 'click', function (event) {
            // Only perform click when not preceded by a drag
            if (!isDragging) {
                that.triggerClusterClick(event);
            }
        });
        google.maps.event.addDomListener(this.div_, 'mousedown', function () {
            isDragging = false;
        });
        google.maps.event.addDomListener(this.div_, 'mousemove', function () {
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
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.getPosFromLatLng_ = function (latlng) {
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
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.draw = function () {
        if (this.visible_) {
            var pos = this.getPosFromLatLng_(this.center_);
            this.div_.style.top = pos.y + 'px';
            this.div_.style.left = pos.x + 'px';
        }
    };


    /**
     * Hide the icon.
     */
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.hide = function () {
        if (this.div_) {
            this.div_.style.display = 'none';
        }
        this.visible_ = false;
    };


    /**
     * Position and show the icon.
     */
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.show = function () {
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
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.remove = function () {
        this.setMap(null);
    };


    /**
     * Implementation of the onRemove interface.
     * @ignore
     */
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.onRemove = function () {
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
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.setSums = function (sums) {
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
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.useStyle = function () {
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
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.setCenter = function (center) {
        this.center_ = center;
    };


    /**
     * Create the css text based on the position of the icon.
     *
     * @param {google.maps.Point} pos The position.
     * @return {string} The css style text.
     */
    Drupal.futurehistoryEntdecken.ClusterIcon.prototype.createCss = function (pos) {
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
            InitYearRange = [Drupal.settings.futurehistoryEntdecken.first_date, Drupal.settings.futurehistoryEntdecken.last_date];

            // console.log('time bounds fotos: ', portal_date_first + ' - ' + portal_date_last);

            //calculate the mapbox height
            var mapbox_height = $("html").height() - $("#navbar").height();
            $('.entdecken-container, #entdecken-map, #entdecken-map-nav').css('height', mapbox_height)

            //calculate the thumbnail box height
            var thumbnailbox_height = $("html").height() - $("#navbar").height() - 70;
            $('#entdecken-map-nav #thumbnail-pois').css('height', thumbnailbox_height);


            //google places autocomplete each function
            $('.places-autocomplete', context).each(function () {
                var $this = $(this);
                placesId = this.id;
                var input = Drupal.futurehistoryEntdecken.selectFirstOnEnter(document.getElementById(placesId));

                Drupal.futurehistoryEntdecken[placesId] = {};
                Drupal.futurehistoryEntdecken[placesId].autocomplete = new google.maps.places.Autocomplete(
                    (document.getElementById(placesId)),
                    {types: ['geocode']}
                );

                Drupal.futurehistoryEntdecken[placesId].autocomplete.addListener('place_changed', function () {
                    fh_place = Drupal.futurehistoryEntdecken[placesId].autocomplete.getPlace();
                    // call the map actions function
                    // console.log('place changed ... delete last_viewcookie...');
                    Drupal.futurehistoryEntdecken.placesMapAction(fh_place, mapId);
                });
            }); // End EACH Funktion


            $('.futurehistory-entdecken-map', context).each(function () {


                // MAP STUFF
                // The MAP div is located in "futurehistory-entdecken-map.tpl.php"
                // and feed with the $atribute options created in "futurehistory_entdecken_plugin_style_google_map.inc" i
                // and the associated VIEW in the Drupal Backend

                function param(name) {
                    return (location.search.split(name + '=')[1] || '').split('&')[0];
                }

                var $this = $(this);
                mapIdGlobal = mapId = this.id;
                Drupal.futurehistoryEntdecken[mapId] = {};

                // ajax request to get categories
                $.ajax({
                    url: cat_url,
                    // mapping must be complete before continuing, keep callback slim
                    async: false,
                    method: 'get',
                    data: {vid: '6'},
                    dataType: 'json',
                    success: function (data) {
                        var kategory_selector_content = '<form><fieldset><table id="kategory_selector_table">'
                        var cnt = 1;
                        for (var i = 0; i < data.length; i++) {
                            // build categorie mapping for usage in permalinks
                            var key = data[i]['Begriff-ID'];
                            var kn = data[i].name;
                            // build GUI for categorie filter
                            CAT[key] = kn;
                            if (i % 3 === 0) {
                                kategory_selector_content += '<tr>'
                            }
                            kategory_selector_content += '<td><label><input type="checkbox" id="cat_' + key + '" name="cat_' + key + '" value="' + key + '" checked="checked">&nbsp;' + kn + '</label></td>';
                            if ((i + 1) % 3 === 0) {
                                kategory_selector_content += '</tr>'
                            }
                        }
                        kategory_selector_content += '</table></fieldset></form>';

                        // estabilsh Cat selction GUI in DIV
                        $('#kategory_selector').html(kategory_selector_content);
                        for (key in CAT) {
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
                    mapCenter = new google.maps.LatLng(initial_center_lat, initial_center_lng);
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
                    streetViewControl: false,
                    rotateControl: false,
                });
                // initial clear center marker, redo from URL, cookies or places
                Drupal.futurehistoryEntdecken[mapId].center_marker = undefined;


                if (window.location.search.length > 1) {
                    // set view parameters from URL hash
                    // console.log(' set location from URL ', window.location.hash);
                    var url_x = param('x');
                    var url_y = param('y');
                    var url_z = param('z');
                    var url_k = param('k');
                    var url_d = param('d');
                    var url_s = param('s');
                    var url_a = param('a');
                    var url_t = param('t');
                    mapCenter = new google.maps.LatLng(parseFloat(url_y), parseFloat(url_x));
                    if (url_k.substring(0, 1) == ',') {
                        url_k = url_k.substring(1);
                    }
                    mapZoom = parseInt(url_z);
                    kategorie = url_k.split(',');
                    YearRange[0] = parseInt(url_d.split('--')[0]);
                    YearRange[1] = parseInt(url_d.split('--')[1]);
                    RequestDate = String(YearRange[0]) + '--' + String(YearRange[1]);
                    sort = url_s;
                    author = url_a === 'all'?url_a:[url_a];

                    if(url_t !== '' || url_t != undefined){
                        url_t = decodeURI(url_t);
                        lastShowTourOnMapCall = url_t.split(',');
                    }



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
                        mapCenter = new google.maps.LatLng(fh_geolocation_cookie_data.point);
                        Drupal.futurehistoryEntdecken[mapId].map.setCenter(mapCenter);
                    }
                    Drupal.futurehistoryEntdecken.markMapCenter(mapId, new google.maps.LatLng(fh_geolocation_cookie_data.point));
                    mapCenter = Drupal.futurehistoryEntdecken[mapId].map.getCenter();
                    // console.log(' delete fh_geolocation_cookie ');
                    $.cookie('fh_geolocation_cookie', null, {path: '/'});
                } else if (fh_lastview_cookiedata != null) {
                    // Back from BildDetail
                    // console.log('Back from BildDetail fh_lastview_cookiedata ', fh_lastview_cookiedata);
                    if (fh_lastview_cookiedata.viewport == '1') {
                        LAST_ACTIVE_NID = fh_lastview_cookiedata.nid;

                        var markLat = parseFloat(fh_lastview_cookiedata.place_lat);
                        var markLng = parseFloat(fh_lastview_cookiedata.place_lng);
                        if (markLat <= 90 && markLng <= 180) {
                            // ...is a place on earth
                            var markCenter = new google.maps.LatLng(markLat, markLng);
                            Drupal.futurehistoryEntdecken.markMapCenter(mapId, markCenter);
                        }

                        // global var
                        mapCenter = new google.maps.LatLng(parseFloat(fh_lastview_cookiedata.lat), parseFloat(fh_lastview_cookiedata.lng));
                        Drupal.futurehistoryEntdecken[mapId].map.setCenter(mapCenter);
                        Drupal.futurehistoryEntdecken[mapId].map.setZoom(parseFloat(fh_lastview_cookiedata.zoom));
                        if (fh_lastview_cookiedata.zoom <= 18) {
                            Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
                        }
                        else {
                            Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.HYBRID);
                            Drupal.futurehistoryEntdecken[mapId].map.setTilt(0);
                        }
                    }
                    // use cookie only once, remove
                    // console.log(' delete fh_lastview_cookiedata ');
                    $.cookie('fh_lastview_cookie', null, {path: '/'});
                }

                // https://developer.mozilla.org/en-US/docs/Web/API/WindowEventHandlers/onpopstate
                window.onpopstate = function (event) {
                    CALL_onpopstate = true;
                    // console.log(" !! onpopstate location: " + document.location + " state ==  " + JSON.stringify(event.state));

                    var laststate = JSON.parse(JSON.stringify(event.state));
                    if (laststate) {
                        // console.log(' HISTORY back...', laststate.view );
                        $('#places-autocomplete-map').val('');
                        $('#places-autocomplete-map').blur();
                        var LastMapCenter = new google.maps.LatLng(parseFloat(laststate.view.split('&')[1]), parseFloat(laststate.view.split('&')[2]));
                        mapZoom = parseInt(laststate.view.split('&')[3]);
                        Drupal.futurehistoryEntdecken[mapId].map.setCenter(LastMapCenter);
                        Drupal.futurehistoryEntdecken[mapId].map.setZoom(mapZoom);
                    }
                };

                // start google maps IDLE function and ask for the boundingbox .getBounds
                // todo: maybe the idle function is not the best choice? the pois load realy slow
                google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, 'idle', function () {
                    bounds = Drupal.futurehistoryEntdecken[mapId].map.getBounds();
                    if (Drupal.futurehistoryEntdecken[mapId].center_marker == undefined) {
                        // center marker not present, comming from FH start location selection.... set initial Center Marker
                        mapCenter = new google.maps.LatLng(Drupal.futurehistoryEntdecken[mapId].map.getCenter().lat(), Drupal.futurehistoryEntdecken[mapId].map.getCenter().lng());
                        Drupal.futurehistoryEntdecken.markMapCenter(mapId, mapCenter);
                    }
                    _log("ARE WE HERE kategorie ",kategorie);
                    Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
                });

                // right click set hash to reconstruct view from URL
                google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, "rightclick", function (event) {
                    var coords = Drupal.futurehistoryEntdecken[mapId].map.getCenter();
                    var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();

                    var CC = Drupal.futurehistoryEntdecken[mapId].map.controls[google.maps.ControlPosition.TOP_CENTER];
                    if (CC.length) {
                        CC.forEach(function (element, index) {
                            CC.clear(index);
                        });
                        return;
                    }
                    var reqDate = String($("#time_slider").slider("values", 0) + "--" + $("#time_slider").slider("values", 1));
                    var baseUrl = window.location.origin + window.location.pathname;
                    var centerControlDiv = document.createElement('div');
                    var td = '';
                    if(tourdisply_is_Active){
                        td = "&t="+encodeURI(lastShowTourOnMapCall.join(','));
                    }
                    _log("td: "+td);

                    var permaUrl = baseUrl + encodeURI('?y=' + coords.lat() +
                            '&x=' + coords.lng() +
                            '&z=' + Drupal.futurehistoryEntdecken[mapId].map.getZoom() +
                            '&k=' + kategorie.toString() +
                            '&d=' + reqDate +
                            '&a=' + author +
                            '&s=' + sort + td);

                    var permalink = '<a href="' + permaUrl + '">' + permaUrl + '</a>';
                    centerControlDiv.index = 1;
                    var centerControl = new CenterControl(centerControlDiv, Drupal.futurehistoryEntdecken[mapId].map, permalink);
                    centerControlDiv.index = 1;
                    Drupal.futurehistoryEntdecken[mapId].map.controls[google.maps.ControlPosition.TOP_CENTER].push(centerControlDiv);
                });

                google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, 'dragend', function () {
                    // use new center for sorting markers if no place defined
                    // set global
                    //mapCenter =  new google.maps.LatLng(Drupal.futurehistoryEntdecken[mapId].map.getCenter().lat(),Drupal.futurehistoryEntdecken[mapId].map.getCenter().lng());
                    mapCenter = Drupal.futurehistoryEntdecken[mapId].map.getCenter();
                    var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
                    // history back again fires a dragend or zoom_changed event via onpopState, then we stay in place.... filter out
                    if (!CALL_onpopstate) {
                        var view = '&' + encodeURI(mapCenter.lat() + '&' + mapCenter.lng() + '&' + Drupal.futurehistoryEntdecken[mapId].map.getZoom());
                        history.pushState({view: view}, '', '');
                        // console.log(' pushState ', view );
                    } else {
                        CALL_onpopstate = false;
                    }
                });

                // switch the map type on established zoom level
                google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, 'zoom_changed', function () {
                    // console.log(' zoom_changed, pushState ');
                    var coords = Drupal.futurehistoryEntdecken[mapId].map.getCenter();
                    var zoomLevel = Drupal.futurehistoryEntdecken[mapId].map.getZoom();
                    if (zoomLevel <= 18) {
                        Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.ROADMAP);
                    }
                    else {
                        Drupal.futurehistoryEntdecken[mapId].map.setMapTypeId(google.maps.MapTypeId.HYBRID);
                        Drupal.futurehistoryEntdecken[mapId].map.setTilt(0);
                    }
                    // history back again fires a dragend or zoom_changed event via onpopState, then we stay in place.... filter out
                    if (!CALL_onpopstate) {
                        var view = '&' + encodeURI(coords.lat() + '&' + coords.lng() + '&' + Drupal.futurehistoryEntdecken[mapId].map.getZoom());
                        history.pushState({view: view}, '', '');
                        // console.log(' pushState ', view );
                    } else {
                        CALL_onpopstate = false;
                    }
                });

                // Toggle the filter and sort boxes with jquery magic
                $("#thumbnail-navigation-filter-button").click(function () {
                    $("#thumbnail-filter-box").slideToggle("slow");
                    $("#thumbnail-sort-box").slideUp("fast");
                });
                $("#thumbnail-navigation-sort-button").click(function () {
                    $("#thumbnail-sort-box").slideToggle("slow");
                    $("#thumbnail-filter-box").slideUp("fast");
                });
                $(".sort-close").click(function () {
                    $("#thumbnail-sort-box").slideUp("fast");
                });
                $(".filter-close").click(function () {
                    $("#thumbnail-filter-box").slideUp("fast");
                });


                // Filter checkbox-events
                $("a[class=reset-filter-link]").click(function () {
                    clearDirectionsMarkers();
                    clearFilterSettings();
                    kategorie = ['all'];
                    for (key in CAT) {
                        // deactivate all checkboxes
                        $('#cat_' + key).prop("checked", false);
                    }
                    $("#time_slider").slider('values', InitYearRange); // reset
                    $("#time_range").val("Jahr " + InitYearRange[0] + " - Jahr " + InitYearRange[1]);
                    RequestDate = String(InitYearRange[0]) + '--' + String(InitYearRange[1]);
                    // console.log(' kategorie array: ', kategorie);
                    Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);

                });

                // sort checkboxes
                $("#fh_sort_dist").change(function () {
                    $(this).prop("checked") ? sort = 'dist' : sort = 'year';
                    // console.log('sort criteria change to ', sort);
                    Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
                    $('#thumbnail-pois').scrollTo($('#thumbnail-pois li').filter(":first"), 10, {offset: 3});
                });
                $("#fh_sort_year").change(function () {
                    $(this).prop("checked") ? sort = 'year' : sort = 'dist';
                    // console.log('sort criteria change to ', sort);
                    Drupal.futurehistoryEntdecken.getMarkers(bounds, RequestDate, kategorie, sort, mapId, mapCenter);
                    $('#thumbnail-pois').scrollTo($('#thumbnail-pois li').filter(":first"), 10, {offset: 3});
                });

                // Daniel Frings: initial Portal first & last date :)
                //var portal_date_first = Drupal.settings.futurehistoryEntdecken.first_date;
                //var portal_date_last = Drupal.settings.futurehistoryEntdecken.last_date;
                InitYearRange = [Drupal.settings.futurehistoryEntdecken.first_date, Drupal.settings.futurehistoryEntdecken.last_date];
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
            for (key in CAT) {
                if (kategorie.indexOf(key) > -1) {
                    $('#cat_' + key).prop('checked', true);
                    //console.log('Activate checkbox ', CAT[key]);
                } else {
                    $('#cat_' + key).prop('checked', false);
                }
            }

            function toggleCategory(IDcat) {
                $('#cat_' + IDcat).change(function (IDcat) {
                    // console.log('cat checkbox ', $(this).val(),' checked ? ',  $(this).prop("checked"));
                    var actKat = $(this).val();
                    // rebuild kategorie arry depending on checkbox state
                    $(this).prop("checked") ? kategorie.push($(this).val()) : kategorie = $.grep(kategorie, function (v) {
                        return v != actKat;
                    });
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
























//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.
(function(){function n(n){function t(t,r,e,u,i,o){for(;i>=0&&o>i;i+=n){var a=u?u[i]:i;e=r(e,t[a],a,t)}return e}return function(r,e,u,i){e=b(e,i,4);var o=!k(r)&&m.keys(r),a=(o||r).length,c=n>0?0:a-1;return arguments.length<3&&(u=r[o?o[c]:c],c+=n),t(r,e,u,o,c,a)}}function t(n){return function(t,r,e){r=x(r,e);for(var u=O(t),i=n>0?0:u-1;i>=0&&u>i;i+=n)if(r(t[i],i,t))return i;return-1}}function r(n,t,r){return function(e,u,i){var o=0,a=O(e);if("number"==typeof i)n>0?o=i>=0?i:Math.max(i+a,o):a=i>=0?Math.min(i+1,a):i+a+1;else if(r&&i&&a)return i=r(e,u),e[i]===u?i:-1;if(u!==u)return i=t(l.call(e,o,a),m.isNaN),i>=0?i+o:-1;for(i=n>0?o:a-1;i>=0&&a>i;i+=n)if(e[i]===u)return i;return-1}}function e(n,t){var r=I.length,e=n.constructor,u=m.isFunction(e)&&e.prototype||a,i="constructor";for(m.has(n,i)&&!m.contains(t,i)&&t.push(i);r--;)i=I[r],i in n&&n[i]!==u[i]&&!m.contains(t,i)&&t.push(i)}var u=this,i=u._,o=Array.prototype,a=Object.prototype,c=Function.prototype,f=o.push,l=o.slice,s=a.toString,p=a.hasOwnProperty,h=Array.isArray,v=Object.keys,g=c.bind,y=Object.create,d=function(){},m=function(n){return n instanceof m?n:this instanceof m?void(this._wrapped=n):new m(n)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=m),exports._=m):u._=m,m.VERSION="1.8.3";var b=function(n,t,r){if(t===void 0)return n;switch(null==r?3:r){case 1:return function(r){return n.call(t,r)};case 2:return function(r,e){return n.call(t,r,e)};case 3:return function(r,e,u){return n.call(t,r,e,u)};case 4:return function(r,e,u,i){return n.call(t,r,e,u,i)}}return function(){return n.apply(t,arguments)}},x=function(n,t,r){return null==n?m.identity:m.isFunction(n)?b(n,t,r):m.isObject(n)?m.matcher(n):m.property(n)};m.iteratee=function(n,t){return x(n,t,1/0)};var _=function(n,t){return function(r){var e=arguments.length;if(2>e||null==r)return r;for(var u=1;e>u;u++)for(var i=arguments[u],o=n(i),a=o.length,c=0;a>c;c++){var f=o[c];t&&r[f]!==void 0||(r[f]=i[f])}return r}},j=function(n){if(!m.isObject(n))return{};if(y)return y(n);d.prototype=n;var t=new d;return d.prototype=null,t},w=function(n){return function(t){return null==t?void 0:t[n]}},A=Math.pow(2,53)-1,O=w("length"),k=function(n){var t=O(n);return"number"==typeof t&&t>=0&&A>=t};m.each=m.forEach=function(n,t,r){t=b(t,r);var e,u;if(k(n))for(e=0,u=n.length;u>e;e++)t(n[e],e,n);else{var i=m.keys(n);for(e=0,u=i.length;u>e;e++)t(n[i[e]],i[e],n)}return n},m.map=m.collect=function(n,t,r){t=x(t,r);for(var e=!k(n)&&m.keys(n),u=(e||n).length,i=Array(u),o=0;u>o;o++){var a=e?e[o]:o;i[o]=t(n[a],a,n)}return i},m.reduce=m.foldl=m.inject=n(1),m.reduceRight=m.foldr=n(-1),m.find=m.detect=function(n,t,r){var e;return e=k(n)?m.findIndex(n,t,r):m.findKey(n,t,r),e!==void 0&&e!==-1?n[e]:void 0},m.filter=m.select=function(n,t,r){var e=[];return t=x(t,r),m.each(n,function(n,r,u){t(n,r,u)&&e.push(n)}),e},m.reject=function(n,t,r){return m.filter(n,m.negate(x(t)),r)},m.every=m.all=function(n,t,r){t=x(t,r);for(var e=!k(n)&&m.keys(n),u=(e||n).length,i=0;u>i;i++){var o=e?e[i]:i;if(!t(n[o],o,n))return!1}return!0},m.some=m.any=function(n,t,r){t=x(t,r);for(var e=!k(n)&&m.keys(n),u=(e||n).length,i=0;u>i;i++){var o=e?e[i]:i;if(t(n[o],o,n))return!0}return!1},m.contains=m.includes=m.include=function(n,t,r,e){return k(n)||(n=m.values(n)),("number"!=typeof r||e)&&(r=0),m.indexOf(n,t,r)>=0},m.invoke=function(n,t){var r=l.call(arguments,2),e=m.isFunction(t);return m.map(n,function(n){var u=e?t:n[t];return null==u?u:u.apply(n,r)})},m.pluck=function(n,t){return m.map(n,m.property(t))},m.where=function(n,t){return m.filter(n,m.matcher(t))},m.findWhere=function(n,t){return m.find(n,m.matcher(t))},m.max=function(n,t,r){var e,u,i=-1/0,o=-1/0;if(null==t&&null!=n){n=k(n)?n:m.values(n);for(var a=0,c=n.length;c>a;a++)e=n[a],e>i&&(i=e)}else t=x(t,r),m.each(n,function(n,r,e){u=t(n,r,e),(u>o||u===-1/0&&i===-1/0)&&(i=n,o=u)});return i},m.min=function(n,t,r){var e,u,i=1/0,o=1/0;if(null==t&&null!=n){n=k(n)?n:m.values(n);for(var a=0,c=n.length;c>a;a++)e=n[a],i>e&&(i=e)}else t=x(t,r),m.each(n,function(n,r,e){u=t(n,r,e),(o>u||1/0===u&&1/0===i)&&(i=n,o=u)});return i},m.shuffle=function(n){for(var t,r=k(n)?n:m.values(n),e=r.length,u=Array(e),i=0;e>i;i++)t=m.random(0,i),t!==i&&(u[i]=u[t]),u[t]=r[i];return u},m.sample=function(n,t,r){return null==t||r?(k(n)||(n=m.values(n)),n[m.random(n.length-1)]):m.shuffle(n).slice(0,Math.max(0,t))},m.sortBy=function(n,t,r){return t=x(t,r),m.pluck(m.map(n,function(n,r,e){return{value:n,index:r,criteria:t(n,r,e)}}).sort(function(n,t){var r=n.criteria,e=t.criteria;if(r!==e){if(r>e||r===void 0)return 1;if(e>r||e===void 0)return-1}return n.index-t.index}),"value")};var F=function(n){return function(t,r,e){var u={};return r=x(r,e),m.each(t,function(e,i){var o=r(e,i,t);n(u,e,o)}),u}};m.groupBy=F(function(n,t,r){m.has(n,r)?n[r].push(t):n[r]=[t]}),m.indexBy=F(function(n,t,r){n[r]=t}),m.countBy=F(function(n,t,r){m.has(n,r)?n[r]++:n[r]=1}),m.toArray=function(n){return n?m.isArray(n)?l.call(n):k(n)?m.map(n,m.identity):m.values(n):[]},m.size=function(n){return null==n?0:k(n)?n.length:m.keys(n).length},m.partition=function(n,t,r){t=x(t,r);var e=[],u=[];return m.each(n,function(n,r,i){(t(n,r,i)?e:u).push(n)}),[e,u]},m.first=m.head=m.take=function(n,t,r){return null==n?void 0:null==t||r?n[0]:m.initial(n,n.length-t)},m.initial=function(n,t,r){return l.call(n,0,Math.max(0,n.length-(null==t||r?1:t)))},m.last=function(n,t,r){return null==n?void 0:null==t||r?n[n.length-1]:m.rest(n,Math.max(0,n.length-t))},m.rest=m.tail=m.drop=function(n,t,r){return l.call(n,null==t||r?1:t)},m.compact=function(n){return m.filter(n,m.identity)};var S=function(n,t,r,e){for(var u=[],i=0,o=e||0,a=O(n);a>o;o++){var c=n[o];if(k(c)&&(m.isArray(c)||m.isArguments(c))){t||(c=S(c,t,r));var f=0,l=c.length;for(u.length+=l;l>f;)u[i++]=c[f++]}else r||(u[i++]=c)}return u};m.flatten=function(n,t){return S(n,t,!1)},m.without=function(n){return m.difference(n,l.call(arguments,1))},m.uniq=m.unique=function(n,t,r,e){m.isBoolean(t)||(e=r,r=t,t=!1),null!=r&&(r=x(r,e));for(var u=[],i=[],o=0,a=O(n);a>o;o++){var c=n[o],f=r?r(c,o,n):c;t?(o&&i===f||u.push(c),i=f):r?m.contains(i,f)||(i.push(f),u.push(c)):m.contains(u,c)||u.push(c)}return u},m.union=function(){return m.uniq(S(arguments,!0,!0))},m.intersection=function(n){for(var t=[],r=arguments.length,e=0,u=O(n);u>e;e++){var i=n[e];if(!m.contains(t,i)){for(var o=1;r>o&&m.contains(arguments[o],i);o++);o===r&&t.push(i)}}return t},m.difference=function(n){var t=S(arguments,!0,!0,1);return m.filter(n,function(n){return!m.contains(t,n)})},m.zip=function(){return m.unzip(arguments)},m.unzip=function(n){for(var t=n&&m.max(n,O).length||0,r=Array(t),e=0;t>e;e++)r[e]=m.pluck(n,e);return r},m.object=function(n,t){for(var r={},e=0,u=O(n);u>e;e++)t?r[n[e]]=t[e]:r[n[e][0]]=n[e][1];return r},m.findIndex=t(1),m.findLastIndex=t(-1),m.sortedIndex=function(n,t,r,e){r=x(r,e,1);for(var u=r(t),i=0,o=O(n);o>i;){var a=Math.floor((i+o)/2);r(n[a])<u?i=a+1:o=a}return i},m.indexOf=r(1,m.findIndex,m.sortedIndex),m.lastIndexOf=r(-1,m.findLastIndex),m.range=function(n,t,r){null==t&&(t=n||0,n=0),r=r||1;for(var e=Math.max(Math.ceil((t-n)/r),0),u=Array(e),i=0;e>i;i++,n+=r)u[i]=n;return u};var E=function(n,t,r,e,u){if(!(e instanceof t))return n.apply(r,u);var i=j(n.prototype),o=n.apply(i,u);return m.isObject(o)?o:i};m.bind=function(n,t){if(g&&n.bind===g)return g.apply(n,l.call(arguments,1));if(!m.isFunction(n))throw new TypeError("Bind must be called on a function");var r=l.call(arguments,2),e=function(){return E(n,e,t,this,r.concat(l.call(arguments)))};return e},m.partial=function(n){var t=l.call(arguments,1),r=function(){for(var e=0,u=t.length,i=Array(u),o=0;u>o;o++)i[o]=t[o]===m?arguments[e++]:t[o];for(;e<arguments.length;)i.push(arguments[e++]);return E(n,r,this,this,i)};return r},m.bindAll=function(n){var t,r,e=arguments.length;if(1>=e)throw new Error("bindAll must be passed function names");for(t=1;e>t;t++)r=arguments[t],n[r]=m.bind(n[r],n);return n},m.memoize=function(n,t){var r=function(e){var u=r.cache,i=""+(t?t.apply(this,arguments):e);return m.has(u,i)||(u[i]=n.apply(this,arguments)),u[i]};return r.cache={},r},m.delay=function(n,t){var r=l.call(arguments,2);return setTimeout(function(){return n.apply(null,r)},t)},m.defer=m.partial(m.delay,m,1),m.throttle=function(n,t,r){var e,u,i,o=null,a=0;r||(r={});var c=function(){a=r.leading===!1?0:m.now(),o=null,i=n.apply(e,u),o||(e=u=null)};return function(){var f=m.now();a||r.leading!==!1||(a=f);var l=t-(f-a);return e=this,u=arguments,0>=l||l>t?(o&&(clearTimeout(o),o=null),a=f,i=n.apply(e,u),o||(e=u=null)):o||r.trailing===!1||(o=setTimeout(c,l)),i}},m.debounce=function(n,t,r){var e,u,i,o,a,c=function(){var f=m.now()-o;t>f&&f>=0?e=setTimeout(c,t-f):(e=null,r||(a=n.apply(i,u),e||(i=u=null)))};return function(){i=this,u=arguments,o=m.now();var f=r&&!e;return e||(e=setTimeout(c,t)),f&&(a=n.apply(i,u),i=u=null),a}},m.wrap=function(n,t){return m.partial(t,n)},m.negate=function(n){return function(){return!n.apply(this,arguments)}},m.compose=function(){var n=arguments,t=n.length-1;return function(){for(var r=t,e=n[t].apply(this,arguments);r--;)e=n[r].call(this,e);return e}},m.after=function(n,t){return function(){return--n<1?t.apply(this,arguments):void 0}},m.before=function(n,t){var r;return function(){return--n>0&&(r=t.apply(this,arguments)),1>=n&&(t=null),r}},m.once=m.partial(m.before,2);var M=!{toString:null}.propertyIsEnumerable("toString"),I=["valueOf","isPrototypeOf","toString","propertyIsEnumerable","hasOwnProperty","toLocaleString"];m.keys=function(n){if(!m.isObject(n))return[];if(v)return v(n);var t=[];for(var r in n)m.has(n,r)&&t.push(r);return M&&e(n,t),t},m.allKeys=function(n){if(!m.isObject(n))return[];var t=[];for(var r in n)t.push(r);return M&&e(n,t),t},m.values=function(n){for(var t=m.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=n[t[u]];return e},m.mapObject=function(n,t,r){t=x(t,r);for(var e,u=m.keys(n),i=u.length,o={},a=0;i>a;a++)e=u[a],o[e]=t(n[e],e,n);return o},m.pairs=function(n){for(var t=m.keys(n),r=t.length,e=Array(r),u=0;r>u;u++)e[u]=[t[u],n[t[u]]];return e},m.invert=function(n){for(var t={},r=m.keys(n),e=0,u=r.length;u>e;e++)t[n[r[e]]]=r[e];return t},m.functions=m.methods=function(n){var t=[];for(var r in n)m.isFunction(n[r])&&t.push(r);return t.sort()},m.extend=_(m.allKeys),m.extendOwn=m.assign=_(m.keys),m.findKey=function(n,t,r){t=x(t,r);for(var e,u=m.keys(n),i=0,o=u.length;o>i;i++)if(e=u[i],t(n[e],e,n))return e},m.pick=function(n,t,r){var e,u,i={},o=n;if(null==o)return i;m.isFunction(t)?(u=m.allKeys(o),e=b(t,r)):(u=S(arguments,!1,!1,1),e=function(n,t,r){return t in r},o=Object(o));for(var a=0,c=u.length;c>a;a++){var f=u[a],l=o[f];e(l,f,o)&&(i[f]=l)}return i},m.omit=function(n,t,r){if(m.isFunction(t))t=m.negate(t);else{var e=m.map(S(arguments,!1,!1,1),String);t=function(n,t){return!m.contains(e,t)}}return m.pick(n,t,r)},m.defaults=_(m.allKeys,!0),m.create=function(n,t){var r=j(n);return t&&m.extendOwn(r,t),r},m.clone=function(n){return m.isObject(n)?m.isArray(n)?n.slice():m.extend({},n):n},m.tap=function(n,t){return t(n),n},m.isMatch=function(n,t){var r=m.keys(t),e=r.length;if(null==n)return!e;for(var u=Object(n),i=0;e>i;i++){var o=r[i];if(t[o]!==u[o]||!(o in u))return!1}return!0};var N=function(n,t,r,e){if(n===t)return 0!==n||1/n===1/t;if(null==n||null==t)return n===t;n instanceof m&&(n=n._wrapped),t instanceof m&&(t=t._wrapped);var u=s.call(n);if(u!==s.call(t))return!1;switch(u){case"[object RegExp]":case"[object String]":return""+n==""+t;case"[object Number]":return+n!==+n?+t!==+t:0===+n?1/+n===1/t:+n===+t;case"[object Date]":case"[object Boolean]":return+n===+t}var i="[object Array]"===u;if(!i){if("object"!=typeof n||"object"!=typeof t)return!1;var o=n.constructor,a=t.constructor;if(o!==a&&!(m.isFunction(o)&&o instanceof o&&m.isFunction(a)&&a instanceof a)&&"constructor"in n&&"constructor"in t)return!1}r=r||[],e=e||[];for(var c=r.length;c--;)if(r[c]===n)return e[c]===t;if(r.push(n),e.push(t),i){if(c=n.length,c!==t.length)return!1;for(;c--;)if(!N(n[c],t[c],r,e))return!1}else{var f,l=m.keys(n);if(c=l.length,m.keys(t).length!==c)return!1;for(;c--;)if(f=l[c],!m.has(t,f)||!N(n[f],t[f],r,e))return!1}return r.pop(),e.pop(),!0};m.isEqual=function(n,t){return N(n,t)},m.isEmpty=function(n){return null==n?!0:k(n)&&(m.isArray(n)||m.isString(n)||m.isArguments(n))?0===n.length:0===m.keys(n).length},m.isElement=function(n){return!(!n||1!==n.nodeType)},m.isArray=h||function(n){return"[object Array]"===s.call(n)},m.isObject=function(n){var t=typeof n;return"function"===t||"object"===t&&!!n},m.each(["Arguments","Function","String","Number","Date","RegExp","Error"],function(n){m["is"+n]=function(t){return s.call(t)==="[object "+n+"]"}}),m.isArguments(arguments)||(m.isArguments=function(n){return m.has(n,"callee")}),"function"!=typeof/./&&"object"!=typeof Int8Array&&(m.isFunction=function(n){return"function"==typeof n||!1}),m.isFinite=function(n){return isFinite(n)&&!isNaN(parseFloat(n))},m.isNaN=function(n){return m.isNumber(n)&&n!==+n},m.isBoolean=function(n){return n===!0||n===!1||"[object Boolean]"===s.call(n)},m.isNull=function(n){return null===n},m.isUndefined=function(n){return n===void 0},m.has=function(n,t){return null!=n&&p.call(n,t)},m.noConflict=function(){return u._=i,this},m.identity=function(n){return n},m.constant=function(n){return function(){return n}},m.noop=function(){},m.property=w,m.propertyOf=function(n){return null==n?function(){}:function(t){return n[t]}},m.matcher=m.matches=function(n){return n=m.extendOwn({},n),function(t){return m.isMatch(t,n)}},m.times=function(n,t,r){var e=Array(Math.max(0,n));t=b(t,r,1);for(var u=0;n>u;u++)e[u]=t(u);return e},m.random=function(n,t){return null==t&&(t=n,n=0),n+Math.floor(Math.random()*(t-n+1))},m.now=Date.now||function(){return(new Date).getTime()};var B={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","`":"&#x60;"},T=m.invert(B),R=function(n){var t=function(t){return n[t]},r="(?:"+m.keys(n).join("|")+")",e=RegExp(r),u=RegExp(r,"g");return function(n){return n=null==n?"":""+n,e.test(n)?n.replace(u,t):n}};m.escape=R(B),m.unescape=R(T),m.result=function(n,t,r){var e=null==n?void 0:n[t];return e===void 0&&(e=r),m.isFunction(e)?e.call(n):e};var q=0;m.uniqueId=function(n){var t=++q+"";return n?n+t:t},m.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var K=/(.)^/,z={"'":"'","\\":"\\","\r":"r","\n":"n","\u2028":"u2028","\u2029":"u2029"},D=/\\|'|\r|\n|\u2028|\u2029/g,L=function(n){return"\\"+z[n]};m.template=function(n,t,r){!t&&r&&(t=r),t=m.defaults({},t,m.templateSettings);var e=RegExp([(t.escape||K).source,(t.interpolate||K).source,(t.evaluate||K).source].join("|")+"|$","g"),u=0,i="__p+='";n.replace(e,function(t,r,e,o,a){return i+=n.slice(u,a).replace(D,L),u=a+t.length,r?i+="'+\n((__t=("+r+"))==null?'':_.escape(__t))+\n'":e?i+="'+\n((__t=("+e+"))==null?'':__t)+\n'":o&&(i+="';\n"+o+"\n__p+='"),t}),i+="';\n",t.variable||(i="with(obj||{}){\n"+i+"}\n"),i="var __t,__p='',__j=Array.prototype.join,"+"print=function(){__p+=__j.call(arguments,'');};\n"+i+"return __p;\n";try{var o=new Function(t.variable||"obj","_",i)}catch(a){throw a.source=i,a}var c=function(n){return o.call(this,n,m)},f=t.variable||"obj";return c.source="function("+f+"){\n"+i+"}",c},m.chain=function(n){var t=m(n);return t._chain=!0,t};var P=function(n,t){return n._chain?m(t).chain():t};m.mixin=function(n){m.each(m.functions(n),function(t){var r=m[t]=n[t];m.prototype[t]=function(){var n=[this._wrapped];return f.apply(n,arguments),P(this,r.apply(m,n))}})},m.mixin(m),m.each(["pop","push","reverse","shift","sort","splice","unshift"],function(n){var t=o[n];m.prototype[n]=function(){var r=this._wrapped;return t.apply(r,arguments),"shift"!==n&&"splice"!==n||0!==r.length||delete r[0],P(this,r)}}),m.each(["concat","join","slice"],function(n){var t=o[n];m.prototype[n]=function(){return P(this,t.apply(this._wrapped,arguments))}}),m.prototype.value=function(){return this._wrapped},m.prototype.valueOf=m.prototype.toJSON=m.prototype.value,m.prototype.toString=function(){return""+this._wrapped},"function"==typeof define&&define.amd&&define("underscore",[],function(){return m})}).call(this);
//# sourceMappingURL=underscore-min.map
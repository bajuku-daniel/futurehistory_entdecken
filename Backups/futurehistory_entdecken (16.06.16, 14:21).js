(function($) {
  Drupal.futurehistoryEntdecken = Drupal.futurehistoryEntdecken || {};

  Drupal.behaviors.futurehistoryEntdecken = {
    attach: function (context, settings) {
      $('.futurehistory-entdecken-map', context).each(function() {
        var $this = $(this);
        var mapId = this.id;
		console.log(mapId);
        Drupal.futurehistoryEntdecken[mapId] = {};

        // Creating map
        // The MAP div is located in "futurehistory-entdecken-map.tpl.php" and feed with the $atribute options created in "futurehistory_entdecken_plugin_style_google_map.inc" and the associated VIEW in the Drupal Backend
        var mapCenter = $this.data('map-center').split(',');
        Drupal.futurehistoryEntdecken[mapId].map = new google.maps.Map(this, {
          center: new google.maps.LatLng(parseFloat(mapCenter[0]), parseFloat(mapCenter[1])),
          zoom: parseInt($this.data('map-zoom'), 10),
          maxZoom: parseInt($this.data('map-max-zoom'), 10) || null,
          minZoom: parseInt($this.data('map-min-zoom'), 10) || null,
          mapTypeId: google.maps.MapTypeId[$this.data('map-type')],
          scrollwheel: $this.data('scroll-wheel'),
          disableDoubleClickZoom: $this.data('disable-double-click-zoom')
        });

        // Creating Info Window
        Drupal.futurehistoryEntdecken[mapId].infoWindow = new google.maps.InfoWindow();

        // Creating LatLngBounds
        var mapAutoCenter = $this.data('auto-center');
        if (mapAutoCenter) {
          Drupal.futurehistoryEntdecken[mapId].markersBounds = new google.maps.LatLngBounds();
        }

        // Creating markers
        // ATM we create the markers without BBOX informations from the Drupal.settings js created in: "futurehistory_entdecken_plugin_style_google_map.inc"  - we have to get the Marker Information from the BBOX Request

        Drupal.futurehistoryEntdecken[mapId].markers = [];
        $.each(Drupal.settings.futurehistoryEntdeckenMarkers[mapId], function() {
          var markerPosition = new google.maps.LatLng(this.lat, this.lng);
          var marker = new google.maps.Marker({
            position: markerPosition,
            map: Drupal.futurehistoryEntdecken[mapId].map,
            icon: this.icon,
            title: this.title,
            content: this.content,
            url: this.url,
            clickable: (this.title != '' || this.content != '' || this.url != '')
          });

          if (marker.url) {
            google.maps.event.addListener(marker, 'click', function() {
              location = marker.url;
            });
          }

          if (marker.content) {
            google.maps.event.addListener(marker, 'click', function() {
              Drupal.futurehistoryEntdecken[mapId].infoWindow.setContent(marker.content);
              Drupal.futurehistoryEntdecken[mapId].infoWindow.open(Drupal.futurehistoryEntdecken[mapId].map, marker);
            });
          }

          if (mapAutoCenter) {
            Drupal.futurehistoryEntdecken[mapId].markersBounds.extend(markerPosition);
          }
          
          Drupal.futurehistoryEntdecken[mapId].markers.push(marker);
        });

        if (mapAutoCenter) {
          Drupal.futurehistoryEntdecken[mapId].map.setCenter(
            Drupal.futurehistoryEntdecken[mapId].markersBounds.getCenter(),
            Drupal.futurehistoryEntdecken[mapId].map.fitBounds(Drupal.futurehistoryEntdecken[mapId].markersBounds)
          );
        }
        
        // Toggle the filter and sort boxes with jquery magic
        $("#thumbnail-navigation-filter-button").click(function(){
          $("#thumbnail-filter-box").toggle("slow");
        });


        // -------------------------------------------------------------------------------------------------------
        // the Date range REQUEST: we have to add a jquery Date Slider here to get some dynamic results
        // the Date Range : date=all <-- all dates, date=--1990 <-- all bevfore 1990, date=1990-- <-- all after 1990, date=1800--1990 <-- all between 1800 and 1990
        var date = 'all';

        // date slider stuff (linde@webgis.de, 2016/05) 
        // styles --> futurehistory_entdecken.css
        // add a DIV for the time-slider --> TODO: move to futurehistory-entdecken-map.tpl.php ??
        var KT_wrapper_html  = '<div id="kt_select_box"></div>'; 
        var K_select_html    = '<div id="kategory_selector">' +
                               '  <label for="kategorie">Kategorie wählen</label>' +
                               '  <select name="kategorie" id="kategorie">' +
                               '    <option selected="selected">Alle</option>' +
                               '    <option>Erinnern</option>' +
                               '    <option>Stadtbild</option>' +
                               '    <option>Tourismus</option>' +
                               '  </select>' +
                               '</div>'; 
        var T_wrapper_html   = '<div id="time_slider_box"></div>'; 
        var T_slider_html    = '<div id="time_slider"></div>'; 
        var T_display_html   = '<div id="time_display">' +
                               '  <label for="time_range">Zeitraum:</label>' +
                               '  <input type="text" id="time_range">' +
                               '</div>'; 

        // Map-Overlay inside futurehistory-entdecken-fh-map-page 
        $("#"+mapId).append(KT_wrapper_html);
        $("#kt_select_box").append(K_select_html);
        // ---> ui.selectmenu fehlt noch $("#kategory_selector").selectmenu();
        $("#kt_select_box").append(T_wrapper_html);
        $("#time_slider_box").append(T_slider_html);
        $("#time_slider_box").append(T_display_html);
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
        // time rage display in GUI
        $("#time_range").val("Jahr " + $("#time_slider").slider("values", 0) + " - Jahr " + $("#time_slider").slider("values", 1));
        // on stop Slider inteaction: fire gmap idle event --> ajax Request....
        $("#time_slider").on( "slidestop", function( event, ui ) {
           google.maps.event.trigger(Drupal.futurehistoryEntdecken[mapId].map, 'idle');
        });
        // end of date slider stuff 

        // -------------------------------------------------------------------------------------------------------
        // HACK to move the gmap selector "Karte Satellit" out of Top-Position
        // stolen from: http://stackoverflow.com/questions/2934269/google-maps-api-v3-custom-controls-position 
        // see http://jsfiddle.net/jP65p/ 
        // control newpos_map_selector in futurehistory_entdecken.css
        google.maps.event.addDomListener(Drupal.futurehistoryEntdecken[mapId].map, 'tilesloaded', function () {
          if ($("#newpos_map_selector").length == 0) {
            $("div.gmnoprint").last().wrap('<div id="newpos_map_selector" />');
            $("div.gmnoprint").fadeIn(500);
          }
        });
        var setPos = function () {
          google.maps.event.trigger(Drupal.futurehistoryEntdecken[mapId].map, 'tilesloaded');
        };
        window.setTimeout(setPos, 1000);

        // Disable zoom control (+/- Buttone ---> mouse wheel)
        Drupal.futurehistoryEntdecken[mapId].map.setOptions({zoomControl: false});
        // End of changing default behaivor of gmap-Controls
        // -------------------------------------------------------------------------------------------------------

        // start google maps IDLE function and ask for the boundingbox .getBounds
	google.maps.event.addListener(Drupal.futurehistoryEntdecken[mapId].map, 'idle', function() {

          var bounds = Drupal.futurehistoryEntdecken[mapId].map.getBounds();
          
          //sort and order the bbox results
          var bbox_bottom = bounds.H.H;
          var bbox_top = bounds.H.j;
          var bbox_right = bounds.j.H;
          var bbox_left = bounds.j.j;
          var bbox = bbox_left + ',' + bbox_bottom + ',' + bbox_right + ',' + bbox_top;

       
          //request kategoriefilter -- Request name: field_kategorie_name (dont leave emty)
          var kategorie = 'Erinnern, Stadtbild, Tourismus'
    
          // the request URL TODO: we have to set it in the drupal.settings JS to make it more dynamic
          var poi_url = '/de/fh_view/fh_bbox_pois';

          // start the ajax request 
          $.ajax({
            url: poi_url ,
            method: "GET",
            data: {bbox : bbox, date : date, field_kategorie_name : kategorie }, 
            dataType: "json",   
            success: function(data) {
              $('#thumbnail-pois').empty();
              for (var i in data ) {
                var poi_element = '<li>'+ data[i]['title'] + ' || in Meinen Sammlungen: ' + data[i]['flagged'] + ' || Jahr: ' + data[i]['Jahr'] +  ' || Kategorie: ' + data[i]['kategorie'] + '</li>';
                console.log(data[i]);
               
                $('#thumbnail-pois').append(poi_element);
              }
            }
          });

        // end event listner GOOGLE IDLE function
		}); 

      // ending all the drupal behaviors,atach, settings stuff..
      });
    }
  };
})(jQuery);

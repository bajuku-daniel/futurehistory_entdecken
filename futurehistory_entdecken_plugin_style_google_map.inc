<?php

class futurehistory_entdecken_plugin_style_google_map extends views_plugin_style {

  /**
   * Set default options
   */
  function option_definition() {
    $options = parent::option_definition();

    $options['map_width'] = array('default' => '100%');
    $options['map_height'] = array('default' => '400px');
    $options['map_center'] = array('default' => '0,0');
    $options['map_zoom'] = array('default' => '4');
    $options['map_min_zoom'] = array('default' => 1);
    $options['map_max_zoom'] = array('default' => 19);
    $options['map_type'] = array('default' => 'ROADMAP');
    $options['marker_icon_field'] = array('default' => '');
    $options['marker_url_field'] = array('default' => '');
    $options['marker_title_field'] = array('default' => '');
    $options['use_marker_clusterer'] = array('default' => FALSE);
    $options['marker_clusterer']['grid_size'] = array('default' => 60);
    $options['marker_clusterer']['max_zoom'] = array('default' => '');
    $options['marker_clusterer']['icon_url'] = array('default' => '');
    $options['marker_clusterer']['icon_size'] = array('default' => '');
    $options['map_auto_center_and_zoom'] = array('default' => TRUE);
    $options['map_disable_scroll_wheel'] = array('default' => FALSE);
    $options['map_disable_double_click_zoom'] = array('default' => FALSE);
    $options['marker_position_field'] = array('default' => '');

    return $options;
  }

  /**
   * Options form.
   */
  function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);

    $zoom_options = drupal_map_assoc(array(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19));

    $field_options = array('' => t('< none >'));
    $fields = $this->display->handler->get_handlers('field');
    foreach ($fields as $id => $handler) {
      $field_options[$id] = $handler->ui_name(FALSE);
    }

    $form['map_width'] = array(
      '#title' => t('Map width'),
      '#type' => 'textfield',
      '#default_value' => $this->options['map_width'],
      '#size' => 5,
    );

    $form['map_height'] = array(
      '#title' => t('Map height'),
      '#type' => 'textfield',
      '#default_value' => $this->options['map_height'],
      '#size' => 5,
    );

    $form['map_center'] = array(
      '#title' => t('Map center'),
      '#type' => 'textfield',
      '#default_value' => $this->options['map_center'],
      '#size' => 40,
    );

    $form['map_zoom'] = array(
      '#title' => t('Map zoom'),
      '#type' => 'select',
      '#options' => $zoom_options,
      '#default_value' => $this->options['map_zoom'],
    );

    $form['map_min_zoom'] = array(
      '#title' => t('Minimum map zoom'),
      '#type' => 'select',
      '#options' => $zoom_options,
      '#default_value' => $this->options['map_min_zoom'],
    );

    $form['map_max_zoom'] = array(
      '#title' => t('Maximum map zoom'),
      '#type' => 'select',
      '#options' => $zoom_options,
      '#default_value' => $this->options['map_max_zoom'],
    );

    $form['map_type'] = array(
      '#title' => t('Map type'),
      '#type' => 'select',
      '#options' => drupal_map_assoc(array('ROADMAP', 'SATELLITE', 'HYBRID', 'TERRAIN')),
      '#default_value' => $this->options['map_type'],
    );

    $form['marker_icon_field'] = array(
      '#title' => t('Marker icon field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_icon_field'],
    );

    $form['marker_url_field'] = array(
      '#title' => t('Marker url field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_url_field'],
    );

    $form['marker_title_field'] = array(
      '#title' => t('Marker title field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_title_field'],
    );
    $form['marker_position_field'] = array(
      '#title' => t('Marker position field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_position_field'],
    );



    $form['use_marker_clusterer'] = array(
      '#title' => t('Use MarkerClusterer'),
      '#type' => 'checkbox',
      '#default_value' => $this->options['use_marker_clusterer'],
    );

    $form['marker_clusterer'] = array(
      '#title' => t('MarkerClusterer options'),
      '#type' => 'fieldset',
      '#collapsible' => TRUE,
      '#collapsed' => TRUE,
      '#states' => array(
        'visible' => array(
          '#edit-style-options-use-marker-clusterer' => array('checked' => TRUE)
        )
      ),
    );

    $form['marker_clusterer']['grid_size'] = array(
      '#title' => t('Grid size'),
      '#description' => t('The grid size of a cluster in pixel. Each cluster will be a square. If you want the algorithm to run faster, you can set this value larger. The default value is 60.'),
      '#type' => 'textfield',
      '#default_value' => $this->options['marker_clusterer']['grid_size'],
      '#size' => 5,
    );

    $form['marker_clusterer']['max_zoom'] = array(
      '#title' => t('Max zoom'),
      '#description' => t('The max zoom level monitored by a marker cluster. If not given, the marker cluster assumes the maximum map zoom level. When maxZoom is reached or exceeded all markers will be shown without cluster.'),
      '#type' => 'select',
      '#options' => array('' => t('- none -')) + $zoom_options,
      '#default_value' => $this->options['marker_clusterer']['max_zoom'],
    );

    $form['marker_clusterer']['icon_url'] = array(
      '#title' => t('Custom icon url'),
      '#description' => t('The image url.'),
      '#type' => 'textfield',
      '#default_value' => $this->options['marker_clusterer']['icon_url'],
    );

    $form['marker_clusterer']['icon_size'] = array(
      '#title' => t('Custom icon size'),
      '#description' => t('The image width and height. Example: 32x32'),
      '#type' => 'textfield',
      '#default_value' => $this->options['marker_clusterer']['icon_size'],
      '#size' => 5,
      '#states' => array(
        'visible' => array(
          '#edit-style-options-use-marker-clusterer' => array('checked' => TRUE)
        )
      ),
    );

    $form['map_auto_center_and_zoom'] = array(
      '#title' => t('Automatically center and zoom map'),
      '#type' => 'checkbox',
      '#default_value' => $this->options['map_auto_center_and_zoom'],
    );

    $form['map_disable_scroll_wheel'] = array(
      '#title' => t('Disable scroll wheel'),
      '#type' => 'checkbox',
      '#default_value' => $this->options['map_disable_scroll_wheel'],
    );

    $form['map_disable_double_click_zoom'] = array(
      '#title' => t('Disable double click zoom'),
      '#type' => 'checkbox',
      '#default_value' => $this->options['map_disable_double_click_zoom'],
    );
  }

  /**
   * Render the display in this style.
   */
  function render() {
    if (isset($this->view->live_preview) && $this->view->live_preview) {
      return t('Selected style are not compatible with live preview.');
    }

    $futurehistory_field = '';
    foreach ($this->view->field as $field_name => $field_handler) {
      if (isset($field_handler->field_info) && $field_handler->field_info['type'] == 'futurehistory_field') {
        $futurehistory_field = $field_name;
        break;
      }
    }
    if (!$futurehistory_field) {
      return t('Add futurehistory field to fields list.');
    }

    $this->view->field[$futurehistory_field]->options['exclude'] = TRUE;
  //  $this->render_fields($this->view->result);
    $markers = array();


    foreach ($this->view->result as $row_index => $row) {
      if (!$row->{'field_' . $futurehistory_field}) {
        continue;
      }

      $marker_icon = '';
      if ($this->options['marker_icon_field']) {
        $marker_icon = $this->view->render_field($this->options['marker_icon_field'],$row_index );
      }

      $marker_url = '';
      if ($this->options['marker_url_field']) {
        $marker_url = $this->view->render_field($this->options['marker_url_field'], $row_index);
      }

      $marker_title = '';
      if ($this->options['marker_title_field']) {
        $marker_title = $row->node_title;
      }

      // get all portal dates
      //ATTENTION : needs field "jahr" in the MAP as raw view
      $portal_dates[] = $row->field_field_jahr[0]['raw']['value'];


      //get the Koordinates from the futurehistory field
      //$this->view->row_index = $row_index;
      //$marker_content = $this->row_plugin->render($row);
      foreach ($row->{'field_' . $futurehistory_field} as $field_value) {
        $markers[] = array(
          'lat' => (float)$field_value['raw']['lat'],
          'lng' => (float)$field_value['raw']['lng'],
          'icon' => $marker_icon,
          'url' => $marker_url,
          //'content' => $marker_content,
          'title' => $marker_title,
        );
      }
    }

    unset($this->view->row_index);

    // sort all dates and get first/last
    sort($portal_dates);
    $portal_date_first = reset($portal_dates);
    $portal_date_last = end($portal_dates);

    // check user acces to create flag lists
    global $user;
    $add_to_tour_access = user_access('create flag lists', $account = $user);

    //and add to the JS drupal settings
    drupal_add_js(array(
      'futurehistoryEntdecken' => array(
        'first_date' => $portal_date_first,
        'last_date' => $portal_date_last,
        'tour_access' => $add_to_tour_access,
      ),
    ), 'setting');

    drupal_add_library('system', 'ui');
    drupal_add_library('system', 'ui.spinner');
    drupal_add_library('system', 'ui.slider');
    drupal_add_library('system', 'jquery.cookie');
    // wo ist der hook?  drupal_add_library('system', 'ui.selectmenu');
    drupal_add_css(drupal_get_path('module', 'futurehistory_entdecken') . '/futurehistory_entdecken.css');
    drupal_add_css(drupal_get_path('module', 'flag') . '/theme/flag.css');

    $map_id = drupal_html_id('futurehistory-entdecken-' . $this->view->name . '-' . $this->view->current_display);
    drupal_alter('futurehistory_entdecken_markers', $markers, $this->view);

    //Daniel Frings: @linde -> i think here is something wrong -> do we need all markers in the drupal settings? - no we don't
    // drupal_add_js(array(
    //   'futurehistoryEntdeckenMarkers' => array(
    //     $map_id => $markers,
    //   ),
    // ), 'setting');


    $protocol = empty($_SERVER['HTTPS']) ? 'http' : 'https';
//    drupal_add_js($protocol . '://maps.googleapis.com/maps/api/js?key=AIzaSyCHmLzcxDDh2_JJ2oB6ma8YwMFiohtZC2c&signed_in=false&libraries=places,geometry', array('type' => 'external'));
    drupal_add_js($protocol . '://maps.googleapis.com/maps/api/js?key=AIzaSyDyEdQcuCkTdfq-S7i3TZDACoG2dXRoMC8&signed_in=false&libraries=places,geometry', array('type' => 'external'));
    if ($this->options['use_marker_clusterer']) {
      // drupal_add_js($protocol . '://google-maps-utility-library-v3.googlecode.com/svn/trunk/markerclusterer/src/markerclusterer.js', array('type' => 'external'));
      // linde 2016-10-06: changed to
      // drupal_add_js($protocol . '://developers.google.com/maps/documentation/javascript/examples/markerclusterer/markerclusterer.js', array('type' => 'external'));
    }
    //drupal_add_js(drupal_get_path('module', 'futurehistory_entdecken') . '/markerclusterer.js');
    drupal_add_js(drupal_get_path('module', 'flag') . '/theme/flag.js');
    drupal_add_js(drupal_get_path('module', 'futurehistory_entdecken') . '/futurehistory_entdecken.js');
    drupal_add_js(drupal_get_path('module', 'futurehistory_entdecken') . '/js-plugins/jquery.scrollTo.min.js');

    drupal_add_js(drupal_get_path('module', 'futurehistory_entdecken') . '/js-plugins/tooltipster.bundle.min.js');
    drupal_add_js(drupal_get_path('module', 'futurehistory_entdecken') . '/js-plugins/chosen.jquery.min.js');
    drupal_add_css(drupal_get_path('module', 'futurehistory_entdecken') . '/js-plugins/css/tooltipster.bundle.min.css',array('group' => CSS_DEFAULT, 'type' => 'file'));
    drupal_add_css(drupal_get_path('module', 'futurehistory_entdecken') . '/js-plugins/css/chosen.min.css',array('group' => CSS_DEFAULT, 'type' => 'file'));
    drupal_add_css(drupal_get_path('module', 'futurehistory_entdecken') . '/filter.css',array('group' => CSS_DEFAULT, 'type' => 'file'));
    $bbox_raw = (isset($_GET['bbox']) ? $_GET['bbox'] : 'noBbox');

    return theme($this->theme_functions(), array(
      'view' => $this->view,
      'options' => $this->options,
      'attributes_array' => array(
        'id' => $map_id,
        'class' => 'futurehistory-entdecken-map',
        'style' => 'width:' . $this->options['map_width'] . '; height:' . $this->options['map_height'],
        'data-map-center' => $this->options['map_center'],
        'data-map-zoom' => $this->options['map_zoom'],
        'data-map-max-zoom' => $this->options['map_max_zoom'],
        'data-map-min-zoom' => $this->options['map_min_zoom'],
        'data-map-type' => $this->options['map_type'],
        'data-use-marker-clusterer' => $this->options['use_marker_clusterer'],
        'data-marker-clusterer-grid-size' => $this->options['marker_clusterer']['grid_size'],
        'data-marker-clusterer-max-zoom' => $this->options['marker_clusterer']['max_zoom'],
        'data-marker-clusterer-icon-url' => $this->options['marker_clusterer']['icon_url'],
        'data-marker-clusterer-icon-size' => $this->options['marker_clusterer']['icon_size'],
        'data-auto-center' => $this->options['map_auto_center_and_zoom'],
        'data-scroll-wheel' => (int)!$this->options['map_disable_scroll_wheel'],
        'data-disable-double-click-zoom' => (int)$this->options['map_disable_double_click_zoom'],
        'bbox' => $bbox_raw,
      ),
      'markers' =>  $markers,
    ));

  }
}

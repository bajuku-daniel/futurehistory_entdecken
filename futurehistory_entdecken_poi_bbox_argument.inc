<?php

class futurehistory_entdecken_poi_bbox_argument extends views_handler_argument {

  function option_definition() {
    $options = parent::option_definition();
    $options['arg_id'] = array('default' => 'bbox');
    $options['empty_result'] = array(
      'default' => FALSE,
      'bool' => TRUE,
    );
    $options['bbox_wrap'] = array('default' => TRUE, 'bool' => TRUE);
    return $options;
  }


  /**
   * Override the default argument form.
   */
  public function default_argument_form(&$form, &$form_state) {
    parent::default_argument_form($form, $form_state);
    // Clarify this, since we're treating pulling from the query string as
    // different than a normal arg.
    $form['no_argument']['#title'] = 'When the filter value is NOT in the URL <em>as a normal Drupal argument</em>';
    $form['empty_result'] = array(
      '#type' => 'checkbox',
      '#title' => t('Empty result on missing bounding box value'),
      '#description' => t('When the argument is not found you may choose to show no result.'),
      '#default_value' => $this->options['empty_result'],
    );

  }

  /**
   * Provide additional form options.
   */
  public function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);

    $form['bbox_wrap'] = array(
      '#type' => 'checkbox',
      '#title' => t('Wrap the bounding box around 360 degrees.'),
      '#description' => t('Depending on the projection of the data it is possible that the bounding box wraps around the edges of the map. This requires extra conditions in the views query. By default wrapping is enabled. Turn it of if the provided coordinates never wrap.'),
      '#default_value' => $this->options['bbox_wrap'],
    );
  }

  public function query($group_by = FALSE) {

    

    $this->ensure_my_table();

    $bbox = $this->_explode_bbox_coords($this->argument);

    if (isset($this->view->display_handler->display->display_options['style_options'])) {
      $data_source = $this->view->display_handler->display->display_options['style_options']['marker_position_field'];
     }
    else {
      $data_source = $this->view->display['default']->display_options['style_options']['marker_position_field'];
    }


    $field_obj = $this->view->field[$data_source];
    $field_table = $field_obj->table;

    // we need to dig a bit deeper to find  futurehistory field names.
    $lat_field_name = $field_obj->field_info['storage']['details']['sql']['FIELD_LOAD_CURRENT'][$field_table]['lat'];
    $lon_field_name = $field_obj->field_info['storage']['details']['sql']['FIELD_LOAD_CURRENT'][$field_table]['lng'];

    $this->query->ensure_table($field_table);

    $left = $bbox['left'];
    $bottom = $bbox['bottom'];
    $right = $bbox['right'];
    $top = $bbox['top'];

    if ($this->options['bbox_wrap']) {
      if ($right - $left < 360) {
        $group = $this->query->set_where_group('AND');
        if ($left > -180 && $left <= 180) {
          $this->query->add_where($group, "$field_table.$lon_field_name", $left, '>=');
        }
        else {
          $this->query->set_where_group('OR', $group);
          $left = ($left + 180) % 360;
          if ($left <= 0) $left += 360; 
          $left -= 180;
          $this->query->add_where($group, "$field_table.$lon_field_name", array(
            $left,
            180,
          ), 'BETWEEN');
        }
        if ($right > -180 && $right <= 180) {
          $this->query->add_where($group, "$field_table.$lon_field_name", $right, '<=');
        }
        else {
          $this->query->set_where_group('OR', $group);
          $right = ($right + 180) % 360;
          if ($right <= 0) $right += 360;
          $right -= 180;
          $this->query->add_where($group, "$field_table.$lon_field_name", array(
            -180,
            $right,
          ), 'BETWEEN');
        }
      }
    }
    else {
      $group = $this->query->set_where_group('AND');
      $this->query->add_where($group, "$field_table.$lon_field_name", $left, '>=');
      $this->query->add_where($group, "$field_table.$lon_field_name", $right, '<=');
    }

    $group = $this->query->set_where_group('AND');
    $this->query->add_where($group, "$field_table.$lat_field_name", $bottom, '>=');
    $this->query->add_where($group, "$field_table.$lat_field_name", $top, '<=');

 
  }

  private function _explode_bbox_coords($bbox_coords_str) {
    if (!is_string($bbox_coords_str)) {
      return array();
    }

    $bbox_coords = explode(',', $bbox_coords_str);
    if (count($bbox_coords) == 4) {
      if (!$this->_check_bbox_coords($bbox_coords)) {
        return array();
      }
      $bbox = array(
        'left' => $bbox_coords[0],
        'bottom' => $bbox_coords[1],
        'right' => $bbox_coords[2],
        'top' => $bbox_coords[3],
      );
      return $bbox;
    }
    else {
      return array();
    }
  }
  private function _check_bbox_coords($bbox_coords) {
    foreach ($bbox_coords as $coord) {
      if (!is_numeric($coord)) {
        return FALSE;
      }
    }
    return TRUE;
  }

}



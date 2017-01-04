<?php

class futurehistory_entdecken_poi_bbox extends views_plugin_style {

  /**
   * Set default options
   */
  function option_definition() {
    $options = parent::option_definition();
    $options['marker_nid_field'] = array('default' => '');
    $options['marker_year_field'] = array('default' => '');
    $options['marker_stadt_field'] = array('default' => '');
    $options['marker_url_field'] = array('default' => '');
    $options['marker_title_field'] = array('default' => '');
    $options['marker_position_field'] = array('default' => '');
    $options['marker_changed_field'] = array('default' => '');
    $options['marker_img_main_field'] = array('default' => '');
    $options['marker_img_thumb_field'] = array('default' => '');
    $options['marker_img_overlay_field'] = array('default' => '');
    $options['marker_flagged_field'] = array('default' => '');
    $options['marker_flagged_link_field'] = array('default' => '');
    $options['marker_kategorie_field'] = array('default' => '');
    $options['marker_overlay_year_field'] = array('default' => '');
    $options['marker_is_in_tour'] = array('default' => '');

    return $options;
  }

  /**
   * Options form.
   */
  function options_form(&$form, &$form_state) {
    parent::options_form($form, $form_state);

    $field_options = array('' => t('< none >'));
    $fields = $this->display->handler->get_handlers('field');
    foreach ($fields as $id => $handler) {
      $field_options[$id] = $handler->ui_name(FALSE);
    }


    $form['marker_nid_field'] = array(
      '#title' => t('Marker nid field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_nid_field'],
    );
    $form['marker_year_field'] = array(
      '#title' => t('Marker year field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_year_field'],
    );
    $form['marker_stadt_field'] = array(
      '#title' => t('Marker stadt field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_stadt_field'],
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
 $form['marker_changed_field'] = array(
      '#title' => t('Marker Ansicht Changed field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_changed_field'],
    );

 $form['marker_img_main_field'] = array(
      '#title' => t('Marker Ansicht Hauptbild field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_img_main_field'],
    );

 $form['marker_img_thumb_field'] = array(
      '#title' => t('Marker Ansicht Thumbnail field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_img_thumb_field'],
    );

 $form['marker_img_overlay_field'] = array(
      '#title' => t('Marker Ansicht Overlay field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_img_overlay_field'],
    );
 $form['marker_flagged_field'] = array(
      '#title' => t('Marker flagged boolean field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_flagged_field'],
    );

 $form['marker_flagged_link_field'] = array(
      '#title' => t('Marker flagged link field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_flagged_link_field'],
    );

 $form['marker_kategorie_field'] = array(
      '#title' => t('Marker kategorie field'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_kategorie_field'],
    );
    $form['marker_overlay_year_field'] = array(
         '#title' => t('Marker overlay picture year field'),
         '#type' => 'select',
         '#options' => $field_options,
         '#default_value' => $this->options['marker_overlay_year_field'],
       );
    $form['marker_is_in_tour'] = array(
      '#title' => t('list of tour IDs'),
      '#type' => 'select',
      '#options' => $field_options,
      '#default_value' => $this->options['marker_is_in_tour'],
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

//    $this->render_fields($this->view->result);
    $markers = array();

    foreach ($this->view->result as $row_index => $row) {
      if (!$row->{'field_' . $futurehistory_field}) {
        continue;
      }


      $marker_nid = '';
      if ($this->options['marker_nid_field']) {
        $marker_nid = $this->view->render_field($this->options['marker_nid_field'],$row_index);
      }
      $marker_year = '';
      if ($this->options['marker_year_field']) {
        $marker_year = $this->view->render_field($this->options['marker_year_field'],$row_index);
      }
      $marker_stadt = '';
      if ($this->options['marker_stadt_field']) {
        $marker_stadt = $this->view->render_field($this->options['marker_stadt_field'], $row_index);
      }
      $marker_url = '';
      if ($this->options['marker_url_field']) {
        $marker_url = $this->view->render_field($this->options['marker_url_field'], $row_index);
      }
      $marker_title = '';
      if ($this->options['marker_title_field']) {
        $marker_title = $this->view->render_field($this->options['marker_title_field'], $row_index);
        $marker_title = strip_tags($marker_title);
        $marker_title = decode_entities($marker_title);
      }
      $marker_changed = '';
      if ($this->options['marker_changed_field']) {
        $marker_changed = $this->view->render_field($this->options['marker_changed_field'], $row_index);
      }
      $marker_img_main = '';
      if ($this->options['marker_img_main_field']) {
        $marker_img_main = $this->view->render_field($this->options['marker_img_main_field'], $row_index);
      }
      $marker_img_thumb = '';
      if ($this->options['marker_img_thumb_field']) {
        $marker_img_thumb = $this->view->render_field($this->options['marker_img_thumb_field'], $row_index);
      }
      $marker_img_overlay = '';
      if ($this->options['marker_img_overlay_field']) {
        $marker_img_overlay = $this->view->render_field($this->options['marker_img_overlay_field'],$row_index);
      }
      $marker_flagged = '';
      if ($this->options['marker_flagged_field']) {
        $marker_flagged = $this->view->render_field($this->options['marker_flagged_field'], $row_index);
      }
      $marker_flagged_link = '';
      if ($this->options['marker_flagged_link_field']) {
        $marker_flagged_link = $this->view->render_field($this->options['marker_flagged_link_field'], $row_index);
      }
      $marker_kategorie = '';
      if ($this->options['marker_kategorie_field']) {
        $marker_kategorie = $this->view->render_field($this->options['marker_kategorie_field'],$row_index);
      }
      $marker_overlay_year = '';
      if ($this->options['marker_overlay_year_field']) {
        $marker_overlay_year = $this->view->render_field($this->options['marker_overlay_year_field'], $row_index);
      }
      $marker_is_in_tour = '';
      if ($this->options['marker_is_in_tour']) {
        $marker_is_in_tour_unformated = $this->view->render_field($this->options['marker_is_in_tour'], $row_index);
        $marker_is_in_tour = preg_replace('/\s+/', '', $marker_is_in_tour_unformated);
        //$marker_is_in_tour = json_encode($marker_is_in_tour_unformated);


      }


      //get the Koordinates from the futurehistory field
      $this->view->row_index = $row_index;

      foreach ($row->{'field_' . $futurehistory_field} as $field_value) {
        $markers[] = array(
          'Nid' => $marker_nid,
          'Jahr' => $marker_year,
          'lat' => (float)$field_value['raw']['lat'],
          'lon' => (float)$field_value['raw']['lng'],
          'direction' => (float)$field_value['raw']['view_direction'],
          'angle' => (float)$field_value['raw']['angle'],
          'dist' => (float)$field_value['raw']['dist'],
          'Stadt' => $marker_stadt,
          'url' => $marker_url,
          'title' => $marker_title,
          'bild-haupt' => $marker_img_main,
          'bild-haupt-thumb' => $marker_img_thumb,
          'bild-overlay' => $marker_img_overlay,
          'aktualisiert' => $marker_changed,
          'flagged' => $marker_flagged,
          'flagged-link' => $marker_flagged_link,
          'kategorie' => $marker_kategorie,
          'overlay-year' => $marker_overlay_year,
          'tour_id' => $marker_is_in_tour,
        );
      }
    }
    unset($this->view->row_index);

    return drupal_json_encode($markers);

  }
}

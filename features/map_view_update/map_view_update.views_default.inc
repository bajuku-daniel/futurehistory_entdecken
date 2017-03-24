<?php
/**
 * @file
 * map_view_update.views_default.inc
 */

/**
 * Implements hook_views_default_views().
 */
function map_view_update_views_default_views() {
  $export = array();

  $view = new view();
  $view->name = 'fh_view_bbox';
  $view->description = '';
  $view->tag = 'default';
  $view->base_table = 'node';
  $view->human_name = 'fh_pois';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['title'] = 'fh_pois';
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['exposed_form']['options']['reset_button_label'] = 'Zurücksetzen';
  $handler->display->display_options['exposed_form']['options']['exposed_sorts_label'] = 'Sortierung';
  $handler->display->display_options['pager']['type'] = 'none';
  $handler->display->display_options['style_plugin'] = 'default';
  $handler->display->display_options['row_plugin'] = 'fields';
  /* Feld: Inhalt: Titel */
  $handler->display->display_options['fields']['title']['id'] = 'title';
  $handler->display->display_options['fields']['title']['table'] = 'node';
  $handler->display->display_options['fields']['title']['field'] = 'title';
  $handler->display->display_options['fields']['title']['label'] = '';
  $handler->display->display_options['fields']['title']['alter']['word_boundary'] = FALSE;
  $handler->display->display_options['fields']['title']['alter']['ellipsis'] = FALSE;
  /* Feld: Inhalt: Bildposition */
  $handler->display->display_options['fields']['field_position_der_aufnahme']['id'] = 'field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['table'] = 'field_data_field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['field'] = 'field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['click_sort_column'] = 'lat';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['type'] = 'services';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['settings'] = array(
    'data_element_key' => '',
    'skip_safe' => 0,
    'skip_empty_values' => 0,
  );
  /* Feld: Inhalt: Nid */
  $handler->display->display_options['fields']['nid']['id'] = 'nid';
  $handler->display->display_options['fields']['nid']['table'] = 'node';
  $handler->display->display_options['fields']['nid']['field'] = 'nid';
  /* Feld: Inhalt: Kategorie */
  $handler->display->display_options['fields']['field_kategorie']['id'] = 'field_kategorie';
  $handler->display->display_options['fields']['field_kategorie']['table'] = 'field_data_field_kategorie';
  $handler->display->display_options['fields']['field_kategorie']['field'] = 'field_kategorie';
  $handler->display->display_options['fields']['field_kategorie']['type'] = 'taxonomy_term_reference_plain';
  $handler->display->display_options['fields']['field_kategorie']['delta_offset'] = '0';
  /* Contextual filter: Benutzerdefiniert: Futurehistory Bounding box */
  $handler->display->display_options['arguments']['bbox_argument']['id'] = 'bbox_argument';
  $handler->display->display_options['arguments']['bbox_argument']['table'] = 'views';
  $handler->display->display_options['arguments']['bbox_argument']['field'] = 'bbox_argument';
  $handler->display->display_options['arguments']['bbox_argument']['default_action'] = 'default';
  $handler->display->display_options['arguments']['bbox_argument']['exception']['title'] = 'Alle';
  $handler->display->display_options['arguments']['bbox_argument']['default_argument_type'] = 'querystring';
  $handler->display->display_options['arguments']['bbox_argument']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['bbox_argument']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['bbox_argument']['summary_options']['items_per_page'] = '25';
  /* Contextual filter: Inhalt: Jahr (field_jahr) */
  $handler->display->display_options['arguments']['field_jahr_value']['id'] = 'field_jahr_value';
  $handler->display->display_options['arguments']['field_jahr_value']['table'] = 'field_data_field_jahr';
  $handler->display->display_options['arguments']['field_jahr_value']['field'] = 'field_jahr_value';
  $handler->display->display_options['arguments']['field_jahr_value']['default_action'] = 'default';
  $handler->display->display_options['arguments']['field_jahr_value']['exception']['title'] = 'Alle';
  $handler->display->display_options['arguments']['field_jahr_value']['default_argument_type'] = 'query';
  $handler->display->display_options['arguments']['field_jahr_value']['default_argument_options']['parameter'] = 'date';
  $handler->display->display_options['arguments']['field_jahr_value']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['field_jahr_value']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['field_jahr_value']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['field_jahr_value']['break_phrase'] = TRUE;
  /* Contextual filter: Inhalt: Has taxonomy term ID */
  $handler->display->display_options['arguments']['tid']['id'] = 'tid';
  $handler->display->display_options['arguments']['tid']['table'] = 'taxonomy_index';
  $handler->display->display_options['arguments']['tid']['field'] = 'tid';
  $handler->display->display_options['arguments']['tid']['default_action'] = 'default';
  $handler->display->display_options['arguments']['tid']['exception']['title'] = 'Alle';
  $handler->display->display_options['arguments']['tid']['default_argument_type'] = 'query';
  $handler->display->display_options['arguments']['tid']['default_argument_options']['parameter'] = 'kategorie_id';
  $handler->display->display_options['arguments']['tid']['default_argument_options']['default_value'] = 'all';
  $handler->display->display_options['arguments']['tid']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['tid']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['tid']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['tid']['break_phrase'] = TRUE;
  /* Contextual filter: Inhalt: Author uid */
  $handler->display->display_options['arguments']['uid']['id'] = 'uid';
  $handler->display->display_options['arguments']['uid']['table'] = 'node';
  $handler->display->display_options['arguments']['uid']['field'] = 'uid';
  $handler->display->display_options['arguments']['uid']['default_action'] = 'default';
  $handler->display->display_options['arguments']['uid']['exception']['title'] = 'Alle';
  $handler->display->display_options['arguments']['uid']['default_argument_type'] = 'query';
  $handler->display->display_options['arguments']['uid']['default_argument_options']['parameter'] = 'autor_uid';
  $handler->display->display_options['arguments']['uid']['default_argument_options']['default_value'] = 'all';
  $handler->display->display_options['arguments']['uid']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['uid']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['uid']['summary_options']['items_per_page'] = '25';
  $handler->display->display_options['arguments']['uid']['break_phrase'] = TRUE;
  /* Contextual filter: Flags: User uid */
  $handler->display->display_options['arguments']['uid_1']['id'] = 'uid_1';
  $handler->display->display_options['arguments']['uid_1']['table'] = 'flagging';
  $handler->display->display_options['arguments']['uid_1']['field'] = 'uid';
  $handler->display->display_options['arguments']['uid_1']['relationship'] = 'flag_content_rel';
  $handler->display->display_options['arguments']['uid_1']['default_action'] = 'default';
  $handler->display->display_options['arguments']['uid_1']['exception']['title'] = 'Alle';
  $handler->display->display_options['arguments']['uid_1']['default_argument_type'] = 'query';
  $handler->display->display_options['arguments']['uid_1']['default_argument_options']['parameter'] = 'suid';
  $handler->display->display_options['arguments']['uid_1']['default_argument_options']['default_value'] = 'all';
  $handler->display->display_options['arguments']['uid_1']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['uid_1']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['uid_1']['summary_options']['items_per_page'] = '25';
  /* Filter criterion: Inhalt: Veröffentlicht */
  $handler->display->display_options['filters']['status']['id'] = 'status';
  $handler->display->display_options['filters']['status']['table'] = 'node';
  $handler->display->display_options['filters']['status']['field'] = 'status';
  $handler->display->display_options['filters']['status']['value'] = 1;
  $handler->display->display_options['filters']['status']['group'] = 1;
  $handler->display->display_options['filters']['status']['expose']['operator'] = FALSE;
  /* Filter criterion: Inhalt: Typ */
  $handler->display->display_options['filters']['type']['id'] = 'type';
  $handler->display->display_options['filters']['type']['table'] = 'node';
  $handler->display->display_options['filters']['type']['field'] = 'type';
  $handler->display->display_options['filters']['type']['value'] = array(
    'ansicht' => 'ansicht',
  );
  /* Filter criterion: Inhalt: Kategorie (field_kategorie) */
  $handler->display->display_options['filters']['field_kategorie_tid']['id'] = 'field_kategorie_tid';
  $handler->display->display_options['filters']['field_kategorie_tid']['table'] = 'field_data_field_kategorie';
  $handler->display->display_options['filters']['field_kategorie_tid']['field'] = 'field_kategorie_tid';
  $handler->display->display_options['filters']['field_kategorie_tid']['exposed'] = TRUE;
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['operator_id'] = 'field_kategorie_tid_op';
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['label'] = 'Kategorie (field_kategorie)';
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['operator'] = 'field_kategorie_tid_op';
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['identifier'] = 'field_kategorie_name';
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['remember_roles'] = array(
    2 => '2',
    1 => 0,
    4 => 0,
    3 => 0,
  );
  $handler->display->display_options['filters']['field_kategorie_tid']['reduce_duplicates'] = TRUE;
  $handler->display->display_options['filters']['field_kategorie_tid']['vocabulary'] = 'ansicht_kategorie';
  $handler->display->display_options['filters']['field_kategorie_tid']['error_message'] = FALSE;
  /* Filter criterion: Inhalt: Author uid */
  $handler->display->display_options['filters']['uid']['id'] = 'uid';
  $handler->display->display_options['filters']['uid']['table'] = 'node';
  $handler->display->display_options['filters']['uid']['field'] = 'uid';
  $handler->display->display_options['filters']['uid']['value'] = '';
  $handler->display->display_options['filters']['uid']['exposed'] = TRUE;
  $handler->display->display_options['filters']['uid']['expose']['operator_id'] = 'uid_op';
  $handler->display->display_options['filters']['uid']['expose']['label'] = 'uid';
  $handler->display->display_options['filters']['uid']['expose']['operator'] = 'uid_op';
  $handler->display->display_options['filters']['uid']['expose']['identifier'] = 'uid';
  $handler->display->display_options['filters']['uid']['expose']['remember_roles'] = array(
    2 => '2',
    1 => 0,
    4 => 0,
    3 => 0,
    5 => 0,
  );

  /* Display: Feed */
  $handler = $view->new_display('feed', 'Feed', 'feed_1');
  $handler->display->display_options['pager']['type'] = 'some';
  $handler->display->display_options['pager']['options']['items_per_page'] = '0';
  $handler->display->display_options['pager']['options']['offset'] = '0';
  $handler->display->display_options['style_plugin'] = 'futurehistory_poi_bbox';
  $handler->display->display_options['style_options']['marker_nid_field'] = 'nid';
  $handler->display->display_options['style_options']['marker_year_field'] = 'field_jahr';
  $handler->display->display_options['style_options']['marker_stadt_field'] = 'field_stadt';
  $handler->display->display_options['style_options']['marker_url_field'] = 'view_node';
  $handler->display->display_options['style_options']['marker_title_field'] = 'title';
  $handler->display->display_options['style_options']['marker_position_field'] = 'field_position_der_aufnahme';
  $handler->display->display_options['style_options']['marker_changed_field'] = 'changed';
  $handler->display->display_options['style_options']['marker_img_main_field'] = 'field_bild';
  $handler->display->display_options['style_options']['marker_img_thumb_field'] = 'field_bild_1';
  $handler->display->display_options['style_options']['marker_img_overlay_field'] = 'field_bild_overlay';
  $handler->display->display_options['style_options']['marker_flagged_field'] = 'flagged';
  $handler->display->display_options['style_options']['marker_kategorie_field'] = 'field_kategorie';
  $handler->display->display_options['style_options']['marker_overlay_year_field'] = 'field_overlay_jahr';
  $handler->display->display_options['style_options']['marker_is_in_tour'] = 'view';
  $handler->display->display_options['defaults']['relationships'] = FALSE;
  /* Relationship: Flags: bookmarks */
  $handler->display->display_options['relationships']['flag_content_rel']['id'] = 'flag_content_rel';
  $handler->display->display_options['relationships']['flag_content_rel']['table'] = 'node';
  $handler->display->display_options['relationships']['flag_content_rel']['field'] = 'flag_content_rel';
  $handler->display->display_options['relationships']['flag_content_rel']['label'] = 'Sammlung';
  $handler->display->display_options['relationships']['flag_content_rel']['required'] = 0;
  $handler->display->display_options['relationships']['flag_content_rel']['flag'] = 'bookmarks';
  $handler->display->display_options['defaults']['fields'] = FALSE;
  /* Feld: Inhalt: Nid */
  $handler->display->display_options['fields']['nid']['id'] = 'nid';
  $handler->display->display_options['fields']['nid']['table'] = 'node';
  $handler->display->display_options['fields']['nid']['field'] = 'nid';
  /* Feld: Inhalt: Titel */
  $handler->display->display_options['fields']['title']['id'] = 'title';
  $handler->display->display_options['fields']['title']['table'] = 'node';
  $handler->display->display_options['fields']['title']['field'] = 'title';
  $handler->display->display_options['fields']['title']['label'] = '';
  $handler->display->display_options['fields']['title']['alter']['word_boundary'] = FALSE;
  $handler->display->display_options['fields']['title']['alter']['ellipsis'] = FALSE;
  /* Feld: Inhalt: Bildposition */
  $handler->display->display_options['fields']['field_position_der_aufnahme']['id'] = 'field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['table'] = 'field_data_field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['field'] = 'field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['click_sort_column'] = 'lat';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['type'] = 'services';
  $handler->display->display_options['fields']['field_position_der_aufnahme']['settings'] = array(
    'data_element_key' => '',
    'skip_safe' => 0,
    'skip_empty_values' => 0,
  );
  /* Feld: Inhalt: Jahr */
  $handler->display->display_options['fields']['field_jahr']['id'] = 'field_jahr';
  $handler->display->display_options['fields']['field_jahr']['table'] = 'field_data_field_jahr';
  $handler->display->display_options['fields']['field_jahr']['field'] = 'field_jahr';
  $handler->display->display_options['fields']['field_jahr']['settings'] = array(
    'thousand_separator' => '',
    'prefix_suffix' => 1,
  );
  /* Feld: Inhalt: Kategorie */
  $handler->display->display_options['fields']['field_kategorie']['id'] = 'field_kategorie';
  $handler->display->display_options['fields']['field_kategorie']['table'] = 'field_data_field_kategorie';
  $handler->display->display_options['fields']['field_kategorie']['field'] = 'field_kategorie';
  $handler->display->display_options['fields']['field_kategorie']['type'] = 'taxonomy_term_reference_plain';
  $handler->display->display_options['fields']['field_kategorie']['delta_offset'] = '0';
  /* Feld: Flags: Flagged */
  $handler->display->display_options['fields']['flagged']['id'] = 'flagged';
  $handler->display->display_options['fields']['flagged']['table'] = 'flagging';
  $handler->display->display_options['fields']['flagged']['field'] = 'flagged';
  $handler->display->display_options['fields']['flagged']['relationship'] = 'flag_content_rel';
  $handler->display->display_options['fields']['flagged']['type'] = 'boolean';
  $handler->display->display_options['fields']['flagged']['not'] = 0;
  /* Feld: Inhalt: Updated date */
  $handler->display->display_options['fields']['changed']['id'] = 'changed';
  $handler->display->display_options['fields']['changed']['table'] = 'node';
  $handler->display->display_options['fields']['changed']['field'] = 'changed';
  $handler->display->display_options['fields']['changed']['date_format'] = 'custom';
  $handler->display->display_options['fields']['changed']['custom_date_format'] = 'U';
  $handler->display->display_options['fields']['changed']['second_date_format'] = 'long';
  $handler->display->display_options['fields']['changed']['timezone'] = 'Europe/Berlin';
  /* Feld: Inhalt: Bild */
  $handler->display->display_options['fields']['field_bild']['id'] = 'field_bild';
  $handler->display->display_options['fields']['field_bild']['table'] = 'field_data_field_bild';
  $handler->display->display_options['fields']['field_bild']['field'] = 'field_bild';
  $handler->display->display_options['fields']['field_bild']['click_sort_column'] = 'fid';
  $handler->display->display_options['fields']['field_bild']['type'] = 'image_url';
  $handler->display->display_options['fields']['field_bild']['settings'] = array(
    'url_type' => '0',
    'image_style' => 'ansicht_bild_portal',
    'image_link' => '',
  );
  /* Feld: Inhalt: Vergleichsbild Datei */
  $handler->display->display_options['fields']['field_bild_overlay']['id'] = 'field_bild_overlay';
  $handler->display->display_options['fields']['field_bild_overlay']['table'] = 'field_data_field_bild_overlay';
  $handler->display->display_options['fields']['field_bild_overlay']['field'] = 'field_bild_overlay';
  $handler->display->display_options['fields']['field_bild_overlay']['click_sort_column'] = 'fid';
  $handler->display->display_options['fields']['field_bild_overlay']['type'] = 'image_url';
  $handler->display->display_options['fields']['field_bild_overlay']['settings'] = array(
    'url_type' => '0',
    'image_style' => 'ansicht_bild_portal',
    'image_link' => '',
  );
  /* Feld: Inhalt: Bild */
  $handler->display->display_options['fields']['field_bild_1']['id'] = 'field_bild_1';
  $handler->display->display_options['fields']['field_bild_1']['table'] = 'field_data_field_bild';
  $handler->display->display_options['fields']['field_bild_1']['field'] = 'field_bild';
  $handler->display->display_options['fields']['field_bild_1']['label'] = 'Bild-thumb';
  $handler->display->display_options['fields']['field_bild_1']['click_sort_column'] = 'fid';
  $handler->display->display_options['fields']['field_bild_1']['type'] = 'image_url';
  $handler->display->display_options['fields']['field_bild_1']['settings'] = array(
    'url_type' => '0',
    'image_style' => 'ansicht_bild_thumb',
    'image_link' => '',
  );
  /* Feld: Inhalt: Bildposition */
  $handler->display->display_options['fields']['field_stadt']['id'] = 'field_stadt';
  $handler->display->display_options['fields']['field_stadt']['table'] = 'field_data_field_stadt';
  $handler->display->display_options['fields']['field_stadt']['field'] = 'field_stadt';
  $handler->display->display_options['fields']['field_stadt']['type'] = 'taxonomy_term_reference_plain';
  /* Feld: Flags: Flag link */
  $handler->display->display_options['fields']['ops']['id'] = 'ops';
  $handler->display->display_options['fields']['ops']['table'] = 'flagging';
  $handler->display->display_options['fields']['ops']['field'] = 'ops';
  $handler->display->display_options['fields']['ops']['relationship'] = 'flag_content_rel';
  $handler->display->display_options['fields']['ops']['link_type'] = 'normal';
  /* Feld: Inhalt: Bildposition */
  $handler->display->display_options['fields']['field_position_der_aufnahme_1']['id'] = 'field_position_der_aufnahme_1';
  $handler->display->display_options['fields']['field_position_der_aufnahme_1']['table'] = 'field_data_field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme_1']['field'] = 'field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme_1']['label'] = 'POI angle';
  $handler->display->display_options['fields']['field_position_der_aufnahme_1']['click_sort_column'] = 'dist';
  $handler->display->display_options['fields']['field_position_der_aufnahme_1']['type'] = 'futurehistory_angle';
  /* Feld: Inhalt: Bildposition */
  $handler->display->display_options['fields']['field_position_der_aufnahme_2']['id'] = 'field_position_der_aufnahme_2';
  $handler->display->display_options['fields']['field_position_der_aufnahme_2']['table'] = 'field_data_field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme_2']['field'] = 'field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme_2']['label'] = 'POI direction';
  $handler->display->display_options['fields']['field_position_der_aufnahme_2']['click_sort_column'] = 'view_direction';
  $handler->display->display_options['fields']['field_position_der_aufnahme_2']['type'] = 'futurehistory_direction';
  /* Feld: Inhalt: Bildposition */
  $handler->display->display_options['fields']['field_position_der_aufnahme_3']['id'] = 'field_position_der_aufnahme_3';
  $handler->display->display_options['fields']['field_position_der_aufnahme_3']['table'] = 'field_data_field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme_3']['field'] = 'field_position_der_aufnahme';
  $handler->display->display_options['fields']['field_position_der_aufnahme_3']['label'] = 'POI distance';
  $handler->display->display_options['fields']['field_position_der_aufnahme_3']['click_sort_column'] = 'lat';
  $handler->display->display_options['fields']['field_position_der_aufnahme_3']['type'] = 'futurehistory_distance';
  /* Feld: Inhalt: Jahr */
  $handler->display->display_options['fields']['field_overlay_jahr']['id'] = 'field_overlay_jahr';
  $handler->display->display_options['fields']['field_overlay_jahr']['table'] = 'field_data_field_overlay_jahr';
  $handler->display->display_options['fields']['field_overlay_jahr']['field'] = 'field_overlay_jahr';
  $handler->display->display_options['fields']['field_overlay_jahr']['label'] = 'Overlay Jahr';
  $handler->display->display_options['fields']['field_overlay_jahr']['settings'] = array(
    'thousand_separator' => '',
    'prefix_suffix' => 1,
  );
  /* Feld: Inhalt: Link */
  $handler->display->display_options['fields']['view_node']['id'] = 'view_node';
  $handler->display->display_options['fields']['view_node']['table'] = 'views_entity_node';
  $handler->display->display_options['fields']['view_node']['field'] = 'view_node';
  /* Feld: Inhalt: Audio Datei */
  $handler->display->display_options['fields']['field_audio_datei']['id'] = 'field_audio_datei';
  $handler->display->display_options['fields']['field_audio_datei']['table'] = 'field_data_field_audio_datei';
  $handler->display->display_options['fields']['field_audio_datei']['field'] = 'field_audio_datei';
  $handler->display->display_options['fields']['field_audio_datei']['element_default_classes'] = FALSE;
  $handler->display->display_options['fields']['field_audio_datei']['empty'] = 'NULL';
  $handler->display->display_options['fields']['field_audio_datei']['empty_zero'] = TRUE;
  $handler->display->display_options['fields']['field_audio_datei']['click_sort_column'] = 'fid';
  $handler->display->display_options['fields']['field_audio_datei']['type'] = 'file_url_plain';
  /* Feld: Global: Ansicht */
  $handler->display->display_options['fields']['view']['id'] = 'view';
  $handler->display->display_options['fields']['view']['table'] = 'views';
  $handler->display->display_options['fields']['view']['field'] = 'view';
  $handler->display->display_options['fields']['view']['label'] = '';
  $handler->display->display_options['fields']['view']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['view']['element_default_classes'] = FALSE;
  $handler->display->display_options['fields']['view']['view'] = 'touren_bereich_ansicht_is_in_tour';
  $handler->display->display_options['fields']['view']['display'] = 'page_1';
  $handler->display->display_options['fields']['view']['arguments'] = '[!nid]';
  /* Feld: Inhalt: Author uid */
  $handler->display->display_options['fields']['uid']['id'] = 'uid';
  $handler->display->display_options['fields']['uid']['table'] = 'node';
  $handler->display->display_options['fields']['uid']['field'] = 'uid';
  $handler->display->display_options['fields']['uid']['label'] = 'uid';
  $handler->display->display_options['fields']['uid']['link_to_user'] = FALSE;
  $handler->display->display_options['defaults']['filter_groups'] = FALSE;
  $handler->display->display_options['defaults']['filters'] = FALSE;
  /* Filter criterion: Inhalt: Veröffentlicht */
  $handler->display->display_options['filters']['status']['id'] = 'status';
  $handler->display->display_options['filters']['status']['table'] = 'node';
  $handler->display->display_options['filters']['status']['field'] = 'status';
  $handler->display->display_options['filters']['status']['value'] = 1;
  $handler->display->display_options['filters']['status']['group'] = 1;
  $handler->display->display_options['filters']['status']['expose']['operator'] = FALSE;
  /* Filter criterion: Inhalt: Typ */
  $handler->display->display_options['filters']['type']['id'] = 'type';
  $handler->display->display_options['filters']['type']['table'] = 'node';
  $handler->display->display_options['filters']['type']['field'] = 'type';
  $handler->display->display_options['filters']['type']['value'] = array(
    'ansicht' => 'ansicht',
  );
  $handler->display->display_options['filters']['type']['group'] = 1;
  /* Filter criterion: Inhalt: Kategorie (field_kategorie) */
  $handler->display->display_options['filters']['field_kategorie_tid']['id'] = 'field_kategorie_tid';
  $handler->display->display_options['filters']['field_kategorie_tid']['table'] = 'field_data_field_kategorie';
  $handler->display->display_options['filters']['field_kategorie_tid']['field'] = 'field_kategorie_tid';
  $handler->display->display_options['filters']['field_kategorie_tid']['group'] = 1;
  $handler->display->display_options['filters']['field_kategorie_tid']['exposed'] = TRUE;
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['operator_id'] = 'field_kategorie_tid_op';
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['label'] = 'Kategorie (field_kategorie)';
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['operator'] = 'field_kategorie_tid_op';
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['identifier'] = 'field_kategorie_name';
  $handler->display->display_options['filters']['field_kategorie_tid']['expose']['remember_roles'] = array(
    2 => '2',
    1 => 0,
    4 => 0,
    3 => 0,
  );
  $handler->display->display_options['filters']['field_kategorie_tid']['reduce_duplicates'] = TRUE;
  $handler->display->display_options['filters']['field_kategorie_tid']['vocabulary'] = 'ansicht_kategorie';
  $handler->display->display_options['filters']['field_kategorie_tid']['error_message'] = FALSE;
  $handler->display->display_options['path'] = 'fh_view/fh_bbox_pois';
  $translatables['fh_view_bbox'] = array(
    t('Master'),
    t('fh_pois'),
    t('more'),
    t('Apply'),
    t('Zurücksetzen'),
    t('Sortierung'),
    t('Asc'),
    t('Desc'),
    t('Bildposition'),
    t('Nid'),
    t('Kategorie'),
    t('Alle'),
    t('Kategorie (field_kategorie)'),
    t('uid'),
    t('Feed'),
    t('Sammlung'),
    t('Jahr'),
    t('Flagged'),
    t('Updated date'),
    t('Bild'),
    t('Vergleichsbild Datei'),
    t('Bild-thumb'),
    t('Flag link'),
    t('POI angle'),
    t('POI direction'),
    t('POI distance'),
    t('Overlay Jahr'),
    t('Link'),
    t('Audio Datei'),
    t('NULL'),
  );
  $export['fh_view_bbox'] = $view;

  $view = new view();
  $view->name = 'flag_bookmarks';
  $view->description = 'A page listing the current user\'s bookmarks at /bookmarks.';
  $view->tag = 'flag';
  $view->base_table = 'node';
  $view->human_name = '';
  $view->core = 0;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Defaults */
  $handler = $view->new_display('default', 'Defaults', 'default');
  $handler->display->display_options['title'] = 'Meine Sammlung';
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['access']['perm'] = 'flag bookmarks';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['exposed_form']['options']['reset_button_label'] = 'Zurücksetzen';
  $handler->display->display_options['exposed_form']['options']['exposed_sorts_label'] = 'Sortierung';
  $handler->display->display_options['exposed_form']['options']['expose_sort_order'] = FALSE;
  $handler->display->display_options['exposed_form']['options']['autosubmit'] = TRUE;
  $handler->display->display_options['pager']['type'] = 'none';
  $handler->display->display_options['style_plugin'] = 'list';
  $handler->display->display_options['row_plugin'] = 'fields';
  /* No results behavior: Global: Text area */
  $handler->display->display_options['empty']['text']['id'] = 'text';
  $handler->display->display_options['empty']['text']['table'] = 'views';
  $handler->display->display_options['empty']['text']['field'] = 'area';
  $handler->display->display_options['empty']['text']['empty'] = TRUE;
  $handler->display->display_options['empty']['text']['content'] = 'Es sind noch keine Bilder zu deiner Sammlung hinzugefügt. <br> Erkunde den <a href="/fh-entdecken-map">entdecken Bereich</a> und füge Bilder zu deiner Sammlung hinzu';
  $handler->display->display_options['empty']['text']['format'] = 'full_html';
  /* Relationship: Flags: bookmarks */
  $handler->display->display_options['relationships']['flag_content_rel']['id'] = 'flag_content_rel';
  $handler->display->display_options['relationships']['flag_content_rel']['table'] = 'node';
  $handler->display->display_options['relationships']['flag_content_rel']['field'] = 'flag_content_rel';
  $handler->display->display_options['relationships']['flag_content_rel']['label'] = 'bookmarks';
  $handler->display->display_options['relationships']['flag_content_rel']['flag'] = 'bookmarks';
  /* Relationship: Inhalt: Autor */
  $handler->display->display_options['relationships']['uid_1']['id'] = 'uid_1';
  $handler->display->display_options['relationships']['uid_1']['table'] = 'node';
  $handler->display->display_options['relationships']['uid_1']['field'] = 'uid';
  /* Feld: Inhalt: Bild */
  $handler->display->display_options['fields']['field_bild']['id'] = 'field_bild';
  $handler->display->display_options['fields']['field_bild']['table'] = 'field_data_field_bild';
  $handler->display->display_options['fields']['field_bild']['field'] = 'field_bild';
  $handler->display->display_options['fields']['field_bild']['label'] = '';
  $handler->display->display_options['fields']['field_bild']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_bild']['click_sort_column'] = 'fid';
  $handler->display->display_options['fields']['field_bild']['settings'] = array(
    'image_style' => 'fh_grid_view',
    'image_link' => '',
  );
  /* Feld: Inhalt: Titel */
  $handler->display->display_options['fields']['title']['id'] = 'title';
  $handler->display->display_options['fields']['title']['table'] = 'node';
  $handler->display->display_options['fields']['title']['field'] = 'title';
  $handler->display->display_options['fields']['title']['label'] = '';
  $handler->display->display_options['fields']['title']['element_label_colon'] = FALSE;
  /* Feld: Inhalt: Jahr */
  $handler->display->display_options['fields']['field_jahr']['id'] = 'field_jahr';
  $handler->display->display_options['fields']['field_jahr']['table'] = 'field_data_field_jahr';
  $handler->display->display_options['fields']['field_jahr']['field'] = 'field_jahr';
  $handler->display->display_options['fields']['field_jahr']['label'] = '';
  $handler->display->display_options['fields']['field_jahr']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_jahr']['settings'] = array(
    'thousand_separator' => '',
    'prefix_suffix' => 1,
  );
  /* Feld: Flags: Flag link */
  $handler->display->display_options['fields']['ops']['id'] = 'ops';
  $handler->display->display_options['fields']['ops']['table'] = 'flagging';
  $handler->display->display_options['fields']['ops']['field'] = 'ops';
  $handler->display->display_options['fields']['ops']['relationship'] = 'flag_content_rel';
  $handler->display->display_options['fields']['ops']['label'] = '';
  $handler->display->display_options['fields']['ops']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['ops']['link_type'] = 'normal';
  /* Feld: Inhalt: Bildposition */
  $handler->display->display_options['fields']['field_stadt']['id'] = 'field_stadt';
  $handler->display->display_options['fields']['field_stadt']['table'] = 'field_data_field_stadt';
  $handler->display->display_options['fields']['field_stadt']['field'] = 'field_stadt';
  $handler->display->display_options['fields']['field_stadt']['label'] = '';
  $handler->display->display_options['fields']['field_stadt']['exclude'] = TRUE;
  $handler->display->display_options['fields']['field_stadt']['element_label_colon'] = FALSE;
  /* Feld: Flags: Flagged time */
  $handler->display->display_options['fields']['timestamp']['id'] = 'timestamp';
  $handler->display->display_options['fields']['timestamp']['table'] = 'flagging';
  $handler->display->display_options['fields']['timestamp']['field'] = 'timestamp';
  $handler->display->display_options['fields']['timestamp']['relationship'] = 'flag_content_rel';
  $handler->display->display_options['fields']['timestamp']['date_format'] = 'long';
  $handler->display->display_options['fields']['timestamp']['second_date_format'] = 'long';
  /* Sort criterion: Flags: Flagged time */
  $handler->display->display_options['sorts']['timestamp']['id'] = 'timestamp';
  $handler->display->display_options['sorts']['timestamp']['table'] = 'flagging';
  $handler->display->display_options['sorts']['timestamp']['field'] = 'timestamp';
  $handler->display->display_options['sorts']['timestamp']['relationship'] = 'flag_content_rel';
  $handler->display->display_options['sorts']['timestamp']['order'] = 'DESC';
  $handler->display->display_options['sorts']['timestamp']['exposed'] = TRUE;
  $handler->display->display_options['sorts']['timestamp']['expose']['label'] = 'Hinzugefügt am';
  /* Sort criterion: Inhalt: Jahr (field_jahr) */
  $handler->display->display_options['sorts']['field_jahr_value']['id'] = 'field_jahr_value';
  $handler->display->display_options['sorts']['field_jahr_value']['table'] = 'field_data_field_jahr';
  $handler->display->display_options['sorts']['field_jahr_value']['field'] = 'field_jahr_value';
  $handler->display->display_options['sorts']['field_jahr_value']['exposed'] = TRUE;
  $handler->display->display_options['sorts']['field_jahr_value']['expose']['label'] = 'Bilddatum';
  /* Sort criterion: Inhalt: Titel */
  $handler->display->display_options['sorts']['title']['id'] = 'title';
  $handler->display->display_options['sorts']['title']['table'] = 'node';
  $handler->display->display_options['sorts']['title']['field'] = 'title';
  $handler->display->display_options['sorts']['title']['exposed'] = TRUE;
  $handler->display->display_options['sorts']['title']['expose']['label'] = 'Bildtitel';
  /* Filter criterion: Inhalt: Veröffentlicht */
  $handler->display->display_options['filters']['status']['id'] = 'status';
  $handler->display->display_options['filters']['status']['table'] = 'node';
  $handler->display->display_options['filters']['status']['field'] = 'status';
  $handler->display->display_options['filters']['status']['value'] = '1';
  $handler->display->display_options['filters']['status']['group'] = '0';
  $handler->display->display_options['filters']['status']['expose']['operator_id'] = '';
  $handler->display->display_options['filters']['status']['expose']['label'] = 'Veröffentlicht';
  $handler->display->display_options['filters']['status']['expose']['operator'] = 'status_op';
  $handler->display->display_options['filters']['status']['expose']['identifier'] = 'status';
  $handler->display->display_options['filters']['status']['expose']['required'] = TRUE;
  /* Filter criterion: Bildposition (field_stadt) (selective) */
  $handler->display->display_options['filters']['field_stadt_tid_selective']['id'] = 'field_stadt_tid_selective';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['table'] = 'field_data_field_stadt';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['field'] = 'field_stadt_tid_selective';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['ui_name'] = 'Bildposition (field_stadt) (selective)';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['exposed'] = TRUE;
  $handler->display->display_options['filters']['field_stadt_tid_selective']['expose']['operator_id'] = '';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['expose']['label'] = 'Ort / Stadt';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['expose']['use_operator'] = TRUE;
  $handler->display->display_options['filters']['field_stadt_tid_selective']['expose']['identifier'] = 'field_stadt_tid_selective';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['expose']['remember_roles'] = array(
    2 => '2',
    1 => 0,
    4 => 0,
    3 => 0,
  );
  $handler->display->display_options['filters']['field_stadt_tid_selective']['selective_display_field'] = 'field_stadt';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['selective_items_limit'] = '100';

  /* Display: Page */
  $handler = $view->new_display('page', 'Page', 'page');
  $handler->display->display_options['path'] = 'user/sammlungen';
  $handler->display->display_options['menu']['type'] = 'normal';
  $handler->display->display_options['menu']['title'] = 'Meine Sammlung';
  $handler->display->display_options['menu']['weight'] = '0';
  $handler->display->display_options['menu']['name'] = 'user-menu';
  $handler->display->display_options['menu']['context'] = 0;
  $handler->display->display_options['menu']['context_only_inline'] = 0;
  $translatables['flag_bookmarks'] = array(
    t('Defaults'),
    t('Meine Sammlung'),
    t('more'),
    t('Apply'),
    t('Zurücksetzen'),
    t('Sortierung'),
    t('Asc'),
    t('Desc'),
    t('Es sind noch keine Bilder zu deiner Sammlung hinzugefügt. <br> Erkunde den <a href="/fh-entdecken-map">entdecken Bereich</a> und füge Bilder zu deiner Sammlung hinzu'),
    t('bookmarks'),
    t('author'),
    t('Flagged time'),
    t('Hinzugefügt am'),
    t('Bilddatum'),
    t('Bildtitel'),
    t('Veröffentlicht'),
    t('Ort / Stadt'),
    t('Page'),
  );
  $export['flag_bookmarks'] = $view;

  $view = new view();
  $view->name = 'meine_ansichten';
  $view->description = '';
  $view->tag = 'default';
  $view->base_table = 'node';
  $view->human_name = 'Meine Ansichten';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['title'] = 'Meine Ansichten';
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'perm';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['exposed_form']['options']['reset_button_label'] = 'Zurücksetzen';
  $handler->display->display_options['exposed_form']['options']['exposed_sorts_label'] = 'Sortierung';
  $handler->display->display_options['exposed_form']['options']['expose_sort_order'] = FALSE;
  $handler->display->display_options['exposed_form']['options']['autosubmit'] = TRUE;
  $handler->display->display_options['pager']['type'] = 'none';
  $handler->display->display_options['pager']['options']['offset'] = '0';
  $handler->display->display_options['style_plugin'] = 'list';
  $handler->display->display_options['row_plugin'] = 'fields';
  /* No results behavior: Global: Text area */
  $handler->display->display_options['empty']['area']['id'] = 'area';
  $handler->display->display_options['empty']['area']['table'] = 'views';
  $handler->display->display_options['empty']['area']['field'] = 'area';
  $handler->display->display_options['empty']['area']['label'] = 'Keine eigenen Bilder';
  $handler->display->display_options['empty']['area']['empty'] = TRUE;
  $handler->display->display_options['empty']['area']['content'] = 'Es sind noch keine eigenen Bilder Vorhanden. <br> Jetzt <a href="/node/add/ansicht">eigene Bilder einstellen</a>.';
  $handler->display->display_options['empty']['area']['format'] = 'full_html';
  /* Relationship: Inhalt: Autor */
  $handler->display->display_options['relationships']['uid']['id'] = 'uid';
  $handler->display->display_options['relationships']['uid']['table'] = 'node';
  $handler->display->display_options['relationships']['uid']['field'] = 'uid';
  $handler->display->display_options['relationships']['uid']['required'] = TRUE;
  /* Feld: Inhalt: Bild */
  $handler->display->display_options['fields']['field_bild']['id'] = 'field_bild';
  $handler->display->display_options['fields']['field_bild']['table'] = 'field_data_field_bild';
  $handler->display->display_options['fields']['field_bild']['field'] = 'field_bild';
  $handler->display->display_options['fields']['field_bild']['label'] = '';
  $handler->display->display_options['fields']['field_bild']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_bild']['click_sort_column'] = 'fid';
  $handler->display->display_options['fields']['field_bild']['settings'] = array(
    'image_style' => 'fh_grid_view',
    'image_link' => 'content',
  );
  /* Feld: Inhalt: Titel */
  $handler->display->display_options['fields']['title']['id'] = 'title';
  $handler->display->display_options['fields']['title']['table'] = 'node';
  $handler->display->display_options['fields']['title']['field'] = 'title';
  $handler->display->display_options['fields']['title']['label'] = '';
  $handler->display->display_options['fields']['title']['alter']['word_boundary'] = FALSE;
  $handler->display->display_options['fields']['title']['alter']['ellipsis'] = FALSE;
  $handler->display->display_options['fields']['title']['element_label_colon'] = FALSE;
  /* Feld: Inhalt: Jahr */
  $handler->display->display_options['fields']['field_jahr']['id'] = 'field_jahr';
  $handler->display->display_options['fields']['field_jahr']['table'] = 'field_data_field_jahr';
  $handler->display->display_options['fields']['field_jahr']['field'] = 'field_jahr';
  $handler->display->display_options['fields']['field_jahr']['label'] = '';
  $handler->display->display_options['fields']['field_jahr']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_jahr']['settings'] = array(
    'thousand_separator' => '',
    'prefix_suffix' => 1,
  );
  /* Feld: Inhalt: Veröffentlicht */
  $handler->display->display_options['fields']['status']['id'] = 'status';
  $handler->display->display_options['fields']['status']['table'] = 'node';
  $handler->display->display_options['fields']['status']['field'] = 'status';
  $handler->display->display_options['fields']['status']['label'] = '';
  $handler->display->display_options['fields']['status']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['status']['type'] = 'custom';
  $handler->display->display_options['fields']['status']['type_custom_true'] = 'Veröffentlicht';
  $handler->display->display_options['fields']['status']['type_custom_false'] = 'Entwurf';
  $handler->display->display_options['fields']['status']['not'] = 0;
  /* Feld: Inhalt: Edit link */
  $handler->display->display_options['fields']['edit_node']['id'] = 'edit_node';
  $handler->display->display_options['fields']['edit_node']['table'] = 'views_entity_node';
  $handler->display->display_options['fields']['edit_node']['field'] = 'edit_node';
  $handler->display->display_options['fields']['edit_node']['label'] = '';
  $handler->display->display_options['fields']['edit_node']['element_label_colon'] = FALSE;
  /* Feld: Inhalt: Delete link */
  $handler->display->display_options['fields']['delete_node']['id'] = 'delete_node';
  $handler->display->display_options['fields']['delete_node']['table'] = 'views_entity_node';
  $handler->display->display_options['fields']['delete_node']['field'] = 'delete_node';
  $handler->display->display_options['fields']['delete_node']['label'] = '';
  $handler->display->display_options['fields']['delete_node']['element_label_colon'] = FALSE;
  /* Feld: Inhalt: Bildposition */
  $handler->display->display_options['fields']['field_stadt']['id'] = 'field_stadt';
  $handler->display->display_options['fields']['field_stadt']['table'] = 'field_data_field_stadt';
  $handler->display->display_options['fields']['field_stadt']['field'] = 'field_stadt';
  $handler->display->display_options['fields']['field_stadt']['label'] = '';
  $handler->display->display_options['fields']['field_stadt']['exclude'] = TRUE;
  $handler->display->display_options['fields']['field_stadt']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_stadt']['type'] = 'taxonomy_term_reference_plain';
  /* Sort criterion: Inhalt: Post date */
  $handler->display->display_options['sorts']['created']['id'] = 'created';
  $handler->display->display_options['sorts']['created']['table'] = 'node';
  $handler->display->display_options['sorts']['created']['field'] = 'created';
  $handler->display->display_options['sorts']['created']['order'] = 'DESC';
  $handler->display->display_options['sorts']['created']['exposed'] = TRUE;
  $handler->display->display_options['sorts']['created']['expose']['label'] = 'Hinzugefügt am';
  /* Sort criterion: Inhalt: Titel */
  $handler->display->display_options['sorts']['title']['id'] = 'title';
  $handler->display->display_options['sorts']['title']['table'] = 'node';
  $handler->display->display_options['sorts']['title']['field'] = 'title';
  $handler->display->display_options['sorts']['title']['exposed'] = TRUE;
  $handler->display->display_options['sorts']['title']['expose']['label'] = 'Bildtitel';
  /* Sort criterion: Inhalt: Jahr (field_jahr) */
  $handler->display->display_options['sorts']['field_jahr_value']['id'] = 'field_jahr_value';
  $handler->display->display_options['sorts']['field_jahr_value']['table'] = 'field_data_field_jahr';
  $handler->display->display_options['sorts']['field_jahr_value']['field'] = 'field_jahr_value';
  $handler->display->display_options['sorts']['field_jahr_value']['exposed'] = TRUE;
  $handler->display->display_options['sorts']['field_jahr_value']['expose']['label'] = 'Bilddatum';
  /* Contextual filter: Benutzer: Uid */
  $handler->display->display_options['arguments']['uid']['id'] = 'uid';
  $handler->display->display_options['arguments']['uid']['table'] = 'users';
  $handler->display->display_options['arguments']['uid']['field'] = 'uid';
  $handler->display->display_options['arguments']['uid']['relationship'] = 'uid';
  $handler->display->display_options['arguments']['uid']['default_action'] = 'default';
  $handler->display->display_options['arguments']['uid']['exception']['title'] = 'Alle';
  $handler->display->display_options['arguments']['uid']['default_argument_type'] = 'current_user';
  $handler->display->display_options['arguments']['uid']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['uid']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['uid']['summary_options']['items_per_page'] = '25';
  /* Filter criterion: Veröffentlicht (selective) */
  $handler->display->display_options['filters']['status_selective']['id'] = 'status_selective';
  $handler->display->display_options['filters']['status_selective']['table'] = 'node';
  $handler->display->display_options['filters']['status_selective']['field'] = 'status_selective';
  $handler->display->display_options['filters']['status_selective']['ui_name'] = 'Veröffentlicht (selective)';
  $handler->display->display_options['filters']['status_selective']['group'] = 1;
  $handler->display->display_options['filters']['status_selective']['exposed'] = TRUE;
  $handler->display->display_options['filters']['status_selective']['expose']['operator_id'] = '';
  $handler->display->display_options['filters']['status_selective']['expose']['label'] = 'Status';
  $handler->display->display_options['filters']['status_selective']['expose']['use_operator'] = TRUE;
  $handler->display->display_options['filters']['status_selective']['expose']['identifier'] = 'status_selective';
  $handler->display->display_options['filters']['status_selective']['expose']['remember_roles'] = array(
    2 => '2',
    1 => 0,
    4 => 0,
    3 => 0,
  );
  $handler->display->display_options['filters']['status_selective']['selective_display_field'] = 'status';
  $handler->display->display_options['filters']['status_selective']['selective_items_limit'] = '100';
  /* Filter criterion: Inhalt: Typ */
  $handler->display->display_options['filters']['type']['id'] = 'type';
  $handler->display->display_options['filters']['type']['table'] = 'node';
  $handler->display->display_options['filters']['type']['field'] = 'type';
  $handler->display->display_options['filters']['type']['value'] = array(
    'ansicht' => 'ansicht',
  );
  $handler->display->display_options['filters']['type']['group'] = 1;
  /* Filter criterion: Bildposition (field_stadt) (selective) */
  $handler->display->display_options['filters']['field_stadt_tid_selective']['id'] = 'field_stadt_tid_selective';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['table'] = 'field_data_field_stadt';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['field'] = 'field_stadt_tid_selective';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['ui_name'] = 'Bildposition (field_stadt) (selective)';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['group'] = 1;
  $handler->display->display_options['filters']['field_stadt_tid_selective']['exposed'] = TRUE;
  $handler->display->display_options['filters']['field_stadt_tid_selective']['expose']['operator_id'] = '';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['expose']['label'] = 'Ort / Stadt';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['expose']['identifier'] = 'field_stadt_tid_selective';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['expose']['remember_roles'] = array(
    2 => '2',
    1 => 0,
    4 => 0,
    3 => 0,
  );
  $handler->display->display_options['filters']['field_stadt_tid_selective']['selective_display_field'] = 'field_stadt';
  $handler->display->display_options['filters']['field_stadt_tid_selective']['selective_items_limit'] = '100';

  /* Display: Seite */
  $handler = $view->new_display('page', 'Seite', 'page_1');
  $handler->display->display_options['path'] = 'user/meine_ansichten';
  $handler->display->display_options['menu']['type'] = 'normal';
  $handler->display->display_options['menu']['title'] = 'Eigene Bilder';
  $handler->display->display_options['menu']['weight'] = '0';
  $handler->display->display_options['menu']['name'] = 'user-menu';
  $handler->display->display_options['menu']['context'] = 0;
  $handler->display->display_options['menu']['context_only_inline'] = 0;
  $translatables['meine_ansichten'] = array(
    t('Master'),
    t('Meine Ansichten'),
    t('more'),
    t('Apply'),
    t('Zurücksetzen'),
    t('Sortierung'),
    t('Asc'),
    t('Desc'),
    t('Keine eigenen Bilder'),
    t('Es sind noch keine eigenen Bilder Vorhanden. <br> Jetzt <a href="/node/add/ansicht">eigene Bilder einstellen</a>.'),
    t('author'),
    t('Veröffentlicht'),
    t('Entwurf'),
    t('Hinzugefügt am'),
    t('Bildtitel'),
    t('Bilddatum'),
    t('Alle'),
    t('Status'),
    t('Ort / Stadt'),
    t('Seite'),
  );
  $export['meine_ansichten'] = $view;

  $view = new view();
  $view->name = 'meine_touren';
  $view->description = 'Auflistung der Touren im Portal';
  $view->tag = 'default';
  $view->base_table = 'flag_lists_flags';
  $view->human_name = 'Touren Bereich: Auflistung der Touren im Portal';
  $view->core = 7;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Master */
  $handler = $view->new_display('default', 'Master', 'default');
  $handler->display->display_options['title'] = 'Meine Touren';
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'none';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['exposed_form']['options']['reset_button_label'] = 'Zurücksetzen';
  $handler->display->display_options['exposed_form']['options']['exposed_sorts_label'] = 'Sortierung';
  $handler->display->display_options['pager']['type'] = 'none';
  $handler->display->display_options['pager']['options']['offset'] = '0';
  $handler->display->display_options['style_plugin'] = 'list';
  $handler->display->display_options['row_plugin'] = 'fields';
  /* Kopfbereich: Global: Text area */
  $handler->display->display_options['header']['area']['id'] = 'area';
  $handler->display->display_options['header']['area']['table'] = 'views';
  $handler->display->display_options['header']['area']['field'] = 'area';
  $handler->display->display_options['header']['area']['content'] = '<h4>Meine Touren</h4>';
  $handler->display->display_options['header']['area']['format'] = 'full_html';
  /* No results behavior: Global: Text area */
  $handler->display->display_options['empty']['area']['id'] = 'area';
  $handler->display->display_options['empty']['area']['table'] = 'views';
  $handler->display->display_options['empty']['area']['field'] = 'area';
  $handler->display->display_options['empty']['area']['empty'] = TRUE;
  $handler->display->display_options['empty']['area']['content'] = '<h4>Meine Touren </h4>
<p>Du hast noch keine Tour erstellt. <br> Erkunde den <a href="/fh-entdecken-map">entdecken Bereich</a>, erstelle eine Tour und füge Bilder zu dieser hinzu.</p>';
  $handler->display->display_options['empty']['area']['format'] = 'full_html';
  /* Feld: Flag lists: fid */
  $handler->display->display_options['fields']['fid']['id'] = 'fid';
  $handler->display->display_options['fields']['fid']['table'] = 'flag_lists_flags';
  $handler->display->display_options['fields']['fid']['field'] = 'fid';
  $handler->display->display_options['fields']['fid']['exclude'] = TRUE;
  $handler->display->display_options['fields']['fid']['link_to_list'] = 0;
  /* Feld: Flag lists: List title */
  $handler->display->display_options['fields']['title']['id'] = 'title';
  $handler->display->display_options['fields']['title']['table'] = 'flag_lists_flags';
  $handler->display->display_options['fields']['title']['field'] = 'title';
  $handler->display->display_options['fields']['title']['label'] = '';
  $handler->display->display_options['fields']['title']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['title']['link_to_list'] = 1;
  /* Feld: Global: Ansicht */
  $handler->display->display_options['fields']['view']['id'] = 'view';
  $handler->display->display_options['fields']['view']['table'] = 'views';
  $handler->display->display_options['fields']['view']['field'] = 'view';
  $handler->display->display_options['fields']['view']['label'] = '';
  $handler->display->display_options['fields']['view']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['view']['hide_empty'] = TRUE;
  $handler->display->display_options['fields']['view']['view'] = 'touren_bereich_subview_f_r_erstes_bild_der_tour';
  $handler->display->display_options['fields']['view']['display'] = 'page_1';
  $handler->display->display_options['fields']['view']['arguments'] = '[!fid]';
  /* Feld: Flag lists: List description */
  $handler->display->display_options['fields']['description']['id'] = 'description';
  $handler->display->display_options['fields']['description']['table'] = 'flag_lists_flags';
  $handler->display->display_options['fields']['description']['field'] = 'description';
  $handler->display->display_options['fields']['description']['label'] = '';
  $handler->display->display_options['fields']['description']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['description']['link_to_list'] = 0;
  /* Feld: Flag lists: Tour distance in KM */
  $handler->display->display_options['fields']['tour_distance']['id'] = 'tour_distance';
  $handler->display->display_options['fields']['tour_distance']['table'] = 'flag_lists_flags';
  $handler->display->display_options['fields']['tour_distance']['field'] = 'tour_distance';
  $handler->display->display_options['fields']['tour_distance']['label'] = 'Wegstrecke in Metern';
  $handler->display->display_options['fields']['tour_distance']['link_to_list'] = 0;
  /* Feld: Flag lists: Tour start date */
  $handler->display->display_options['fields']['period_start']['id'] = 'period_start';
  $handler->display->display_options['fields']['period_start']['table'] = 'flag_lists_flags';
  $handler->display->display_options['fields']['period_start']['field'] = 'period_start';
  $handler->display->display_options['fields']['period_start']['label'] = 'Anfangsjahr';
  $handler->display->display_options['fields']['period_start']['link_to_list'] = 0;
  /* Feld: Flag lists: Tour end date */
  $handler->display->display_options['fields']['period_end']['id'] = 'period_end';
  $handler->display->display_options['fields']['period_end']['table'] = 'flag_lists_flags';
  $handler->display->display_options['fields']['period_end']['field'] = 'period_end';
  $handler->display->display_options['fields']['period_end']['label'] = 'Endjahr';
  $handler->display->display_options['fields']['period_end']['link_to_list'] = 0;
  /* Feld: Flag lists: Edit link */
  $handler->display->display_options['fields']['edit_list']['id'] = 'edit_list';
  $handler->display->display_options['fields']['edit_list']['table'] = 'flag_lists_flags';
  $handler->display->display_options['fields']['edit_list']['field'] = 'edit_list';
  $handler->display->display_options['fields']['edit_list']['label'] = '';
  $handler->display->display_options['fields']['edit_list']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['edit_list']['text'] = 'Bearbeiten';
  /* Feld: Flag lists: Delete link */
  $handler->display->display_options['fields']['delete_list']['id'] = 'delete_list';
  $handler->display->display_options['fields']['delete_list']['table'] = 'flag_lists_flags';
  $handler->display->display_options['fields']['delete_list']['field'] = 'delete_list';
  $handler->display->display_options['fields']['delete_list']['label'] = '';
  $handler->display->display_options['fields']['delete_list']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['delete_list']['text'] = 'Tour Löschen';
  /* Contextual filter: Benutzer: Uid */
  $handler->display->display_options['arguments']['uid']['id'] = 'uid';
  $handler->display->display_options['arguments']['uid']['table'] = 'users';
  $handler->display->display_options['arguments']['uid']['field'] = 'uid';
  $handler->display->display_options['arguments']['uid']['default_action'] = 'default';
  $handler->display->display_options['arguments']['uid']['exception']['title'] = 'Alle';
  $handler->display->display_options['arguments']['uid']['default_argument_type'] = 'current_user';
  $handler->display->display_options['arguments']['uid']['summary']['number_of_records'] = '0';
  $handler->display->display_options['arguments']['uid']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['uid']['summary_options']['items_per_page'] = '25';

  /* Display: Page */
  $handler = $view->new_display('page', 'Page', 'page');
  $handler->display->display_options['path'] = 'user/touren';
  $handler->display->display_options['menu']['type'] = 'normal';
  $handler->display->display_options['menu']['title'] = 'Touren';
  $handler->display->display_options['menu']['weight'] = '0';
  $handler->display->display_options['menu']['name'] = 'user-menu';
  $handler->display->display_options['menu']['context'] = 0;
  $handler->display->display_options['menu']['context_only_inline'] = 0;
  $translatables['meine_touren'] = array(
    t('Master'),
    t('Meine Touren'),
    t('more'),
    t('Apply'),
    t('Zurücksetzen'),
    t('Sortierung'),
    t('Asc'),
    t('Desc'),
    t('<h4>Meine Touren</h4>'),
    t('<h4>Meine Touren </h4>
<p>Du hast noch keine Tour erstellt. <br> Erkunde den <a href="/fh-entdecken-map">entdecken Bereich</a>, erstelle eine Tour und füge Bilder zu dieser hinzu.</p>'),
    t('fid'),
    t('Wegstrecke in Metern'),
    t('Anfangsjahr'),
    t('Endjahr'),
    t('Bearbeiten'),
    t('Tour Löschen'),
    t('Alle'),
    t('Page'),
  );
  $export['meine_touren'] = $view;

  $view = new view();
  $view->name = 'touren_bereich_subview_f_r_erstes_bild_der_tour';
  $view->description = 'show first image from tour ';
  $view->tag = '';
  $view->base_table = 'node';
  $view->human_name = 'Touren Bereich: Subview für erstes Bild der Tour';
  $view->core = 0;
  $view->api_version = '3.0';
  $view->disabled = FALSE; /* Edit this to true to make a default view disabled initially */

  /* Display: Defaults */
  $handler = $view->new_display('default', 'Defaults', 'default');
  $handler->display->display_options['use_more_always'] = FALSE;
  $handler->display->display_options['access']['type'] = 'none';
  $handler->display->display_options['cache']['type'] = 'none';
  $handler->display->display_options['query']['type'] = 'views_query';
  $handler->display->display_options['exposed_form']['type'] = 'basic';
  $handler->display->display_options['exposed_form']['options']['reset_button_label'] = 'Zurücksetzen';
  $handler->display->display_options['exposed_form']['options']['exposed_sorts_label'] = 'Sortierung';
  $handler->display->display_options['pager']['type'] = 'none';
  $handler->display->display_options['pager']['options']['offset'] = '0';
  $handler->display->display_options['style_plugin'] = 'default';
  $handler->display->display_options['row_plugin'] = 'fields';
  /* Feld: Inhalt: Bild */
  $handler->display->display_options['fields']['field_bild']['id'] = 'field_bild';
  $handler->display->display_options['fields']['field_bild']['table'] = 'field_data_field_bild';
  $handler->display->display_options['fields']['field_bild']['field'] = 'field_bild';
  $handler->display->display_options['fields']['field_bild']['label'] = '';
  $handler->display->display_options['fields']['field_bild']['element_label_colon'] = FALSE;
  $handler->display->display_options['fields']['field_bild']['click_sort_column'] = 'fid';
  $handler->display->display_options['fields']['field_bild']['settings'] = array(
    'image_style' => 'fh_grid_view',
    'image_link' => '',
  );
  /* Sort criterion: Flag lists: Time listed */
  $handler->display->display_options['sorts']['timestamp']['id'] = 'timestamp';
  $handler->display->display_options['sorts']['timestamp']['table'] = 'flag_lists_content';
  $handler->display->display_options['sorts']['timestamp']['field'] = 'timestamp';
  $handler->display->display_options['sorts']['timestamp']['order'] = 'DESC';
  /* Contextual filter: Flag lists: fid */
  $handler->display->display_options['arguments']['fid']['id'] = 'fid';
  $handler->display->display_options['arguments']['fid']['table'] = 'flag_lists_flags';
  $handler->display->display_options['arguments']['fid']['field'] = 'fid';
  $handler->display->display_options['arguments']['fid']['default_action'] = 'not found';
  $handler->display->display_options['arguments']['fid']['exception']['title_enable'] = TRUE;
  $handler->display->display_options['arguments']['fid']['exception']['title'] = 'Alle';
  $handler->display->display_options['arguments']['fid']['title_enable'] = TRUE;
  $handler->display->display_options['arguments']['fid']['title'] = '%1';
  $handler->display->display_options['arguments']['fid']['default_argument_type'] = 'fixed';
  $handler->display->display_options['arguments']['fid']['summary']['format'] = 'default_summary';
  $handler->display->display_options['arguments']['fid']['specify_validation'] = TRUE;
  /* Filter criterion: Inhalt: Veröffentlicht */
  $handler->display->display_options['filters']['status']['id'] = 'status';
  $handler->display->display_options['filters']['status']['table'] = 'node';
  $handler->display->display_options['filters']['status']['field'] = 'status';
  $handler->display->display_options['filters']['status']['value'] = '1';
  $handler->display->display_options['filters']['status']['group'] = '0';
  $handler->display->display_options['filters']['status']['expose']['operator'] = FALSE;

  /* Display: Page */
  $handler = $view->new_display('page', 'Page', 'page_1');
  $handler->display->display_options['path'] = 'tour_picture';
  $translatables['touren_bereich_subview_f_r_erstes_bild_der_tour'] = array(
    t('Defaults'),
    t('more'),
    t('Apply'),
    t('Zurücksetzen'),
    t('Sortierung'),
    t('Asc'),
    t('Desc'),
    t('Alle'),
    t('%1'),
    t('Page'),
  );
  $export['touren_bereich_subview_f_r_erstes_bild_der_tour'] = $view;

  return $export;
}

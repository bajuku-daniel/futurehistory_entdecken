<?php

/**
 * Implementation of hook_views_plugins().
 */
function futurehistory_entdecken_views_plugins() {
  return array(
    'module' => 'futurehistory_entdecken',
    'style' => array(
      'futurehistory_poi_bbox' => array(
        'title' => t('Futurehistory Pois BBox REQUEST JSON'),
        'handler' => 'futurehistory_entdecken_poi_bbox',
        'type' => 'feed',
        'uses row plugin' => FALSE,
        'uses fields' => TRUE,
        'uses options' => TRUE,
        'uses grouping' => FALSE,
        'even empty' => TRUE,
      ),
      'google_map' => array(
        'title' => t('Google Map (Futurehistory Entdecken)'),
        'handler' => 'futurehistory_entdecken_plugin_style_google_map',
        'theme' => 'futurehistory_entdecken_map',
        'type' => 'normal',
        'uses row plugin' => TRUE,
        'uses fields' => TRUE,
        'uses options' => TRUE,
        'uses grouping' => FALSE,
        'even empty' => TRUE,
      ),
    ),
    'argument default' => array(
      'querystring' => array(
        'title' => t('FutureHistory Bounding box from query string'),
        'handler' => 'views_plugin_argument_default_bboxquery',
      ),
    ),
  );
}

/**
 * Implements hook_views_handlers().
 *
 * Adds bounding box contextual filter.
 */
function futurehistory_entdecken_views_handlers() {
  return array(
    'info' => array(
      'path' => drupal_get_path('module', 'futurehistory_entdecken'),
    ),
    'handlers' => array(
      'futurehistory_entdecken_poi_bbox_argument' => array(
        'parent' => 'views_handler_argument',
      ),
    ),
  );
}

/**
 * Implements hook_views_data().
 *
 * Adds bounding box contextual filter.
 */
function  futurehistory_entdecken_views_data() {
  $data = array();

  $data['views']['bbox_argument'] = array(
    'group' => t('Custom'),
    'real field' => 'bbox_argument',
    'title' => t('Futurehistory Bounding box'),
    'help' => t('Filter locations within a bounding box.'),
    'argument' => array(
      'handler' => 'futurehistory_entdecken_poi_bbox_argument',
    ),
  );

  return $data;
}

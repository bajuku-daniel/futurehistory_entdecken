


<div id="row-entdecken" class="row">
  <div id="entdecken-map" class="col-md-10 col-xs-8 col-sm-8">
    <div <?php echo $attributes; ?>>Map</div>
  </div><!-- end entdecken-map -->
  <div id="entdecken-map-nav" class="col-md-2 col-sm-4 col-xs-4">

    <div id="thumbnail-navigation">
      <div id="thumbnail-navigation-filter-button">
        <span><?php print t('Filter'); ?></span>
      </div>
      <div id="thumbnail-navigation-sort-button" class="dist">
        <span><?php print t('Sortieren'); ?></span>
      </div>
    </div>

    <div id="thumbnail-filter-box">





      <div id="fh-reset-filter">
        <div class="fh-reset-filter-count"></div>
        <a class="reset-filter-link" id="reset-filter-link"><?php print t('X Filter zurücksetzen'); ?></a>
        <a href="#" class="filter-close"><?php print t('X Schließen'); ?></a>
      </div>

      <div id="sammlungen_selector">
        <form>
          <input type="radio" id="fh_show_only_collections" name="show_collections" data-uid="<?php print $user->uid ?>" /> <label for="fh_show_only_collections"> <?php print t('Nur Sammlung anzeigen'); ?> </label>
          <input type="radio" checked="checked" id="fh_show_all_collections" name="show_collections" /> <label for="fh_show_all_collections"> <?php print t('Alles anzeigen'); ?></label>
        </form>
      </div>

      <div id="time_slider_box">
        <div id="time_slider"></div>
        <div id="time_display">
          <label for="time_range">Zeitraum:</label>
          <input type="text" id="time_range">
        </div>
      </div>

      <div id="accordion" class="accordion">
        <h3><?php print t('Touren'); ?> |
          <span><?php print t('Keine Tour gewählt'); ?></span></h3>
        <div id="tour_selector"></div>

        <h3><?php print t('Kategorien'); ?> |
          <span><?php print t('Keine Kategorie gewählt'); ?></span></h3>
        <div id="kategory_selector"></div>

        <h3><?php print t('Autor'); ?> |
          <span><?php print t('Kein Autor gewählt'); ?></span></h3>
        <div id="author_selector"></div>

        <h3><i class="material-icons search_tags">search</i><?php print t('Suchbegriffe / Tags'); ?> | <span><?php print t('Kein Tags gewählt'); ?></span>
        </h3>
        <div id="tag_selector">

          <div id="tag_list">
            <!--        ansicht_schlagworte-->
<?php
              $vocab = taxonomy_vocabulary_machine_name_load('ansicht_schlagworte');
              $vid = $vocab->vid;
              $results = db_query("SELECT tid, name FROM {taxonomy_term_data} WHERE vid = $vid")->fetchAll();
              $options = array();
              $worker = function ($tags_return) {
                $count_data = futurehistory_count_nodes_with_tid();
                $term_matches = array();
                foreach ($tags_return as $tidR => $nameR) {
                  $name = $nameR->name;
                  $tid = $nameR->tid;
                  // Term names containing commas or quotes must be wrapped in quotes.
                  if (strpos($name, ',') !== FALSE || strpos($name, '"') !== FALSE) {
                    $n = '"' . str_replace('"', '""', $name) . '"';
                  }
                  if (FALSE) {
                    $term_matches[check_plain($name)] = check_plain($name);
                  }
                  else {
                    $term_matches[$tid] = check_plain($name) . ' (' . $count_data[$tid] . ')';
//                    $term_matches[$tid] = check_plain($name);
                  }
                }
                if (TRUE) {
                  uasort($term_matches, function ($a, $b) {
                    $b_count = (substr($b, (strpos($b, '(') + 1), (strpos($b, ')') - strpos($b, '(')) - 1));
                    $a_count = (substr($a, (strpos($a, '(') + 1), (strpos($a, ')') - strpos($a, '(')) - 1));
                    if ($b_count == $a_count) {
                      return strcmp($a, $b);
                    }
                    return $b_count - $a_count;
                  });
                }
                $R=0;
                foreach ($term_matches as $id => $name) {
                  $term_matches[$id] = trim(substr($term_matches[$id],0,strpos($term_matches[$id], '(')));
                }
                $R=0;
                return $term_matches;
              };

              $term_matches = $worker($results);

              print theme('select', array(
                'element' => array('#options' => $term_matches)
              ));
              ?>
          </div>
        </div>


      </div>



    </div>

    <div id="thumbnail-sort-box">
      <div id="sort_selector">
        <form>
          <div class="sort-box"><input type="radio" checked="checked" id="fh_sort_dist" name="fh_sort" /> <label for="fh_sort_dist"> <?php print t('Entfernung'); ?> </label></div><br>
          <div class="sort-box"><input type="radio" id="fh_sort_year" name="fh_sort" /> <label for="fh_sort_year"> <?php print t('Zeit'); ?></label></div>
        </form>
      </div>
      <div class="sort-close"><a href="#"><?php print t('SCHLIEßEN'); ?></a></div>

    </div>
    <div id="thumbnail-pois">
    </div>

    <!-- Modal -->
    <div class="modal fade" id="add-to-modal" role="dialog">
      <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title">Bild hinzufügen / entfernen</h4>
          </div>

          <div class="modal-add-body">
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Schließen</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div class="modal fade" id="login-modal" role="dialog">
      <div class="modal-dialog">
        <!-- Modal content-->
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal">&times;</button>
            <h4 class="modal-title">Lieber Besucher</h4>
          </div>
          <div class="modal-body">
            <?php $destination = drupal_get_destination();?>
            <p>Zum Anlegen einer Bildersammlung oder einer Tour bitte <a href="/user/login?destination=<?php print $destination['destination']; ?>">ANMELDEN</a> oder <a href="/user/register?destination=<?php print $destination['destination']; ?>">REGISTRIEREN</a></p>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-default" data-dismiss="modal">Schließen</button>
          </div>
        </div>
      </div>
    </div>

  </div><!-- end entdecken-map-nav -->
</div><!-- end row-entdecken -->

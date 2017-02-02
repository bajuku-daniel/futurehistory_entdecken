


<div id="row-entdecken" class="row">
  <div id="entdecken-map" class="col-md-10 col-xs-8 col-sm-8">
    <div <?php echo $attributes; ?>>Map</div>
  </div><!-- end entdecken-map -->
  <div id="entdecken-map-nav" class="col-md-2 col-sm-4 col-xs-4">

    <div id="thumbnail-navigation">
      <div id="thumbnail-navigation-filter-button">
        <span><?php print t('Filter'); ?></span>
      </div>
      <div id="thumbnail-navigation-sort-button">
        <span><?php print t('Sortieren'); ?></span>
      </div>
    </div>

    <div id="thumbnail-filter-box">

      <div id="fh-reset-filter">
        <a class="reset-filter-link" id="reset-filter-link"><?php print t('X Filter zurücksetzen'); ?></a>
      </div>

      <div id="sammlungen_selector">
        <form>
          <input type="radio" id="fh_show_only_collections" name="show_collections" /> <label for="fh_show_only_collections"> <?php print t('Nur Sammlungen anzeigen'); ?> </label><br>
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
          <span><?php print t('Keine kategorie gewählt'); ?></span></h3>
        <div id="kategory_selector"></div>

        <h3><?php print t('Autor'); ?> |
          <span><?php print t('Kein Autor gewählt'); ?></span></h3>
        <div id="author_selector"></div>
      </div>



      <div class="filter-close"><a href="#"><?php print t('SCHLIEßEN'); ?></a></div>
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
  </div><!-- end entdecken-map-nav -->
</div><!-- end row-entdecken -->

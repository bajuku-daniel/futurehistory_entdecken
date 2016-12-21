


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

      <div id="kategory_selector">
        <form>
          <fieldset>
            <label>
              <input type="checkbox" id="erinnern" name="kategorie" value="erinnern" checked="checked">
              <?php print t('Erinnern') ?>
            </label><br>
            <label>
              <input type="checkbox" id="stadtbild" name="kategorie" value="stadtbild" checked="checked">
              <?php print t('Stadtbild') ?>
            </label><br>
            <label>
              <input type="checkbox" id="tourismus" name="kategorie" value="tourismus" checked="checked">
              <?php print t('Tourismus') ?>
            </label><br>
          </fieldset>
        </form>
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

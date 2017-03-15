#!/usr/bin/env bash

git pull origin dev_rh

#mkdir -p ../../../../../db_backup
#drush sql-dump > ../../../../../db_backup/$(date +"%Y-%m-%d__%H-%M-%S".sql)
#drush sql-dump > ../db_backup/$(date +"%Y-%m-%d__%H-%M-%S".sql)
#drush sql-drop -y
#drush sql-cli < 2017-02-01__15-05-29.sql

drush cc all

drush en -y map_view_update
drush fr -y map_view_update



cd ../../themes/future_history/ && git pull origin master && cd -
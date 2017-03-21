#!/usr/bin/env bash

git pull origin dev

#mkdir -p ../../../../../db_backup
drush sql-dump > ../../../../../db_backup/$(date +"%Y-%m-%d__%H-%M-%S".sql)
#drush sql-dump > ../db_backup/$(date +"%Y-%m-%d__%H-%M-%S".sql)
drush sql-drop -y
drush sql-cli < 2017-03-15__15-19-01.sql

drush cc all

drush en -y map_view_update
drush fr -y map_view_update



cd ../../themes/future_history/ && git pull origin dev && cd -
cd ../futurehistory/ && git pull origin dev_rh && cd -

drush cc all
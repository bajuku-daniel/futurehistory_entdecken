#!/usr/bin/env bash

git pull origin master

#mkdir -p ../../../../../db_backup
drush sql-dump > ../../../../../db_backup/$(date +"%Y-%m-%d__%H-%M-%S".sql)
#drush sql-dump > ../db_backup/$(date +"%Y-%m-%d__%H-%M-%S".sql)
#drush sql-drop -y
#drush sql-cli < 2017-03-15__15-19-01.sql

drush cc all

drush en -y map_view_update
drush fr -y map_view_update



cd ../../themes/future_history/ && git pull origin master && cd -
cd ../futurehistory/ && git pull origin master && cd -

drush cc all


#drush user-password Romalu3 --password="test"
#drush user-create rafael --mail="rafael.hiss@gmail.com" --password="rafael_fuhi_2016"
#drush user-create test --mail="test@test.com" --password="test"
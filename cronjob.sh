#!/bin/bash

set -x

cd ../covid-19-data &&
git pull origin &&
cd ../covid-report-generator &&
mv ./data/us-counties-old.csv ./data/us-counties-temp.csv &&
mv ./data/us-counties.csv ./data/us-counties-old.csv &&
cp ../covid-19-data/us-counties.csv ./data/us-counties.csv &&
rm -f ./data/us-counties-temp.csv &&
mv ./data/us-states-old.csv ./data/us-states-temp.csv &&
mv ./data/us-states.csv ./data/us-states-old.csv &&
cp ../covid-19-data/us-states.csv ./data/us-states.csv &&
rm -f ./data/us-states-temp.csv &&
node ./src/main.js
#!/bin/bash

set -x

cd ../covid-19-data &&
git pull origin &&
cd ../covid-report-generator &&
mv ./data/us-counties-old.csv ./data/us-counties-temp.csv &&
mv ./data/us-counties.csv ./data/us-counties-old.csv &&
cp ../covid-19-data/us-counties.csv ./data/us-counties.csv &&
rm -f ./data/us-counties-temp.csv &&
node ./src/main.js
npm install
rm -rf covid-report-generator.zip
zip -r covid-report-generator.zip *
aws lambda update-function-code --function-name CovidDataGenerator --zip-file fileb://covid-report-generator.zip
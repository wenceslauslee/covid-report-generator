const countyReader = require('./reader/county-reader');
const covidCountyDb = require('./db/covid-county-db');
const covidCountyRawDb = require('./db/covid-county-raw-db');
const covidPostalCountyDb = require('./db/covid-postal-county-db');
const pcReader = require('./reader/postal-code-reader');
const processor = require('./processor');
const _ = require('underscore');

async function main() {
  console.log('Starting to parse...');

  const countyToPostalCodes = await pcReader.parse();
  const countyRawDataOld = await countyReader.parse('data/us-counties-old.csv');
  const countyRawDataNew = await countyReader.parse('data/us-counties.csv');

  const updates = [];

  /*
  // Commented out due to not needed normally
  var missedCount = 0;
  _.each(countyToPostalCodes, (val, key) => {
    if (!Object.prototype.hasOwnProperty.call(countyRawDataNew, key)) {
      console.log(key);
      missedCount += 1;
    }
  });
  console.log(`${missedCount} out of ${Object.keys(countyToPostalCodes).length} counties are missing.`);

  const postalCodeEntries = [];
  _.each(countyToPostalCodes, (val, key) => {
    _.each(val, v => {
      postalCodeEntries.push({
        postalCode: v,
        countyStateName: key
      });
    });
  });
  console.log(`Found ${postalCodeEntries.length} supported postal codes`);
  const pseChunks = _.chunk(postalCodeEntries, 25);
  const pseChunkLength = pseChunks.length;
  for (var index in pseChunks) {
    await covidPostalCountyDb.batchWrite(pseChunks[index]);
    console.log(`Completed ${Number(index) + 1} out of ${pseChunkLength} chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  */

  _.each(countyRawDataNew, (val, key) => {
    if (!Object.prototype.hasOwnProperty.call(countyRawDataOld, key)) {
      _.each(val, (valI, keyI) => updates.push(valI));
    } else {
      _.each(val, (valI, keyI) => {
        if (!Object.prototype.hasOwnProperty.call(countyRawDataOld[key], keyI)) {
          updates.push(valI);
        } else {
          const oldVal = countyRawDataOld[key][keyI];
          if (valI.cases !== oldVal.cases || valI.deaths !== oldVal.deaths) {
            updates.push(valI);
          }
        }
      });
    }
  });

  console.log(`Found ${updates.length} updates`);
  const chunks = _.chunk(updates, 25);
  const chunkLength = chunks.length;
  for (var index in chunks) {
    await covidCountyRawDb.batchWrite(chunks[index]);
    console.log(`Completed ${Number(index) + 1} out of ${chunkLength} chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  const reportResults = processor.getMostRecentUpdates(countyRawDataNew);

  console.log(`Found ${reportResults.length} county reports`);
  const reportChunks = _.chunk(reportResults, 25);
  const reportChunkLength = reportChunks.length;
  for (var index in reportChunks) {
    await covidCountyDb.batchWrite(reportChunks[index]);
    console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} report chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

main();

/*
cd ../covid-19-data &&
git pull origin &&
cd ../covid-report-generator &&
mv ./data/us-counties-old.csv ./data/us-counties-temp.csv &&
mv ./data/us-counties.csv ./data/us-counties-old.csv &&
cp ../covid-19-data/us-counties.csv ./data/us-counties.csv &&
rm -f ./data/us-counties-temp.csv &&
node ./src/main.js &&
mv ./data/us-counties-old.csv ./data/us-counties-temp.csv &&
mv ./data/us-counties.csv ./data/us-counties-old.csv &&
cp ../covid-19-data/us-counties.csv ./data/us-counties.csv &&
rm -f ./data/us-counties-temp.csv
*/

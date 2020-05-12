const countyReader = require('./reader/county-reader');
const covidCountyRawDb = require('./db/covid-county-raw-db');
const pcReader = require('./reader/postal-code-reader');
const _ = require('underscore');

async function main() {
  console.log('Starting to parse...');

  // const postalCodes = await pcReader.parse();
  const countyRawDataOld = await countyReader.parse('data/us-counties-old.csv');
  const countyRawDataNew = await countyReader.parse('data/us-counties.csv');

  const updates = [];

  _.each(countyRawDataNew, (val, key) => {
    if (!Object.prototype.hasOwnProperty.call(countyRawDataOld, key)) {
      updates.push(val);
    } else {
      const oldVal = countyRawDataOld[key];
      if (val.cases !== oldVal.cases || val.deaths !== oldVal.deaths) {
        updates.push(val);
      }
    }
  });

  console.log(`Found ${updates.length} updates`);
  const chunks = _.chunk(updates, 25);
  const chunkLength = chunks.length;
  for (var index in chunks) {
    // await covidCountyRawDb.batchWrite(chunks[index]);
    console.log(`Completed ${Number(index) + 1} out of ${chunkLength} chunks.`);
    // await new Promise(resolve => setTimeout(resolve, 500));
  }
}

main();

/*
mv ./data/us-counties-old.csv ./data/us-counties-temp.csv &&
mv ./data/us-counties.csv ./data/us-counties-old.csv &&
cp ../covid-19-data/us-counties.csv ./data/us-counties.csv &&
rm -f ./data/us-counties-temp.csv
*/

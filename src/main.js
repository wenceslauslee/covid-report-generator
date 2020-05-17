const countyReader = require('./reader/county-reader');
const covidCountyDb = require('./db/covid-county-db');
const covidCountyRawDb = require('./db/covid-county-raw-db');
const pcReader = require('./reader/postal-code-reader');
const postalCodeUpdater = require('./postal-code-updater'); // eslint-disable-line no-unused-vars
const processor = require('./processor');
const _ = require('underscore');

async function main() {
  console.log('Starting to parse...');

  const countyToPostalCodes = await pcReader.parse();
  const countyRawDataOld = await countyReader.parse('data/us-counties-old.csv');
  const countyRawDataNew = await countyReader.parse('data/us-counties.csv');

  const updates = [];

  // await postalCodeUpdater.updatePostalCodesInDb(countyToPostalCodes, countyRawDataNew);

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
  console.log(`Found ${updates.length} new raw updates`);

  const chunks = _.chunk(updates, 25);
  const chunkLength = chunks.length;
  for (var index in chunks) {
    await covidCountyRawDb.batchWrite(chunks[index]);
    console.log(`Completed ${Number(index) + 1} out of ${chunkLength} raw update chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  if (updates.length !== 0) {
    const reportResults = processor.getMostRecentUpdates(countyRawDataNew);
    console.log(`Found ${reportResults.length} updated county reports.`);

    processor.printStatusReportOnNewUpdate(countyToPostalCodes, reportResults);

    const reportChunks = _.chunk(reportResults, 25);
    const reportChunkLength = reportChunks.length;
    for (var index in reportChunks) {
      await covidCountyDb.batchWrite(reportChunks[index]);
      console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} county report chunks.`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

main();

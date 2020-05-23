const censusReader = require('./reader/census-reader');
const countyProcessor = require('./county-processor');
const countyReader = require('./reader/county-reader');
const covidCountyDb = require('./db/covid-county-db');
const covidCountyRawDb = require('./db/covid-county-raw-db');
const covidReportWebsiteDb = require('./db/covid-report-website-db');
const covidStateDb = require('./db/covid-state-db');
const covidStateRawDb = require('./db/covid-state-raw-db');
const dataChecker = require('./data-checker');
const pcReader = require('./reader/postal-code-reader');
const postalCodeUpdater = require('./postal-code-updater'); // eslint-disable-line no-unused-vars
const stateProcessor = require('./state-processor');
const stateReader = require('./reader/state-reader');
const _ = require('underscore');

async function main() {
  console.log('Starting to parse...');

  const countyToPostalCodes = await pcReader.parse();
  const countyRawDataOld = await countyReader.parse('data/us-counties-old.csv');
  const countyRawDataNew = await countyReader.parse('data/us-counties.csv');
  const stateRawDataOld = await stateReader.parse('data/us-states-old.csv');
  const stateRawDataNew = await stateReader.parse('data/us-states.csv');
  const censusData = await censusReader.parse();

  // await postalCodeUpdater.updatePostalCodesInDb(countyToPostalCodes, countyRawDataNew);

  var countyUpdates = [];
  _.each(countyRawDataNew, (val, key) => {
    if (!Object.prototype.hasOwnProperty.call(countyRawDataOld, key)) {
      _.each(val, (valI, keyI) => countyUpdates.push(valI));
    } else {
      _.each(val, (valI, keyI) => {
        if (!Object.prototype.hasOwnProperty.call(countyRawDataOld[key], keyI)) {
          countyUpdates.push(valI);
        } else {
          const oldVal = countyRawDataOld[key][keyI];
          if (valI.cases !== oldVal.cases || valI.deaths !== oldVal.deaths) {
            countyUpdates.push(valI);
          }
        }
      });
    }
  });
  countyUpdates = dataChecker.deduplicateArray(countyUpdates, v => v.fips);
  console.log(`Found ${countyUpdates.length} new raw county updates`);

  const countyChunks = _.chunk(countyUpdates, 25);
  for (var index in countyChunks) {
    await covidCountyRawDb.batchWrite(countyChunks[index]);
    console.log(`Completed ${Number(index) + 1} out of ${countyChunks.length} raw county update chunks.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  const stateUpdates = [];
  _.each(stateRawDataNew, (val, key) => {
    if (!Object.prototype.hasOwnProperty.call(stateRawDataOld, key)) {
      _.each(val, (valI, keyI) => stateUpdates.push(valI));
    } else {
      _.each(val, (valI, keyI) => {
        if (!Object.prototype.hasOwnProperty.call(stateRawDataOld[key], keyI)) {
          stateUpdates.push(valI);
        } else {
          const oldVal = stateRawDataOld[key][keyI];
          if (valI.cases !== oldVal.cases || valI.deaths !== oldVal.deaths) {
            stateUpdates.push(valI);
          }
        }
      });
    }
  });
  console.log(`Found ${stateUpdates.length} new raw state updates`);

  const stateChunks = _.chunk(stateUpdates, 25);
  for (var index in stateChunks) {
    await covidStateRawDb.batchWrite(stateChunks[index]);
    console.log(`Completed ${Number(index) + 1} out of ${stateChunks.length} raw update chunks.`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (countyUpdates.length !== 0) {
    const reportResults = countyProcessor.getMostRecentUpdates(countyRawDataNew, censusData.county);
    console.log(`Found ${reportResults.length} updated county reports.`);

    dataChecker.printStatusReportOnNewUpdate(countyToPostalCodes, reportResults, censusData);

    const reportChunks = _.chunk(reportResults, 25);
    const reportChunkLength = reportChunks.length;
    for (var index in reportChunks) {
      await covidCountyDb.batchWrite(reportChunks[index]);
      console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} county report chunks.`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  if (stateUpdates.length !== 0) {
    const reportResults = stateProcessor.getMostRecentUpdates(stateRawDataNew, censusData.state);
    console.log(`Found ${reportResults.length} updated state reports.`);

    const reportChunks = _.chunk(reportResults, 25);
    const reportChunkLength = reportChunks.length;
    for (var index in reportChunks) {
      await covidStateDb.batchWrite(reportChunks[index]);
      console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} state report chunks.`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    covidReportWebsiteDb.batchWrite([
      {
        infoKey: 'stateRanking',
        dataValue: {
          reportDate: reportResults[0].currentDate,
          rankByCases: reportResults
        }
      }
    ]);
  }
}

main();

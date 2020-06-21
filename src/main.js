const censusReader = require('./reader/census-reader');
const countyDataChecker = require('./county-data-checker');
const countyProcessor = require('./county-processor');
const countyReader = require('./reader/county-reader');
const covidCountyDb = require('./db/covid-county-db');
const covidStateDb = require('./db/covid-state-db');
const covidWebsiteRankDb = require('./db/covid-website-rank-db');
const pcReader = require('./reader/postal-code-reader');
const postalCodeUpdater = require('./postal-code-updater'); // eslint-disable-line no-unused-vars
const stateCountyUpdater = require('./state-county-updater');
const stateDataChecker = require('./state-data-checker');
const stateProcessor = require('./state-processor');
const stateReader = require('./reader/state-reader');
const usProcessor = require('./us-processor');
const usReader = require('./reader/us-reader');
const _ = require('underscore');

async function main() {
  console.log('Starting to parse...');

  const countyToPostalCodes = await pcReader.parse();
  const countyRawDataOld = await countyReader.parse('data/us-counties-old.csv');
  const countyRawDataNew = await countyReader.parse('data/us-counties.csv');
  const stateRawDataOld = await stateReader.parse('data/us-states-old.csv');
  const stateRawDataNew = await stateReader.parse('data/us-states.csv');
  const usRawDataOld = await usReader.parse('data/us-old.csv');
  const usRawDataNew = await usReader.parse('data/us.csv');
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
  countyUpdates = countyDataChecker.deduplicateArray(countyUpdates, v => v.fips);
  console.log(`Found ${countyUpdates.length} new raw county updates`);

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

  const usUpdates = [];
  _.each(usRawDataNew, (val, key) => {
    if (!Object.prototype.hasOwnProperty.call(usRawDataOld, key)) {
      usUpdates.push(val);
    } else {
      const oldVal = usRawDataOld[key];
      if (val.cases !== oldVal.cases || val.deaths !== oldVal.deaths) {
        usUpdates.push(val);
      }
    }
  });
  console.log(`Found ${usUpdates.length} new us state updates`);

  if (countyUpdates.length !== 0) {
    var reportResults = countyProcessor.getMostRecentUpdates(countyRawDataNew, censusData.county);
    console.log(`Found ${reportResults.length} updated county reports.`);

    countyDataChecker.printStatusReportOnNewUpdate(countyToPostalCodes, reportResults, censusData);

    const reportChunks = _.chunk(reportResults, 25);
    const reportChunkLength = reportChunks.length;
    for (var index in reportChunks) {
      await covidCountyDb.batchWrite(reportChunks[index]);
      console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} county report chunks.`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    reportResults = countyProcessor.filterNYCUpdates(reportResults);
    const rankReportChunks = _.chunk(reportResults, 50);
    const rankReportChunkLength = rankReportChunks.length;
    for (var index in rankReportChunks) {
      _.each(reportResults, rr => {
        delete rr.dataPoints;
      });
      await covidWebsiteRankDb.batchWrite([
        {
          infoKey: 'countyRanking',
          pageValue: `${index}`,
          dataValue: {
            reportDate: reportResults[0].currentDate,
            totalCount: reportResults.length,
            rankByCases: rankReportChunks[index]
          }
        }
      ]);
      console.log(`Completed ${Number(index) + 1} out of ${rankReportChunkLength} county rank report chunks.`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    await stateCountyUpdater.updateMapping(reportResults);
    console.log('Completed state to county mapping.');
  }

  if (stateUpdates.length !== 0) {
    const reportResults = stateProcessor.getMostRecentUpdates(stateRawDataNew, censusData.state);
    console.log(`Found ${reportResults.length} updated state reports.`);

    stateDataChecker.printStatusReportOnNewUpdate(reportResults);

    const reportChunks = _.chunk(reportResults, 25);
    const reportChunkLength = reportChunks.length;
    for (var index in reportChunks) {
      await covidStateDb.batchWrite(reportChunks[index]);
      console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} state report chunks.`);
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    _.each(reportResults, rr => {
      delete rr.dataPoints;
    });
    await covidWebsiteRankDb.batchWrite([
      {
        infoKey: 'stateRanking',
        pageValue: '0',
        dataValue: {
          reportDate: reportResults[0].currentDate,
          totalCount: reportResults.length,
          rankByCases: reportResults
        }
      }
    ]);
    console.log('Completed state rank report.');
  }

  if (usUpdates.length !== 0) {
    const reportResults = usProcessor.getMostRecentUpdates(usRawDataNew);
    console.log(`Found ${reportResults.length} updated us reports.`);

    await covidStateDb.batchWrite(reportResults);
    console.log('Completed US report chunks.');
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

main();

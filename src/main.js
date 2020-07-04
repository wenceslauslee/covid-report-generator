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
const utils = require('./utils');
const _ = require('underscore');

async function main() {
  console.log('Starting to parse...');

  const countyToPostalCodes = await pcReader.parse();
  const countyRawDataNew = await countyReader.parse(false);
  const countyRawDataLive = await countyReader.parse(true);
  const stateRawDataNew = await stateReader.parse(false);
  const stateRawDataLive = await stateReader.parse(true);
  const usRawDataNew = await usReader.parse(false);
  const usRawDataLive = await usReader.parse(true);
  const censusData = await censusReader.parse();

  utils.mergeResults(countyRawDataNew, countyRawDataLive, 2);
  utils.mergeResults(stateRawDataNew, stateRawDataLive, 2);
  utils.mergeResults(usRawDataNew, usRawDataLive, 1);

  // await postalCodeUpdater.updatePostalCodesInDb(countyToPostalCodes, countyRawDataNew);
  // County updates
  const countyResults = countyProcessor.getMostRecentUpdates(countyRawDataNew, censusData.county);
  var reportResults = countyResults.results;
  var rankingResults = countyResults.resultsByStates;
  console.log(`Found ${reportResults.length} updated county reports.`);
  console.log(`Found ${rankingResults.length} state to county ranking reports.`);

  countyDataChecker.printStatusReportOnNewUpdate(countyToPostalCodes, reportResults, censusData);

  var reportChunks = _.chunk(reportResults, 25);
  var reportChunkLength = reportChunks.length;
  for (var index in reportChunks) {
    await covidCountyDb.batchWrite(reportChunks[index]);
    console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} county report chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  reportResults = countyProcessor.filterNYCUpdates(reportResults);
  var rankReportChunks = _.chunk(reportResults, 50);
  var rankReportChunkLength = rankReportChunks.length;
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
          rankByCases: rankReportChunks[index],
          reportTimestamp: reportResults[0].reportTimestamp
        }
      }
    ]);
    console.log(`Completed ${Number(index) + 1} out of ${rankReportChunkLength} county rank report chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Within state county rankings
  reportChunks = _.chunk(rankingResults, 25);
  reportChunkLength = reportChunks.length;
  for (var index in reportChunks) {
    const modifiedChunks = _.map(reportChunks[index], val => {
      return {
        infoKey: val.state.toLowerCase(),
        pageValue: '1',
        dataValue: {
          reportDate: val.counties[0].currentDate,
          totalCount: val.counties.length,
          rankByCases: val.counties,
          reportTimestamp: val.counties[0].reportTimestamp
        }
      };
    });
    await covidWebsiteRankDb.batchWrite(modifiedChunks);
    console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} state to county ranking chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  await stateCountyUpdater.updateMapping(reportResults);
  console.log('Completed state to county mapping.');

  // State updates
  reportResults = stateProcessor.getMostRecentUpdates(stateRawDataNew, censusData.state);
  console.log(`Found ${reportResults.length} updated state reports.`);

  stateDataChecker.printStatusReportOnNewUpdate(reportResults, censusData);

  reportChunks = _.chunk(reportResults, 25);
  reportChunkLength = reportChunks.length;
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
        rankByCases: reportResults,
        reportTimestamp: reportResults[0].reportTimestamp
      }
    }
  ]);
  console.log('Completed state rank report.');

  // US updates
  reportResults = usProcessor.getMostRecentUpdates(usRawDataNew);
  console.log(`Found ${reportResults.length} updated us reports.`);

  await covidStateDb.batchWrite(reportResults);
  console.log('Completed US report chunks.');
  await new Promise(resolve => setTimeout(resolve, 500));
}

main();

exports.handler = main;

const _ = require('underscore');

function printStatusReportOnNewUpdate(countyToPostalCodes, reportResults, censusData, electionData) {
  var postalCodeCounts = 0;
  var countyStateCounts = 0;
  _.each(countyToPostalCodes, (val, key) => {
    postalCodeCounts += val.length;
    countyStateCounts++;
  });

  console.log(`Found ${postalCodeCounts} postal codes.`);
  console.log(`Found ${countyStateCounts} county state name mappings.`);

  const dateLogs = {};
  const reportSet = new Set();
  var countyStateReportCounts = 0;
  var coveredPostalCodeCounts = 0;
  var uncoveredCensusCounts = 0;
  const uncoveredCensusSet = new Set();
  var uncoveredElectionCounts = 0;
  const uncoveredElectionSet = new Set();
  const ignoredElectionSet = new Set(['69', '72', '78']);
  _.each(reportResults, result => {
    const currentDate = result.currentDate;
    if (Object.prototype.hasOwnProperty.call(dateLogs, currentDate)) {
      dateLogs[currentDate]++;
    } else {
      dateLogs[currentDate] = 1;
    }
    countyStateReportCounts++;

    if (Object.prototype.hasOwnProperty.call(countyToPostalCodes, result.fips)) {
      coveredPostalCodeCounts += countyToPostalCodes[result.fips].length;
    }
    reportSet.add(result.fips);

    if (!Object.prototype.hasOwnProperty.call(censusData.county, result.fips)) {
      uncoveredCensusSet.add(result.fips);
      uncoveredCensusCounts++;
    }

    if (!Object.prototype.hasOwnProperty.call(electionData.county, result.fips)) {
      const s = result.fips.substring(0, 2);
      if (!ignoredElectionSet.has(s)) {
        uncoveredElectionSet.add(result.fips);
        uncoveredElectionCounts++;
      }
    }
  });

  var unreachableCountyStateCounts = 0;
  const unreachableCountyStateSet = new Set();
  _.each(countyToPostalCodes, (val, key) => {
    if (reportSet.has(key)) {
      reportSet.delete(key);
    } else {
      unreachableCountyStateCounts += 1;
      unreachableCountyStateSet.add(key);
    }
  });

  console.log(`Of the ${countyStateReportCounts} county reports, date distribution are as follows.`);
  console.log(dateLogs);
  console.log(`This covers ${coveredPostalCodeCounts} out of ${postalCodeCounts} postal codes.`);
  console.log(`${reportSet.size} out of ${countyStateReportCounts} county reports cannot be reached.`);
  console.log(reportSet);
  console.log(`${unreachableCountyStateCounts} out of ${countyStateCounts} county states have no data associated.`);
  console.log(unreachableCountyStateSet);
  console.log(`${uncoveredCensusCounts} out of ${countyStateReportCounts} county reports have no percentage.`);
  console.log(uncoveredCensusSet);
  console.log(`${uncoveredElectionCounts} out of ${countyStateReportCounts} county reports have no election results.`);
  console.log(uncoveredElectionSet);

  if (uncoveredCensusCounts > 0) {
    throw Error('Some counties do not have population count');
  }
}

function deduplicateArray(results, fun) {
  const set = new Set();
  const newResults = [];

  _.each(results, v => {
    const p = fun(v);
    if (!set.has(p)) {
      newResults.push(v);
      set.add(p);
    }
  });

  return newResults;
}

module.exports = {
  deduplicateArray: deduplicateArray,
  printStatusReportOnNewUpdate: printStatusReportOnNewUpdate
};

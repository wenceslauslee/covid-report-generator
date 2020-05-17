const _ = require('underscore');

function printStatusReportOnNewUpdate(countyToPostalCodes, reportResults, censusData) {
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

    if (!Object.prototype.hasOwnProperty.call(censusData, result.fips)) {
      uncoveredCensusCounts++;
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

  if (uncoveredCensusCounts > 0) {
    throw Error('Some counties do not have population count');
  }
}

module.exports = {
  printStatusReportOnNewUpdate: printStatusReportOnNewUpdate
};

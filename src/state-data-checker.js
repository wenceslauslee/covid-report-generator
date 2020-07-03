const _ = require('underscore');

function printStatusReportOnNewUpdate(reportResults, censusData) {
  var uncoveredCensusCounts = 0;
  var countyStateReportCounts = 0;
  _.each(reportResults, result => {
    if (!Object.prototype.hasOwnProperty.call(censusData.state, result.stateNameFull)) {
      console.log(`State ${result.stateNameFull} does not have census data.`);
      uncoveredCensusCounts++;
    }
    countyStateReportCounts++;
  });

  console.log(`${uncoveredCensusCounts} out of ${countyStateReportCounts} state reports have no percentage.`);

  if (uncoveredCensusCounts > 0) {
    throw Error('Some states do not have population count');
  }
}

module.exports = {
  printStatusReportOnNewUpdate: printStatusReportOnNewUpdate
};

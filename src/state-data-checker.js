function printStatusReportOnNewUpdate(reportResults) {
  var dataPointsLength = reportResults[0].dataPoints.length;
  for (var i = 1; i < reportResults.length; i++) {
    if (reportResults[i].dataPoints.length !== dataPointsLength) {
      throw Error(`${reportResults[i].stateNameFull} data points does not ` +
        `have the correct length (${reportResults[i].dataPoints.length}) of ${dataPointsLength}.`);
    }
  }
}

module.exports = {
  printStatusReportOnNewUpdate: printStatusReportOnNewUpdate
};

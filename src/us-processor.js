const moment = require('moment');
const utils = require('./utils');

function getMostRecentUpdates(usRawDataNew) {
  const today = moment.utc().format('YYYY-MM-DD');
  const pastDays = utils.getPastDays(today, '2020-03-01');

  return [getMostRecentUpdate(usRawDataNew, pastDays)];
}

function getMostRecentUpdate(pastResults, pastDays) {
  const results = utils.getUpToNthRecentUpdate(pastResults, pastDays, 2);

  if (results.length !== 2) {
    console.log('USA did not have past 2 results for today.');
    return null;
  }

  const dataPoints = utils.generateDataPoints(pastResults, pastDays);

  return {
    currentDate: results[0].date,
    pastDate: results[1].date,
    fips: '-----',
    stateNameFull: 'usa',
    stateNameFullProper: '-----',
    detailedInfo: {
      activeChange: Math.max(parseInt(results[0].cases) - parseInt(results[1].cases), 0),
      activeCount: parseInt(results[0].cases),
      liveActiveChange: Math.max(parseInt(pastResults.live.cases) - parseInt(results[0].cases), 0),
      deathChange: Math.max(parseInt(results[0].deaths) - parseInt(results[1].deaths), 0),
      deathCount: parseInt(results[0].deaths),
      liveDeathChange: Math.max(parseInt(pastResults.live.deaths) - parseInt(results[0].deaths), 0)
    },
    dataPoints: dataPoints,
    reportTimestamp: moment.utc().format()
  };
}

module.exports = {
  getMostRecentUpdates: getMostRecentUpdates
};

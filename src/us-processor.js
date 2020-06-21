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

  const dataPoints = generateDataPoints(pastResults, pastDays);

  return {
    currentDate: results[0].date,
    pastDate: results[1].date,
    fips: '-----',
    stateNameFull: 'usa',
    stateNameFullProper: '-----',
    detailedInfo: {
      activeChange: Math.max(parseInt(results[0].cases) - parseInt(results[1].cases), 0),
      activeCount: parseInt(results[0].cases),
      deathChange: Math.max(parseInt(results[0].deaths) - parseInt(results[1].deaths), 0),
      deathCount: parseInt(results[0].deaths)
    },
    dataPoints: dataPoints,
    timestamp: moment.utc().format()
  };
}

function generateDataPoints(pastResults, pastDays) {
  const resultPoints = [];
  var lastDayCount = 0;
  var lastDayDeath = 0;

  for (var i = pastDays.length - 1; i > 0; i--) {
    const epoch = (moment(`${pastDays[i]} 23:59:59`).unix() + 1) * 1000;
    if (Object.prototype.hasOwnProperty.call(pastResults, pastDays[i])) {
      const val = pastResults[pastDays[i]];
      lastDayCount = parseInt(val.cases);
      lastDayDeath = parseInt(val.deaths);
    }
    resultPoints.push([epoch, lastDayCount, lastDayDeath]);
  }

  resultPoints[0].push(0);
  resultPoints[0].push(0);
  for (var i = 1; i < resultPoints.length; i++) {
    resultPoints[i].push(Math.max(resultPoints[i][1] - resultPoints[i - 1][1], 0));
    resultPoints[i].push(Math.max(resultPoints[i][2] - resultPoints[i - 1][2], 0));
  }

  return resultPoints;
}

module.exports = {
  getMostRecentUpdates: getMostRecentUpdates
};

const moment = require('moment');
const removeZeros = require('remove-trailing-zeros');
const usStateCodes = require('us-state-codes');
const utils = require('./utils');
const _ = require('underscore');

function getMostRecentUpdates(stateRawDataNew, censusData) {
  const today = moment.utc().format('YYYY-MM-DD');
  const pastDays = utils.getPastDays(today, '2020-03-01');
  const rankings = rankStates(stateRawDataNew, pastDays);
  const results = [];

  _.each(stateRawDataNew, (val, key) => {
    const result = getMostRecentUpdate(key, val, pastDays, rankings, censusData);
    if (result !== null) {
      results.push(result);
    }
  });

  return results;
}

function getMostRecentUpdate(stateNameFull, pastResults, pastDays, rankings, censusData) {
  const results = utils.getUpToNthRecentUpdate(pastResults, pastDays, 2);

  if (results.length !== 2) {
    console.log(`${stateNameFull} did not have past 2 results for today.`);
    return null;
  }

  var stateNameFullProper = usStateCodes.sanitizeStateName(stateNameFull);
  if (stateNameFullProper === null) {
    stateNameFullProper = '-----';
  }

  const dataPoints = generateDataPoints(pastResults, pastDays);

  return {
    currentDate: results[0].date,
    pastDate: results[1].date,
    fips: results[0].fips,
    stateNameFull: stateNameFull,
    stateNameFullProper: stateNameFullProper,
    detailedInfo: {
      activeChange: Math.max(parseInt(results[0].cases) - parseInt(results[1].cases), 0),
      activeCount: parseInt(results[0].cases),
      activeRank: rankings.caseRankings[stateNameFull],
      activeRankPast: rankings.caseRankingsPast[stateNameFull],
      deathChange: Math.max(parseInt(results[0].deaths) - parseInt(results[1].deaths), 0),
      deathCount: parseInt(results[0].deaths),
      deathRank: rankings.deathRankings[stateNameFull],
      deathRankPast: rankings.deathRankingsPast[stateNameFull],
      activePercentage: removeZeros((parseInt(results[0].cases) * 100 / censusData[stateNameFull]).toFixed(2)),
      deathPercentage: removeZeros((parseInt(results[0].deaths) * 100 / censusData[stateNameFull]).toFixed(2))
    },
    dataPoints: dataPoints,
    reportTimestamp: moment.utc().format()
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

function rankStates(stateRawDataNew, pastDays) {
  const caseRankings = {};
  const deathRankings = {};
  const caseRankingsPast = {};
  const deathRankingsPast = {};

  const array = [];
  const arrayPast = [];

  _.each(stateRawDataNew, (val, key) => {
    const results = utils.getUpToNthRecentUpdate(val, pastDays, 2);
    if (results.length === 2) {
      results[0].key = key;
      array.push(results[0]);
      results[1].key = key;
      arrayPast.push(results[1]);
    }
  });

  const sortByCases = _.sortBy(array, x => parseInt(x.cases));
  for (var i = sortByCases.length - 1; i >= 0; i--) {
    caseRankings[sortByCases[i].key] = sortByCases.length - i;
  }

  const sortByDeaths = _.sortBy(array, x => parseInt(x.deaths));
  for (var j = sortByDeaths.length - 1; j >= 0; j--) {
    deathRankings[sortByDeaths[j].key] = sortByDeaths.length - j;
  }

  const sortByCasesPast = _.sortBy(arrayPast, x => parseInt(x.cases));
  for (var i = sortByCasesPast.length - 1; i >= 0; i--) {
    caseRankingsPast[sortByCasesPast[i].key] = sortByCasesPast.length - i;
  }

  const sortByDeathsPast = _.sortBy(arrayPast, x => parseInt(x.deaths));
  for (var j = sortByDeathsPast.length - 1; j >= 0; j--) {
    deathRankingsPast[sortByDeathsPast[j].key] = sortByDeathsPast.length - j;
  }

  return {
    caseRankings: caseRankings,
    deathRankings: deathRankings,
    caseRankingsPast: caseRankingsPast,
    deathRankingsPast: deathRankingsPast
  };
}

module.exports = {
  getMostRecentUpdates: getMostRecentUpdates
};

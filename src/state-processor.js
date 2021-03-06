const moment = require('moment');
const removeZeros = require('remove-trailing-zeros');
const usStateCodes = require('us-state-codes');
const utils = require('./utils');
const _ = require('underscore');

function getMostRecentUpdates(stateRawDataNew, censusData, pastDaysStart) {
  const today = moment.utc().format('YYYY-MM-DD');
  const pastDays = utils.getPastDays(today, pastDaysStart);
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

  const dataPoints = utils.generateDataPoints(pastResults, pastDays);
  const averageActiveChange = dataPoints[dataPoints.length - 1][5];

  return {
    currentDate: results[0].date,
    pastDate: results[1].date,
    fips: results[0].fips,
    stateNameFull: stateNameFull,
    stateNameFullProper: stateNameFullProper,
    detailedInfo: {
      activeChange: Math.max(parseInt(results[0].cases) - parseInt(results[1].cases), 0),
      liveActiveChange: Math.max(parseInt(pastResults.live.cases) - parseInt(results[0].cases), 0),
      activeCount: parseInt(results[0].cases),
      activeRank: rankings.caseRankings[stateNameFull],
      activeRankPast: rankings.caseRankingsPast[stateNameFull],
      deathChange: Math.max(parseInt(results[0].deaths) - parseInt(results[1].deaths), 0),
      liveDeathChange: Math.max(parseInt(pastResults.live.deaths) - parseInt(results[0].deaths), 0),
      deathCount: parseInt(results[0].deaths),
      deathRank: rankings.deathRankings[stateNameFull],
      deathRankPast: rankings.deathRankingsPast[stateNameFull],
      activePercentage: removeZeros((parseInt(results[0].cases) * 100 / censusData[stateNameFull]).toFixed(2)),
      deathPercentage: removeZeros((parseInt(results[0].deaths) * 100 / censusData[stateNameFull]).toFixed(2)),
      rankCount: Object.keys(rankings.caseRankings).length,
      population: censusData[stateNameFull],
      averageActiveChange: averageActiveChange
    },
    dataPoints: dataPoints,
    reportTimestamp: moment.utc().format()
  };
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

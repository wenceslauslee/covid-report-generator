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

  return {
    currentDate: results[0].date,
    pastDate: results[1].date,
    fips: results[0].fips,
    stateNameFull: stateNameFull,
    stateNameFullProper: stateNameFullProper,
    detailedInfo: {
      activeChange: parseInt(results[0].cases) - parseInt(results[1].cases),
      activeCount: parseInt(results[0].cases),
      activeRank: rankings.caseRankings[stateNameFull],
      activeRankPast: rankings.caseRankingsPast[stateNameFull],
      deathChange: parseInt(results[0].deaths) - parseInt(results[1].deaths),
      deathCount: parseInt(results[0].deaths),
      deathRank: rankings.deathRankings[stateNameFull],
      deathRankPast: rankings.deathRankingsPast[stateNameFull],
      activePercentage: removeZeros((parseInt(results[0].cases) * 100 / censusData[stateNameFull]).toFixed(2))
    }
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

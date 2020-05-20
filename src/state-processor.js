const moment = require('moment');
const removeZeros = require('remove-trailing-zeros');
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

  if (results.length === 0) {
    return null;
  }

  if (results.length === 1) {
    return {
      currentDate: results[0].date,
      fips: results[0].fips,
      stateNameFull: stateNameFull,
      detailedInfo: {
        activeCount: parseInt(results[0].cases),
        activeRank: rankings.caseRankings[stateNameFull],
        deathCount: parseInt(results[0].deaths),
        deathRank: rankings.deathRankings[stateNameFull],
        activePercentage: removeZeros((parseInt(results[0].cases) * 100 / censusData[stateNameFull]).toFixed(2))
      }
    };
  }

  return {
    currentDate: results[0].date,
    pastDate: results[1].date,
    fips: results[0].fips,
    stateNameFull: stateNameFull,
    detailedInfo: {
      activeChange: parseInt(results[0].cases) - parseInt(results[1].cases),
      activeCount: parseInt(results[0].cases),
      activeRank: rankings.caseRankings[stateNameFull],
      deathChange: parseInt(results[0].deaths) - parseInt(results[1].deaths),
      deathCount: parseInt(results[0].deaths),
      deathRank: rankings.deathRankings[stateNameFull],
      activePercentage: removeZeros((parseInt(results[0].cases) * 100 / censusData[stateNameFull]).toFixed(2))
    }
  };
}

function rankStates(stateRawDataNew, pastDays) {
  const caseRankings = {};
  const deathRankings = {};

  const array = [];

  _.each(stateRawDataNew, (val, key) => {
    const result = utils.getUpToNthRecentUpdate(val, pastDays, 1);
    if (result.length !== 0) {
      result[0].key = key;
      array.push(result[0]);
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

  return {
    caseRankings: caseRankings,
    deathRankings: deathRankings
  };
}

module.exports = {
  getMostRecentUpdates: getMostRecentUpdates
};

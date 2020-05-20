const moment = require('moment');
const removeZeros = require('remove-trailing-zeros');
const utils = require('./utils');
const _ = require('underscore');

function getMostRecentUpdates(countyRawDataNew, censusData) {
  const today = moment.utc().format('YYYY-MM-DD');
  const pastDays = utils.getPastDays(today, '2020-03-01');
  const rankings = rankCounties(countyRawDataNew, pastDays);
  const results = [];

  _.each(countyRawDataNew, (val, key) => {
    const result = getMostRecentUpdate(key, val, pastDays, rankings, censusData);
    if (result !== null) {
      results.push(result);
    }
  });

  return results;
}

function getMostRecentUpdate(fips, pastResults, pastDays, rankings, censusData) {
  const results = utils.getUpToNthRecentUpdate(pastResults, pastDays, 2);

  if (results.length === 0) {
    return null;
  }

  if (results.length === 1) {
    return {
      currentDate: results[0].date,
      fips: fips,
      countyName: results[0].county,
      stateNameFull: results[0].state,
      detailedInfo: {
        activeCount: parseInt(results[0].cases),
        activeRank: rankings.caseRankings[fips],
        deathCount: parseInt(results[0].deaths),
        deathRank: rankings.deathRankings[fips],
        activePercentage: removeZeros((parseInt(results[0].cases) * 100 / censusData[fips]).toFixed(2))
      }
    };
  }

  return {
    currentDate: results[0].date,
    pastDate: results[1].date,
    fips: fips,
    countyName: results[0].county,
    stateNameFull: results[0].state,
    detailedInfo: {
      activeChange: parseInt(results[0].cases) - parseInt(results[1].cases),
      activeCount: parseInt(results[0].cases),
      activeRank: rankings.caseRankings[fips],
      deathChange: parseInt(results[0].deaths) - parseInt(results[1].deaths),
      deathCount: parseInt(results[0].deaths),
      deathRank: rankings.deathRankings[fips],
      activePercentage: removeZeros((parseInt(results[0].cases) * 100 / censusData[fips]).toFixed(2))
    }
  };
}

function rankCounties(countyRawDataNew, pastDays) {
  const caseRankings = {};
  const deathRankings = {};

  const array = [];

  _.each(countyRawDataNew, (val, key) => {
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

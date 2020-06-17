const moment = require('moment');
const removeZeros = require('remove-trailing-zeros');
const usStateCodes = require('us-state-codes');
const utils = require('./utils');
const _ = require('underscore');

const nycUnique = '36005'; // Keep as unique county fips in NYC

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

  var sortedResults = _.sortBy(results, r => parseInt(r.detailedInfo.activeCount));
  sortedResults.reverse();

  return sortedResults;
}

function getNYCDuplicates() {
  return new Set(['36047', '36061', '36081', '36085']);
}

function filterNYCUpdates(results) {
  const set = getNYCDuplicates();

  return _.filter(results, r => !set.has(r.fips));
}

function getMostRecentUpdate(fips, pastResults, pastDays, rankings, censusData) {
  const results = utils.getUpToNthRecentUpdate(pastResults, pastDays, 2);

  if (results.length !== 2) {
    console.log(`${fips} county did not have past 2 results for today.`);
    return null;
  }

  var stateNameShortProper = usStateCodes.getStateCodeByStateName(results[0].state);
  if (stateNameShortProper === null) {
    stateNameShortProper = '--';
  }

  const dataPoints = generateDataPoints(pastResults, pastDays);

  return {
    currentDate: results[0].date,
    pastDate: results[1].date,
    fips: fips,
    countyName: results[0].county,
    stateNameFull: results[0].state,
    stateNameShortProper: stateNameShortProper,
    detailedInfo: {
      activeChange: parseInt(results[0].cases) - parseInt(results[1].cases),
      activeCount: parseInt(results[0].cases),
      activeRank: rankings.caseRankings[fips],
      activeRankPast: rankings.caseRankingsPast[fips],
      deathChange: parseInt(results[0].deaths) - parseInt(results[1].deaths),
      deathCount: parseInt(results[0].deaths),
      deathRank: rankings.deathRankings[fips],
      deathRankPast: rankings.deathRankingsPast[fips],
      activePercentage: removeZeros((parseInt(results[0].cases) * 100 / censusData[fips]).toFixed(2)),
      deathPercentage: removeZeros((parseInt(results[0].deaths) * 100 / censusData[fips]).toFixed(2))
    },
    dataPoints: dataPoints
  };
}

function generateDataPoints(pastResults, pastDays) {
  const resultPoints = [];
  var lastDayCount = 0;
  var lastDayDeath = 0;

  for (var i = pastDays.length - 1; i >= 0; i--) {
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
    resultPoints[i].push(resultPoints[i][1] - resultPoints[i - 1][1]);
    resultPoints[i].push(resultPoints[i][2] - resultPoints[i - 1][2]);
  }

  return resultPoints;
}

function rankCounties(countyRawDataNew, pastDays) {
  const caseRankings = {};
  const deathRankings = {};
  const caseRankingsPast = {};
  const deathRankingsPast = {};

  const array = [];
  const arrayPast = [];
  const set = getNYCDuplicates();

  _.each(countyRawDataNew, (val, key) => {
    if (set.has(key)) {
      return;
    }

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

  for (var s of set) {
    caseRankings[s] = caseRankings[nycUnique];
    deathRankings[s] = deathRankings[nycUnique];
    caseRankingsPast[s] = caseRankingsPast[nycUnique];
    deathRankingsPast[s] = deathRankingsPast[nycUnique];
  }

  return {
    caseRankings: caseRankings,
    deathRankings: deathRankings,
    caseRankingsPast: caseRankingsPast,
    deathRankingsPast: deathRankingsPast
  };
}

module.exports = {
  filterNYCUpdates: filterNYCUpdates,
  getMostRecentUpdates: getMostRecentUpdates
};

const moment = require('moment');
const states = require('us-state-codes');
const _ = require('underscore');

function getMostRecentUpdates(countyRawDataNew) {
  const today = moment.utc().format('YYYY-MM-DD');
  const pastDays = getPastDays(today, '2020-01-01');
  const results = [];

  _.each(countyRawDataNew, (val, key) => {
    const result = getMostRecentUpdate(key, val, pastDays);
    if (result !== null) {
      results.push(result);
    }
  });

  return results;
}

function getPastDays(start, end) {
  var date = moment(start);
  var dateString = start;

  const days = [dateString];

  while (dateString !== end) {
    date = date.subtract(1, 'days');
    dateString = date.format('YYYY-MM-DD');

    days.push(dateString);
  }

  return days;
}

function getMostRecentUpdate(countyStateName, pastResults, pastDays) {
  const splits = countyStateName.split('|');
  const county = splits[0];
  const stateFull = splits[1];
  const stateShort = states.getStateCodeByStateName(stateFull);

  var count = 0;
  var index = 0;
  var firstResult;
  var firstDate;
  var secondResult;
  var secondDate;

  while (count !== 2 && index < pastDays.length) {
    if (Object.prototype.hasOwnProperty.call(pastResults, pastDays[index])) {
      if (firstResult === undefined) {
        firstDate = pastDays[index];
        firstResult = pastResults[pastDays[index]];
      } else {
        secondDate = pastDays[index];
        secondResult = pastResults[pastDays[index]];
      }
      count++;
    }
    index++;
  }

  if (count === 0) {
    return null;
  }

  if (count === 1) {
    return {
      date: firstDate,
      countyStateName: countyStateName,
      stateFull: stateFull,
      stateShort: stateShort,
      detailedInfo: {
        activeCount: firstResult.cases,
        deathCount: firstResult.deaths
      }
    };
  }

  return {
    date: firstDate,
    pastDate: secondDate,
    countyStateName: countyStateName,
    county: county,
    stateFull: stateFull,
    stateShort: stateShort,
    detailedInfo: {
      activeChange: firstResult.cases - secondResult.cases,
      activeCount: firstResult.cases,
      deathChange: firstResult.deaths - secondResult.deaths,
      deathCount: firstResult.deaths
    }
  };
}

module.exports = {
  getMostRecentUpdates: getMostRecentUpdates,
  getPastDays: getPastDays
};

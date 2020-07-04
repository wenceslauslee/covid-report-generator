const moment = require('moment');

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

function getUpToNthRecentUpdate(data, pastDays, rank) {
  var index = 0;
  var currentRank = 0;
  const result = [];

  while (index < pastDays.length && currentRank !== rank) {
    if (Object.prototype.hasOwnProperty.call(data, pastDays[index])) {
      result.push(data[pastDays[index]]);
      currentRank++;
    }
    index++;
  }

  return result;
}

// [0] Time in epoch format
// [1] Case count
// [2] Death count
// [3] Case count increase
// [4] Death count increase
// [5] Case count increase 7 day moving average
// [6] Death count increase 7 day moving average
function generateDataPoints(pastResults, pastDays) {
  const resultPoints = [];
  var lastDayCount = 0;
  var lastDayDeath = 0;
  var nonEmptyIndex = 0;

  while (!Object.prototype.hasOwnProperty.call(pastResults, pastDays[nonEmptyIndex])) {
    nonEmptyIndex++;
  }

  for (var i = pastDays.length - 1; i >= nonEmptyIndex; i--) {
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

  var caseSum = 0;
  var deathSum = 0;
  for (var i = 0; i < resultPoints.length; i++) {
    var caseAverage;
    var deathAverage;

    if (i < 7) {
      caseSum += resultPoints[i][3];
      caseAverage = Math.round(caseSum / (i + 1));
      deathSum += resultPoints[i][4];
      deathAverage = Math.round(deathSum / (i + 1));
    } else {
      caseSum = caseSum + resultPoints[i][3] - resultPoints[i - 7][3];
      caseAverage = Math.round(caseSum / 7);
      deathSum = deathSum + resultPoints[i][4] - resultPoints[i - 7][4];
      deathAverage = Math.round(deathSum / 7);
    }

    resultPoints[i].push(caseAverage);
    resultPoints[i].push(deathAverage);
  }

  return resultPoints;
}

// All results will go into A
function mergeResults(resultsA, resultsB, level) {
  const keys = Object.keys(resultsB);
  for (const key of keys) {
    if (level <= 1) {
      resultsA.live = resultsB[key];
    } else {
      if (!Object.prototype.hasOwnProperty.call(resultsA, key)) {
        continue;
      }
      mergeResults(resultsA[key], resultsB[key], level - 1);
    }
  }
}

module.exports = {
  generateDataPoints: generateDataPoints,
  getPastDays: getPastDays,
  getUpToNthRecentUpdate: getUpToNthRecentUpdate,
  mergeResults: mergeResults
};

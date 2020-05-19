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

module.exports = {
  getPastDays: getPastDays,
  getUpToNthRecentUpdate: getUpToNthRecentUpdate
};

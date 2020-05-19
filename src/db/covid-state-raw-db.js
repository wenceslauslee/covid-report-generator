const db = require('./db-api');

const tableName = 'covid-state-raw';

function batchWrite(items) {
  const params = {
    RequestItems: {}
  };
  const requests = [];

  for (var index in items) {
    const item = items[index];
    requests.push({
      PutRequest: {
        Item: {
          stateNameFull: item.state,
          reportDate: item.date,
          caseCounts: item.cases,
          deathCounts: item.deaths,
          fips: item.fips
        }
      }
    });
  }

  params.RequestItems[tableName] = requests;

  return db.batchWrite(params);
}

module.exports = {
  batchWrite: batchWrite
};

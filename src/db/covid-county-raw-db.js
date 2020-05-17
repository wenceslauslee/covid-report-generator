const db = require('./db-api');

const tableName = 'covid-county-raw';

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
          fips: item.fips,
          countyName: item.county.toLowerCase(),
          stateNameFull: item.state.toLowerCase(),
          reportDate: item.date,
          caseCounts: item.cases,
          deathCounts: item.deaths
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

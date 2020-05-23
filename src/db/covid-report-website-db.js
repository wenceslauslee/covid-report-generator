const db = require('./db-api');

const tableName = 'covid-report-website-db';

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
          infoKey: item.infoKey,
          dataValue: item.dataValue
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

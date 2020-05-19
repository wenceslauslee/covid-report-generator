const db = require('./db-api');

const tableName = 'covid-state';

function batchWrite(items) {
  const params = {
    RequestItems: {}
  };
  const requests = [];

  for (var index in items) {
    const item = items[index];
    requests.push({
      PutRequest: {
        Item: item
      }
    });
  }

  params.RequestItems[tableName] = requests;

  return db.batchWrite(params);
}

module.exports = {
  batchWrite: batchWrite
};

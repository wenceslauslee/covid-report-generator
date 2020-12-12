const db = require('./db-api');

const tableNameBase = 'covid-state';

function batchWrite(items, suffix = '') {
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

  var tableName = tableNameBase;
  if (suffix !== '') {
    tableName = tableName + '-' + suffix;
  }

  params.RequestItems[tableName] = requests;

  return db.batchWrite(params);
}

module.exports = {
  batchWrite: batchWrite
};

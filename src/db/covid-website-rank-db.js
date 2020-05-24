const db = require('./db-api');

const tableName = 'covid-website-rank';

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
          pageValue: item.pageValue,
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

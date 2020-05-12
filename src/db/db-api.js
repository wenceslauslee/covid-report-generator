const AWS = require('aws-sdk');

AWS.config.update({
  region: 'us-east-1'
});

const docClient = new AWS.DynamoDB.DocumentClient();

function create(params) {
  return docClient.put(params).promise()
    .then(() => {
      console.log('DB data creation successful');
    })
    .catch(err => {
      console.log(params);
      console.log(err);
      throw err;
    });
}

function query(params) {
  return docClient.query(params).promise()
    .then(data => {
      console.log('DB data query successful');
      console.log(JSON.stringify(data, null, 2));
      return data.Items;
    })
    .catch(err => {
      console.log(params);
      console.log(err);
      throw err;
    });
}

function retrieve(params) {
  return docClient.get(params).promise()
    .then(data => {
      console.log('DB data retrieval successful');
      console.log(JSON.stringify(data, null, 2));
      return data.Item;
    })
    .catch(err => {
      console.log(params);
      console.log(err);
      throw err;
    });
}

function remove(params) {
  return docClient.delete(params).promise()
    .then(() => {
      console.log('DB data delete successful');
    })
    .catch(err => {
      console.log(params);
      console.log(err);
      throw err;
    });
}

function update(params) {
  return docClient.update(params).promise()
    .then(() => {
      console.log('DB data update successful');
    })
    .catch(err => {
      console.log(params);
      console.log(err);
      throw err;
    });
}

function batchWrite(params) {
  return docClient.batchWrite(params).promise()
    .then(() => {
      console.log('DB data batch write successful');
    })
    .catch(err => {
      console.log(JSON.stringify(params, null, 2));
      console.log(err);
      throw err;
    });
}

module.exports = {
  batchWrite: batchWrite,
  create: create,
  query: query,
  remove: remove,
  retrieve: retrieve,
  update: update
};

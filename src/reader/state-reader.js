const AWS = require('aws-sdk');
const csv = require('csv-parser');

const s3 = new AWS.S3();

function parse() {
  const params = {
    Bucket: 'whlee-covid-data',
    Key: 'us-states.csv'
  };

  return new Promise((resolve, reject) => {
    const results = {};

    s3.getObject(params).createReadStream()
      .pipe(csv())
      .on('data', data => {
        if (data.date.length === 0 || data.state.length === 0 || data.cases.length === 0 || data.deaths.length === 0) {
          console.log(data);
          throw Error('Data is malformed');
        }

        const key = data.state.toLowerCase();
        if (!Object.prototype.hasOwnProperty.call(results, key)) {
          results[key] = {};
        }

        results[key][data.date] = data;
      })
      .on('end', () => {
        console.log(`Completed parsing ${Object.keys(results).length} rows of state data.`);
        resolve(results);
      })
      .on('error', error => {
        console.log(error);
        reject(error);
      });
  });
}

module.exports = {
  parse: parse
};

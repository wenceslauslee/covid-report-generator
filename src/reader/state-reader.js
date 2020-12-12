const AWS = require('aws-sdk');
const csv = require('csv-parser');

const s3 = new AWS.S3();

function parse(live, startDate = '', endDate = '') {
  const key = live ? 'live/us-states.csv' : 'us-states.csv';
  const params = {
    Bucket: 'whlee-covid-data',
    Key: key
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

        if ((startDate !== '' && data.date < startDate) || (endDate !== '' && data.date > endDate)) {
          // Ignore and skip parsing
          return;
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

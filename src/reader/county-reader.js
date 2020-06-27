const AWS = require('aws-sdk');
const csv = require('csv-parser');
const _ = require('underscore');

const s3 = new AWS.S3();

function parse(live) {
  const key = live ? 'live/us-counties.csv' : 'us-counties.csv';
  const params = {
    Bucket: 'whlee-covid-data',
    Key: key
  };
  const customMapping = getCustomMapping();

  return new Promise((resolve, reject) => {
    const results = {};

    s3.getObject(params).createReadStream()
      .pipe(csv())
      .on('data', data => {
        var fips = [];

        if (data.date.length === 0 || data.state.length === 0 || data.county.length === 0) {
          console.log(data);
          throw Error('Data is malformed');
        }

        if (data.cases.length === 0) {
          data.cases = '0';
        }
        if (data.deaths.length === 0) {
          data.deaths = '0';
        }

        if (data.fips.length === 0) {
          if (shouldReject(data)) {
            return;
          }

          const county = data.county;
          const state = data.state;
          const key = `${county}|${state}`;

          if (!Object.prototype.hasOwnProperty.call(customMapping, key)) {
            console.log(key);
            console.log(data);
            return;
            //throw Error('fips mapping is malformed');
          }

          fips = customMapping[key];
        } else {
          fips.push(data.fips);
        }

        _.each(fips, val => {
          if (!Object.prototype.hasOwnProperty.call(results, val)) {
            results[val] = {};
          }

          if (Object.prototype.hasOwnProperty.call(results[val], data.date)) {
            console.log(`${val}|${data.date}`);
            throw Error('Data is duplicated');
          }

          data.fips = val;
          results[val][data.date] = data;
        });
      })
      .on('end', () => {
        console.log(`Completed parsing ${Object.keys(results).length} rows of county data.`);
        resolve(results);
      })
      .on('error', error => {
        console.log(error);
        reject(error);
      });
  });
}

function getCustomMapping() {
  return {
    'New York City|New York': [
      '36005',
      '36047',
      '36061',
      '36081',
      '36085'
    ],
    'Doña Ana|New Mexico': '35013',
    'Anchorage|Alaska': '02020',
    'Petersburg Borough|Alaska': '02195',
    'Lasalle|Louisiana': '22059'
  };
}

// Bad data we know that is wrong and should ignore
function shouldReject(data) {
  return (data.county === 'Unknown' || data.county === 'Kansas City');
}

module.exports = {
  parse: parse
};

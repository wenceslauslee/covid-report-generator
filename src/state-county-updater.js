const covidWebsiteRankDb = require('./db/covid-website-rank-db');
const _ = require('underscore');

async function updateMapping(reportResults) {
  const resultsMap = {};

  _.each(reportResults, val => {
    if (!Object.prototype.hasOwnProperty.call(resultsMap, val.stateNameFull)) {
      resultsMap[val.stateNameFull] = [];
    }

    resultsMap[val.stateNameFull].push({
      name: val.countyName,
      fips: val.fips
    });
  });

  const results = [];
  _.each(resultsMap, (val, key) => {
    results.push({
      state: key,
      counties: _.sortBy(val, x => x.name)
    });
  });

  const sortedResults = _.sortBy(results, x => x.state);

  await covidWebsiteRankDb.batchWrite([
    {
      infoKey: 'stateToCounty',
      pageValue: '0',
      dataValue: {
        mappings: sortedResults
      }
    }
  ]);

  const reportChunks = _.chunk(sortedResults, 25);
  const reportChunkLength = reportChunks.length;
  for (var index in reportChunks) {
    const modifiedChunks = _.map(reportChunks[index], val => {
      return {
        infoKey: val.state.toLowerCase(),
        pageValue: '0',
        dataValue: {
          mappings: val.counties
        }
      };
    });
    await covidWebsiteRankDb.batchWrite(modifiedChunks);
    console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} state to county mapping chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

module.exports = {
  updateMapping: updateMapping
};

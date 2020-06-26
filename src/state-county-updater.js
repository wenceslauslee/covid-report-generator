const covidWebsiteRankDb = require('./db/covid-website-rank-db');
const _ = require('underscore');

async function updateMapping(reportResults) {
  const resultsMap = {};

  _.each(reportResults, val => {
    if (!Object.prototype.hasOwnProperty.call(resultsMap, val.stateNameFull)) {
      resultsMap[val.stateNameFull] = [];
    }

    resultsMap[val.stateNameFull].push(val);
  });

  const mappingResults = [];
  _.each(resultsMap, (val, key) => {
    const countiesCondensed = _.map(val, v => {
      return {
        name: v.countyName,
        fips: v.fips
      };
    });
    mappingResults.push({
      state: key,
      counties: _.sortBy(countiesCondensed, c => c.name)
    });
  });

  const sortedMappingResults = _.sortBy(mappingResults, x => x.state);

  await covidWebsiteRankDb.batchWrite([
    {
      infoKey: 'stateToCounty',
      pageValue: '0',
      dataValue: {
        mappings: sortedMappingResults
      }
    }
  ]);

  var reportChunks = _.chunk(sortedMappingResults, 25);
  var reportChunkLength = reportChunks.length;
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

  const rankingResults = [];
  _.each(resultsMap, (val, key) => {
    var countiesByCount = _.sortBy(val, v => v.detailedInfo.activeCount);
    countiesByCount.reverse();
    rankingResults.push({
      state: key,
      counties: countiesByCount
    });
  });

  reportChunks = _.chunk(rankingResults, 25);
  reportChunkLength = reportChunks.length;
  for (var index in reportChunks) {
    const modifiedChunks = _.map(reportChunks[index], val => {
      return {
        infoKey: val.state.toLowerCase(),
        pageValue: '1',
        dataValue: {
          reportDate: val.counties[0].currentDate,
          totalCount: val.counties.length,
          rankByCases: val.counties,
          reportTimestamp: val.counties[0].reportTimestamp
        }
      };
    });
    await covidWebsiteRankDb.batchWrite(modifiedChunks);
    console.log(`Completed ${Number(index) + 1} out of ${reportChunkLength} state to county ranking chunks.`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

module.exports = {
  updateMapping: updateMapping
};

const pcReader = require('./postal-code-reader');


async function main() {
  console.log('Starting to parse...');

  const postalCodeMap = await pcReader.parse();


}

main();

const R = require('ramda');
const { VALID_RECORD_TYPES, TTL, ENV } = require('../utils/constants');
const { domainService: dc } = require('../utils/domain-service');
const { getDomains: gd } = require('../utils/domain');

const getRecords = R.compose(R.toPairs, R.pick(VALID_RECORD_TYPES));

const toHostList = R.chain(data => {
  const rs = getRecords(data.record);

  return R.chain(([recordType, urls]) =>
    (Array.isArray(urls) ? urls : [urls]).map(url => ({
      HostName: data.name,
      RecordType: recordType,
      Address: url,
      TTL,
    }))
  , rs);
});

const registerDomains = async ({ domainService, getDomains }) => {
  const domains = await getDomains().then(toHostList);
  
  if (domains.length === 0)
    return Promise.reject(new Error('Nothing to register'));

  return domainService.updateHosts(domains);
};

const main = async () => {
  console.log(`Registering domains in ${ENV}...`);
  const result = await registerDomains({ domainService: dc, getDomains: gd });
  console.log(result);
};

if (require.main === module) {
  main().catch(console.error);
} else {
  module.exports = { toHostList, registerDomains };
}


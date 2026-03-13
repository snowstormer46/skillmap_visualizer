import dns from 'dns';

const srvRecord = '_mongodb._tcp.cluster0.kr0pysa.mongodb.net';

dns.resolveSrv(srvRecord, (err, addresses) => {
  if (err) {
    console.error('Error resolving SRV:', err);
    return;
  }
  console.log('SRV Addresses:', JSON.stringify(addresses, null, 2));
  
  // Also check TXT records for options
  dns.resolveTxt('cluster0.kr0pysa.mongodb.net', (err, txtRecords) => {
    if (err) {
      console.error('Error resolving TXT:', err);
    } else {
      console.log('TXT Records:', JSON.stringify(txtRecords, null, 2));
    }
  });
});

import fs from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import { listFiles, fetch } from '../lib';

const reportDir = 'data/openbugbounty/reports';
const payloadPatterns = [
  /(['"]?[^>]*>)*<[^>]+>[^<]*(alert|confirm|prompt)[^<]*<\/[^>]+>/ig,
  /(['"]?[^>]*>)*<[^>]+(alert|confirm|prompt)[^>]+>/ig
];

const getPoC = (report) => {
  const contents = fs.readFileSync(`${reportDir}/${report}`).toString();
  const $ = cheerio.load(contents);
  const poc = $('.url textarea').text();
  return new url.URL(poc);
};
const collectPayload = (pocURL) => {
  const pocCandidates = [ ...pocURL.searchParams.values() ];

  const payloads = [];
  for (let p of pocCandidates) {
    for (let pattern of payloadPatterns) {
      const matches = p.match(pattern);
      if (matches) {
        payloads.push(...matches);
      }
    }
  }
  return payloads;
};

const analyzePoC = async () => {
  let payloadFoundReports = 0;
  let payloadNotFoundReports = 0;
  let errorReports = 0;
  let payloadFrequency = {};

  const files = await listFiles(reportDir);
  const reportFiles = files.filter(f => /^\d+$/.test(f));
  for (let report of reportFiles) {
    console.log(report);
    try {
      const poc = getPoC(report);
      console.log(poc.href);
      const payloads = collectPayload(poc);

      if (payloads.length > 0) {
        if (payloadFrequency[payloads.length] === undefined) {
          payloadFrequency[payloads.length] = 0;
        }
        ++payloadFrequency[payloads.length]
        ++payloadFoundReports;
        console.log(payloads.join('\n'));
      } else {
        ++payloadNotFoundReports;
        console.log('payloads not found...');
      }
    } catch(e) {
      ++errorReports;
      console.log('something wrong');
    }
    console.log('=====');
  }

  console.log(`
# of reports payload found: ${payloadFoundReports}
# of reports payload not found: ${payloadNotFoundReports}
# of error reports: ${errorReports}

payload frequency:
${Object.keys(payloadFrequency).map(k => `${k}: ${payloadFrequency[k]}`).join('\n')}
`);
};
analyzePoC();

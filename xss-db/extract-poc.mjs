import fs from 'fs';
import url from 'url';
import cheerio from 'cheerio';
import { listFiles, fetch } from './lib';

const reportDir = 'data/openbugbounty/reports';
const payloadPatterns = [
  /(['"]?[^>]*>)?<[^>]+>[^<]*(alert|confirm|prompt)[^<]*<\/[^>]+>/ig,
  /(['"]?[^>]*>)?<[^>]+(alert|confirm|prompt)[^>]+>/ig
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

const collectResponses = async () => {
  const files = await listFiles(reportDir);
  const reportFiles = files.filter(f => /^\d+$/.test(f));
  for (let report of reportFiles) {
    console.log('=====');
    console.log(report);
    try {
      const poc = getPoC(report);
      console.log(poc);
      const payloads = collectPayload(poc);
      console.log(payloads.length > 0 ? payloads.join('\n') : 'payloads not found...');
    } catch(e) {
      console.log('something wrong');
    }
    console.log('=====');
  }
};
collectResponses();

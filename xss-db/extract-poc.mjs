import fs from 'fs';
import cheerio from 'cheerio';
import { listFiles, fetch } from './lib';

const reportDir = 'data/openbugbounty/reports';
const responsesDir = 'data/openbugbounty/responses';
const getPoC = (report) => {
  const contents = fs.readFileSync(`${reportDir}/${report}`).toString();
  const $ = cheerio.load(contents);
  return $('.url textarea').text();
};
const collectPayload = async (report) => {
  const responseDir = `${responsesDir}/${report}`;
  const poc = getPoC(report);
  const decodedPoC = decodeURIComponent(poc);
  const pocCandidates = [ poc, decodedPoC ];

  for (let p of pocCandidates) {
    /(['"]?[^>]*>)?<[^>]+>[^<]*(alert|confirm|prompt)[^<]*<\/[^>]+>/.match(poc)
    /['"]?[^>]*>)?<[^>]+(alert|confirm|prompt)[^>]+>/.match(poc)
  }
};

const collectResponses = async () => {
  const files = await listFiles(reportDir);
  const reportFiles = files.filter(f => /^\d+$/.test(f));
  for (let report of reportFiles) {
    await collectPayload(report);
  }
};
collectResponses();

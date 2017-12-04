import fs from 'fs';
import cheerio from 'cheerio';
import { listFiles } from './lib';

const reportDir = 'data/openbugbounty/reports';
const collectResponse = async (report) => {
  const contents = fs.readFileSync(`${reportDir}/${report}`);
  const $ = cheerio.load(contents.toString());
  $('.url').each((i, e) => {
    console.log($(e).html());
  });
};

const collectResponses = async () => {
  const files = await listFiles(reportDir);
  const reportFiles = files.filter(f => /^\d+$/.test(f));
  reportFiles.forEach(async (report) => {
    await collectResponse(report);
  });
};
collectResponses();

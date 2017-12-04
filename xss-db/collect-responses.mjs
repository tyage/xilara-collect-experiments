import fs from 'fs';
import cheerio from 'cheerio';
import { listFiles } from './lib';

const reportDir = 'data/openbugbounty/reports';
const responsesDir = 'data/openbugbounty/responses';
const collectResponse = async (report) => {
  const contents = fs.readFileSync(`${reportDir}/${report}`).toString();
  const $ = cheerio.load(contents);
  const poc = $('.url textarea').text();

  const response = await fetch(poc);
  const responseDir = `${responsesDir}/report`;
  fs.existsSync(responsesDir) || fs.mkdirSync(responseDir);
  fs.writeFileSync(`${responseDir}/poc`, response);
};

const collectResponses = async () => {
  const files = await listFiles(reportDir);
  const reportFiles = files.filter(f => /^\d+$/.test(f));
  reportFiles.forEach(async (report) => {
    await collectResponse(report);
  });
};
collectResponses();

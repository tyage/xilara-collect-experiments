import fs from 'fs';
import cheerio from 'cheerio';
import { listFiles } from './lib';

const reportDir = 'data/openbugbounty/reports';
const responsesDir = 'data/openbugbounty/responses';
const getPoC = (report) => {
  const contents = fs.readFileSync(`${reportDir}/${report}`).toString();
  const $ = cheerio.load(contents);
  return $('.url textarea').text();
};
const savePoCResponse = async (poc, dir) => {
  const file = `${dir}/poc`;
  const response = await fetch(poc);
  fs.existsSync(file) || fs.writeFileSync(file, response);
};
const collectResponse = async (report) => {
  const responseDir = `${responsesDir}/${report}`;
  const poc = getPoC(report);

  fs.existsSync(responseDir) || fs.mkdirSync(responseDir);

  await savePoCResponse(poc, responseDir);
};

const collectResponses = async () => {
  const files = await listFiles(reportDir);
  const reportFiles = files.filter(f => /^\d+$/.test(f));
  reportFiles.forEach(async (report) => {
    await collectResponse(report);
  });
};
collectResponses();

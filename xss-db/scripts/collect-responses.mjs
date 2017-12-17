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
const savePoCResponse = async (poc, dir) => {
  const file = `${dir}/poc`;
  if (fs.existsSync(file)) {
    return;
  }
  try {
    const response = await fetch(poc);
    fs.writeFileSync(file, response);
  } catch (e) {
    console.log(e);
  }
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
  for (let report of reportFiles) {
    await collectResponse(report);
  }
};
collectResponses();

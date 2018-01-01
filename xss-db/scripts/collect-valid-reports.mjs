import chromeLauncher from 'chrome-launcher';
import chrome from 'chrome-remote-interface'
import { listFiles } from '../lib';

const responsesDir = `${process.cwd()}/data/openbugbounty/responses`;

const launchCDP = async (chromeProcess) => {
  return new Promise((resolve, reject) => {
    chrome({
      port: chromeProcess.port
    }, async (client) => {
      resolve(client);
    });
  });
};

const collectValidReports = async () => {
  const chromeProcess = await chromeLauncher.launch({
    //chromeFlags: ['--headless']
  });
  process.on('exit', () => {
    chromeProcess.kill();
  });

  const { Page } = await launchCDP(chromeProcess);
  await Page.enable();

  const files = await listFiles(responsesDir);
  const responseDir = files.filter(f => /^\d+$/.test(f));
  for (let report of responseDir) {
    const pocURL = `file://${responsesDir}/${report}/poc`;
    console.log(pocURL)
    Page.navigate({ url: pocURL });
    break;
  }
};
collectValidReports();

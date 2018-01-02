import chromeLauncher from 'chrome-launcher';
import chrome from 'chrome-remote-interface'
import fs from 'fs';
import { listFiles, sleep } from '../lib';

const responsesDir = 'data/openbugbounty/responses';

const launchCDP = (chromeProcess) => {
  return new Promise((resolve, reject) => {
    chrome({
      port: chromeProcess.port
    }, async (client) => {
      resolve(client);
    });
  });
};

const checkDialogOpening = async (Page, url) => {
  const timeoutAfterLoad = 1000 * 1;
  const timeout = 1000 * 5;
  return new Promise((resolve, reject) => {
    Page.javascriptDialogOpening(() => {
      Page.javascriptDialogOpening(false);
      resolve(true);
    });
    Page.navigate({ url });
    Page.loadEventFired(() => {
      setTimeout(() => {
        resolve(false);
      }, timeoutAfterLoad);
    });
    setTimeout(() => {
      resolve(false);
    }, timeout);
  });
};

const collectValidReports = async () => {
  const files = await listFiles(responsesDir);
  const responseDir = files.filter(f => /^\d+$/.test(f));
  const validReports = [];
  for (let report of responseDir) {
    const chromeProcess = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const { Page } = await launchCDP(chromeProcess);
    await Page.enable();

    const pocFile = `${responsesDir}/${report}/poc`;
    const pocURL = `http://localhost:8080/${pocFile}`;
    console.log(pocURL);

    if (fs.existsSync(pocFile)) {
      const isOpening = await checkDialogOpening(Page, pocURL);
      console.log(report, isOpening);
      if (isOpening) {
        validReports.push(report);
      }
    }

    chromeProcess.kill();
  }

  fs.writeFileSync('data/openbugbounty/valid-reports.json', JSON.stringify(validReports));
};
collectValidReports();

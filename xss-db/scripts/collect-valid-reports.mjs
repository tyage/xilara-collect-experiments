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
      Page.handleJavaScriptDialog({ accept: false });
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

const isReportValid = async (report) => {
  const pocFile = `${responsesDir}/${report}/poc`;
  if (!fs.existsSync(pocFile)) {
    return false;
  }
  const pocContent = fs.readFileSync(pocFile);
  const pocResponse = `HTTP/1.1 200 OK
Host: localhost:8080
Connection: close
Content-type: text/html; charset=UTF-8

${pocContent}`;

  // start chrome process and set event listener to kill
  const chromeProcess = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const killChrome = () => {
    try { chromeProcess.kill(); } catch(e) {}
  };
  process.on('exit', killChrome);

  const { Page, Network } = await launchCDP(chromeProcess);

  await Promise.all([
    Network.enable(),
    Page.enable(),
    Network.setRequestInterceptionEnabled({ enabled: true })
  ]);

  // intercept request and response poc
  Network.requestIntercepted(async ({ interceptionId, request }) => {
    try {
      const isPoCRequest = request.url === 'http://localhost/';
      if (isPoCRequest) {
        await Network.continueInterceptedRequest({
          interceptionId,
          rawResponse: new Buffer(pocResponse, 'binary').toString('base64')
        });
      } else {
        await Network.continueInterceptedRequest({
          interceptionId,
          errorReason: 'Aborted'
        });
      }
    } catch(e) {
      // error happens when process finished and Network will terminate
    }
  });

  const isDialogOpening = await checkDialogOpening(Page, 'http://localhost');

  await Promise.all([
    Page.disable(),
    Network.disable()
  ]);

  // kill chrome process and remove event listener
  chromeProcess.kill();
  process.removeListener('exit', killChrome);

  return isDialogOpening;
};
const collectValidReports = async () => {
  const files = await listFiles(responsesDir);
  const responseDir = files.filter(f => /^\d+$/.test(f));
  const validReports = [];
  for (let report of responseDir) {
    const isValid = await isReportValid(report);
    console.log(report, isValid);
    if (isValid) {
      validReports.push(report);
    }
  }

  fs.writeFileSync('data/openbugbounty/valid-reports.json', JSON.stringify(validReports));
};
collectValidReports();

import childProcess from 'child_process';
import fs from 'fs';
import tmp from 'tmp-promise';
import { formatHTMLByChrome } from '../../Xilara/src/html-format'

const timeLimit = process.argv[2];

const createTemplate = async (report, preference, safeResponses, timeLimit = 20) => {
  // TODO: Xilaraを使うように
  const { path: buildDir } = await tmp.dir({ prefix: `roadrunner-${(new Date()).getTime()}-` })
  const formattedHTMLFiles = await Promise.all(safeResponses.map(async (htmlFile, i) => {
    const formattedHTML = await formatHTMLByChrome(fs.readFileSync(htmlFile).toString());
    const formattedHTMLFile = `${buildDir}/${report}-${i}.html`;
    fs.writeFileSync(formattedHTMLFile, formattedHTML);
    return formattedHTMLFile;
  }));

  const templateFile = `../Xilara/roadrunner/output/${report}/${report}00.xml`;
  const roadrunner = childProcess.spawn('./gradlew', [
    'run',
    `-Pargs="-N${report} -O${preference} ${formattedHTMLFiles.join(' ')}"`
  ], {
    cwd: '../Xilara/roadrunner',
    shell: true,
    detached: true // detach to create a new group of process
  });

  let output = '';
  roadrunner.stdout.on('data', (data) => {
    output += data;
  });
  roadrunner.stderr.on('data', (data) => {
    output += data;
  });

  return new Promise((resolve, reject) => {
    let killTimer;
    if (timeLimit) {
      killTimer = setTimeout(() => {
        process.kill(-roadrunner.pid, 'SIGKILL');
        reject(`${output}\nskip ${report}`);
      }, timeLimit * 1000);
    }

    roadrunner.on('close', (code) => {
      if (killTimer) {
        clearTimeout(killTimer);
      }

      if (fs.existsSync(templateFile)) {
        const template = fs.readFileSync(templateFile);
        resolve(template);
      } else {
        reject(output);
      }
    });
  });
};

const createAllTemplate = async () => {
  const preference = `${process.cwd()}/preferences.xml`;
  const responsesDir = `${process.cwd()}/data/openbugbounty/responses`;
  const validReports = JSON.parse(fs.readFileSync('data/openbugbounty/valid-reports.json'));

  for (let report of validReports) {
    const responseDir = `${responsesDir}/${report}`;
    const templateFile = `data/openbugbounty/templates/${report}`;

    if (fs.existsSync(templateFile)) {
      continue;
    }

    const safeResponses = [1, 2].map(id => `${responseDir}/${id}`);
    const allExists = safeResponses.filter(r => fs.existsSync(r)).length === safeResponses.length;
    if (!allExists) {
      continue;
    }

    try {
      console.log(`generate template of report ${report}`);
      const template = await createTemplate(report, preference, safeResponses, timeLimit && +timeLimit);
      fs.writeFileSync(templateFile, template);
    } catch (e) {
      console.log(e);
    }
  }
};
createAllTemplate();

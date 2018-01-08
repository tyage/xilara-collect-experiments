import childProcess from 'child_process';
import fs from 'fs';

const createTemplate = (report, preference, safeResponses) => {
  const roadrunner = childProcess.spawn('./gradlew', [
    'run',
    `-Pargs="-N${report} -O${preference} ${safeResponses.join(' ')}"`
  ], {
    cwd: '../Xilara/roadrunner',
    shell: true
  });

  return new Promise((resolve, reject) => {
    let output = '';
    roadrunner.stdout.on('data', (data) => {
      output += data;
    });
    roadrunner.stderr.on('data', (data) => {
      output += data;
    });
    setTimeout(() => {
      roadrunner.kill('SIGHUP');
      reject(`${output}\nskip ${report}`);
    }, 1000 * 20);
    roadrunner.on('close', (code) => {
      const templateFile = `../Xilara/roadrunner/output/${report}/${report}00.xml`;
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

    if (+report === 105390) {
      continue;
    }

    try {
      console.log(`generate template of report ${report}`);
      const template = await createTemplate(report, preference, safeResponses);
      fs.writeFileSync(templateFile, template);
    } catch (e) {
      console.log(e);
    }
  }
};
createAllTemplate();

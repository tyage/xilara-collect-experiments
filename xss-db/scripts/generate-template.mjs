import childProcess from 'child_process';
import fs from 'fs';

const [ node, script, ...args ] = process.argv;
const preference = `${process.cwd()}/preferences.xml`;
const result = childProcess.spawn('./gradlew', [
  'run',
  `-Pargs="-Ntest -O${preference} ${args.map(f => `${process.cwd()}/${f}`).join(' ')}"`
], {
  cwd: '../Xilara/roadrunner',
  shell: true
});
result.stdout.on('data', (data) => {
  process.stdout.write(data);
});
result.stderr.on('data', (data) => {
  process.stderr.write(data);
});
result.on('close', (code) => {
  const template = fs.readFileSync('../Xilara/roadrunner/output/test/test00.xml');
  process.stdout.write(template);
});

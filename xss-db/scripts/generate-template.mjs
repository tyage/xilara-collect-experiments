import childProcess from 'child_process';

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

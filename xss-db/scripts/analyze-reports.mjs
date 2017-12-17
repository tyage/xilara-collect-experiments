import fs from 'fs';

const reports = JSON.parse(fs.readFileSync('data/openbugbounty/reports.json'));

console.log(`reports size: ${reports.length}`);

console.log(`unpatched XSS reports size: ${reports.filter(r => r.status === 'unpatched' && r.type === 'Cross Site Scripting').length}`);

const types = {};
reports.forEach(r => types[r.type] = 1);
console.log(`reported types: ${Object.keys(types)}`);

const statuses = {};
reports.forEach(r => statuses[r.status] = 1);
console.log(`reported statuses: ${Object.keys(statuses)}`);

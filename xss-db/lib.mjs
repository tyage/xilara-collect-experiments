import https from 'https';
import fs from 'fs';

export const fetch = (url) => {
  console.log(`start to fetch ${url}`);
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', (res) => {
        resolve(body);
      });
    });
  });
};

export const sleep = (msec) => new Promise((resolve) => setTimeout(resolve, msec));

export const listFiles = (dir) => {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) {
        return reject(err);
      }

      resolve(files);
    });
  });
};

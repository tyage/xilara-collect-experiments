import request from 'request';
import fs from 'fs';

export const fetch = (url) => {
  console.log(`start to fetch ${url}`);
  return new Promise((resolve, reject) => {
    request(url, { timeout: 30 * 1000 }, (error, res, body) => {
      if (error) {
        return reject(error);
      }
      resolve(body);
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

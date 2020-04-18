require('dotenv').config();
const axios = require('axios');
const tracker = require('./apiKeyTracker.json');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const API_ARR = JSON.parse(process.env.API_KEYS);
const schedule = require('node-schedule');
const BASE_URL = 'http://newsapi.org/v2';

function getKey() {
  tracker.api_key_index = (tracker.api_key_index + 1) % API_ARR.length;
  tracker.last_updated = Date.now();
  let API_KEY = API_ARR[tracker.api_key_index];
  fs.writeFileSync('apiKeyTracker.json', JSON.stringify(tracker), 'utf8');
  return API_KEY
}

function insertParam(key, value, url) {
  key = encodeURI(key);
  value = encodeURI(value);
  let kvp = url.split('&');
  let i = kvp.length;
  let x;
  while (i--) {
    x = kvp[i].split('=');
    if (x[0] === key) {
      x[1] = value;
      kvp[i] = x.join('=');
      break;
    }
  }
  if (i < 0) {
    kvp[kvp.length] = [key, value].join('=');
  }
  return kvp.join('&');
}

async function gitPush() {
  try {
    await exec('git add -A && git commit -m "Update News" && git push')
  } catch (err) {
    console.error(err)
  }
}

let updateFile = async (endpoint, params, download_path) => {
  let url = `${BASE_URL}/${endpoint}?apiKey=${getKey()}`;
  for (let p in params) {
    url = insertParam(p, params[p], url);
  }
  let res = await axios.get(url);
  if (res.status === 200) {
    fs.writeFileSync(download_path, JSON.stringify(res.data), 'utf8');
    console.log(`Updated ${download_path}`)
  } else {
    console.log(res)
  }
};

// Run every 15 minutes
let updateTopHeadline = schedule.scheduleJob('0 */11 * * * *', async function(){
  await updateFile("top-headlines", {category: "health", country:"in"}, "top-headlines/category/health/in.json");
  gitPush()
});

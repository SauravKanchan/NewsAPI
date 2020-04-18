require('dotenv').config();
const axios = require('axios');
const tracker = require('./apiKeyTracker.json');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const API_ARR = JSON.parse(process.env.API_KEYS);
const schedule = require('node-schedule');
const BASE_URL = 'http://newsapi.org/v2';
let run_git_init = tracker

function getKey() {
  tracker.api_key_index = (tracker.api_key_index + 1) % API_ARR.length;
  tracker.last_updated = Date().toString();
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
    const c = await exec('git add -A && git commit -m "Update News" && git push origin master');
    console.log(c)
  } catch (err) {
    console.error(err)
  }
}

async function gitPull() {
  if (run_git_init) {
    await exec("git init && git config --global user.name 'SauravKanchan' && git config --global user.email 'sauravnk30@gmail.com'");
    console.log("Executed git init");
    run_git_init = false;
  }
  try {
    await exec(`git remote add origin ${process.env.GIT_URL}`);
    console.log("git remote add")
  } catch (e) {
    await exec(`git remote set-url origin ${process.env.GIT_URL}`);
    console.log("git set url")
  }
  console.log("Git pull and hard reset");
  try{
    await exec('git add -A && git commit -m"." && git pull origin master');
  }catch (e) {
    console.log("pull error")
  }
  await exec('git reset --hard origin/master');
  console.log("Git pull command succeed");
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
// let updateTopHeadline = schedule.scheduleJob('0 */15 * * * *', async function(){
let updateTopHeadline = schedule.scheduleJob('1 * * * * *', async function () {
  console.log("Update started at", Date().toString());
  await gitPull();
  await updateFile("top-headlines", {category: "health", country: "in"}, "top-headlines/category/health/in.json");
  await gitPush();
  console.log("Update ended at", Date().toString());
});
// gitPush();

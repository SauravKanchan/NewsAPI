require('dotenv').config();
const axios = require('axios');
const tracker = require('./apiKeyTracker.json');
const fs = require('fs');
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const API_ARR = JSON.parse(process.env.API_KEYS);

function getKey(){
  tracker.api_key_index = (tracker.api_key_index + 1) % API_ARR.length;
  let API_KEY = API_ARR[tracker.api_key_index];
  fs.writeFileSync('apiKeyTracker.json', JSON.stringify(tracker), 'utf8');
  return API_KEY
}

async function gitPush() {
  try {
    await exec('git add -A && git commit -m "Update News" && git push')
  } catch (err) {
    console.error(err)
  }
}

let news = async () => {
  let res = await axios.get(`http://newsapi.org/v2/top-headlines?country=in&category=health&apiKey=${getKey()}`)
  if (res.status === 200) {
    fs.writeFileSync('data/news.json', JSON.stringify(res.data), 'utf8');
    console.log("News Updated")
  } else {
    console.log(res)
  }
};

news();

import base64, requests, json, os, ast
from dotenv import load_dotenv
from random import randrange
from newsapi import NewsApiClient
from os import getenv

load_dotenv()

GITHUB_API_TOKEN = os.getenv("GITHUB_API_TOKEN")
API_KEYS = ast.literal_eval(os.getenv("API_KEYS"))
LAST_KEY_INDEX = randrange(0, len(API_KEYS))


def get_key():
    global LAST_KEY_INDEX
    LAST_KEY_INDEX = (LAST_KEY_INDEX + 1) % len(API_KEYS)
    return API_KEYS[LAST_KEY_INDEX]


def push_to_github(filename, content):
    url = "https://api.github.com/repos/SauravKanchan/NewsAPI" + "/contents/" + filename
    base64content = base64.b64encode(bytes(content, 'utf-8'))
    data = requests.get(url + '?ref=master', headers={"Authorization": "token " + GITHUB_API_TOKEN}).json()
    sha = data['sha']
    if base64content.decode('utf-8') + "\n" != data['content']:
        message = json.dumps({"message": "update",
                              "branch": "master",
                              "content": base64content.decode("utf-8"),
                              "sha": sha
                              })

        resp = requests.put(url, data=message,
                            headers={"Content-Type": "application/json", "Authorization": "token " + GITHUB_API_TOKEN})

        print(resp)
    else:
        print("nothing to update")


newsapi = NewsApiClient(api_key=get_key())
top_headlines = newsapi.get_top_headlines(category='health', country='in')
push_to_github("top-headlines/category/health/in.json", json.dumps(top_headlines))
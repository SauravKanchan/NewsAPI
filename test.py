import base64
import requests
import json

def push_to_github(filename, repo, branch, token):
    url="https://api.github.com/repos/"+repo+"/contents/"+filename
    base64content=base64.b64encode(bytes('your string', 'utf-8'))
    data = requests.get(url+'?ref='+branch, headers = {"Authorization": "token "+token}).json()
    sha = data['sha']
    if base64content.decode('utf-8')+"\n" != data['content']:
        message = json.dumps({"message":"update",
                            "branch": branch,
                            "content": base64content.decode("utf-8") ,
                            "sha": sha
                            })

        resp=requests.put(url, data = message, headers = {"Content-Type": "application/json", "Authorization": "token "+token})

        print(resp)
    else:
        print("nothing to update")

token = ""
filename="top-headlines/category/health/in.json"
repo = "SauravKanchan/NewsAPI"
branch="master"

push_to_github(filename, repo, branch, token)

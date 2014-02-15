data = {"client_id":1600,"client_secret":Wbay5QuqchJYA4jMBRzszNF2w9y6QDSD,"code":49d0f82caa98f5c0f171e735a50040a}
url = "https://api.venmo.com/v1/oauth/MU36TCB5QF8mJu3Hg2RdcLJqCZa23tCT"
import requests
response = requests.post(url, data)
response_dict = response.json()

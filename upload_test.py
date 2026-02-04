import requests

url = 'http://localhost:8000/api/documents/'
file_path = 'test_doc.txt'
notebook_id = '0b1a62f2-91ef-4d3c-84d3-f0d862444b71'

files = {'file': open(file_path, 'rb')}
data = {'notebook': notebook_id}

try:
    response = requests.post(url, files=files, data=data)
    print(f"Status Code: {response.status_code}")
    print(f"Response: {response.text}")
except Exception as e:
    print(f"Error: {e}")

import traceback
from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=False)
try:
    r = client.post('/api/articles/analyze', json={
        'url': 'https://example.com/unique_test', 
        'title': 'Test Title', 
        'text': 'Test text over 30 chars right here for analysis module.'
    })
    print("STATUS", r.status_code)
    print("RESPONSE", r.json())
except Exception as e:
    traceback.print_exc()

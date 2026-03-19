from fastapi.testclient import TestClient
from main import app
from sqlalchemy.exc import IntegrityError
import traceback

client = TestClient(app, raise_server_exceptions=False)

data = {
    'url': 'https://example.com/diag_test_3', 
    'title': 'Diag Title', 
    'publisher_name': 'Diag Publisher',
    'text': 'This is a test article text that should trigger analysis with len over 30 chars. v3'
}

print("--- CALL 1 ---")
r1 = client.post('/api/articles/analyze', json=data)
print("STATUS 1:", r1.status_code)

print("\n--- CALL 2 ---")
try:
    r2 = client.post('/api/articles/analyze', json=data)
    print("STATUS 2:", r2.status_code)
    if r2.status_code == 500:
        print("ERROR RESPONSE:", r2.text)
except Exception:
    traceback.print_exc()

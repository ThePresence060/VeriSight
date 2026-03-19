import traceback
import sys

sys.path.insert(0, '.')

from fastapi.testclient import TestClient
from main import app

client = TestClient(app, raise_server_exceptions=False)

r = client.post('/api/articles/analyze', json={
    'url': 'https://www.thehindu.com/news/diag-article-v5',
    'title': 'Trump demands others help secure Strait of Hormuz',
    'publisher_name': 'The Hindu',
    'text': 'US President Donald Trump has demanded that other countries help secure the Strait of Hormuz, a critical waterway for global oil shipments. Japan and Australia have both said they have no plans to send warships to the region.'
})

print(f"STATUS: {r.status_code}")
if r.status_code != 200:
    print(f"ERROR: {r.text}")

# Now try with raise_server_exceptions=True to see the actual traceback
print("\n--- WITH EXCEPTIONS ---")
try:
    client2 = TestClient(app, raise_server_exceptions=True)
    r2 = client2.post('/api/articles/analyze', json={
        'url': 'https://www.thehindu.com/news/diag-article-v6',
        'title': 'Test article for debugging',
        'publisher_name': 'Test',
        'text': 'US President Donald Trump has demanded that other countries help secure the Strait of Hormuz, a critical waterway for global oil shipments.'
    })
    print(f"OK: {r2.status_code}")
except Exception as e:
    traceback.print_exc()

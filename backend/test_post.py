import httpx
import traceback

url = "http://localhost:8000/api/articles/analyze"
data = {
    "url": "https://www.thehindu.com/news/international/test-article",
    "title": "Trump demands others help secure Strait of Hormuz",
    "publisher_name": "The Hindu",
    "text": "US President Donald Trump has demanded that other countries help secure the Strait of Hormuz, a critical waterway for global oil shipments. Japan and Australia have both said they have no plans to send warships to the region. The strait connects the Persian Gulf to the Gulf of Oman and is a vital chokepoint for international energy supplies."
}

try:
    print("Sending POST to /api/articles/analyze...")
    r = httpx.post(url, json=data, timeout=90)
    print(f"Status: {r.status_code}")
    if r.status_code == 200:
        print("SUCCESS:", r.json().get("verdict"))
    else:
        print("ERROR BODY:", r.text[:500])
except Exception as e:
    traceback.print_exc()

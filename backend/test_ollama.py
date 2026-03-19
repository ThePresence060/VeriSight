import httpx
import time

print("Testing Ollama direct call with qwen2.5...")
start = time.time()
try:
    r = httpx.post(
        "http://localhost:11434/api/generate",
        json={"model": "qwen2.5:7b", "prompt": "Say hello in one word.", "stream": False, "options": {"num_predict": 10}},
        timeout=120
    )
    elapsed = time.time() - start
    print(f"Status: {r.status_code} in {elapsed:.1f}s")
    print("Response:", r.json().get("response", "")[:200])
except httpx.ReadTimeout:
    elapsed = time.time() - start
    print(f"TIMEOUT after {elapsed:.1f}s")
except Exception as e:
    print(f"ERROR: {e}")

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_rewrite_mock():
    resp = client.post('/api/rewrite', json={'question': '1+1?', 'theme': 'space'})
    assert resp.status_code == 200
    assert 'rewritten' in resp.json()

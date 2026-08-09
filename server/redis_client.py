import os
import redis
from dotenv import load_dotenv

load_dotenv()

REDIS_URL = os.getenv("REDIS_URL")

redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True,  # returns strings instead of bytes
    ssl_cert_reqs=None,     # required for Upstash TLS
)

def test_connection():
    try:
        redis_client.ping()
        print("Redis connected successfully")
    except Exception as e:
        print(f"Redis connection failed: {e}")
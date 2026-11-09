import logging
import os

import redis

from app.config import SERVER_DIR

logger = logging.getLogger(__name__)
REDIS_URL = os.getenv("REDIS_URL")

if not REDIS_URL:
    raise ValueError(f"REDIS_URL is not set in {SERVER_DIR / '.env'}")

redis_client = redis.from_url(
    REDIS_URL,
    decode_responses=True,
)


def test_connection():
    try:
        redis_client.ping()
    except redis.RedisError:
        logger.exception("Redis connection failed")
    else:
        logger.info("Redis connected successfully")

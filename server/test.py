from redis_client import redis_client

redis_client.set("hello", "akash")

print(redis_client.get("hello"))
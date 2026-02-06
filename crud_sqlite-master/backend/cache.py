import time

CACHE = {}


def build_cache_key(host_url, **params):
    ordered = "&".join(f"{key}={value}" for key, value in sorted(params.items()))
    return f"{host_url}:{ordered}"


def cache_get(key):
    entry = CACHE.get(key)
    if not entry:
        return None
    if entry["expires_at"] < time.time():
        CACHE.pop(key, None)
        return None
    return entry["payload"]


def cache_set(key, payload, ttl_seconds):
    CACHE[key] = {
        "payload": payload,
        "expires_at": time.time() + ttl_seconds,
    }


def cache_clear():
    CACHE.clear()

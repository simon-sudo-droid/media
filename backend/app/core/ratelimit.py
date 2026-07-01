"""Shared rate limiter (slowapi). Lives in its own module to avoid circular
imports between main.py and the route modules."""
from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def client_ip(request: Request) -> str:
    """Real client IP behind Render/Cloudflare (X-Forwarded-For), else peer."""
    xff = request.headers.get("x-forwarded-for")
    if xff:
        return xff.split(",")[0].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip)

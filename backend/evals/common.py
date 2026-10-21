"""Helpers shared by the eval runners."""

import time

from app.llm.provider import LLMProvider

SECONDS_BETWEEN_REQUESTS = 3.2  # stays under OpenRouter's 20 requests/minute for free models


class Throttle:
    def __init__(self) -> None:
        self.last = 0.0
        self.requests = 0

    def wait(self) -> None:
        delay = SECONDS_BETWEEN_REQUESTS - (time.monotonic() - self.last)
        if delay > 0 and self.requests:
            time.sleep(delay)
        self.last = time.monotonic()


class ThrottledProvider:
    """Wraps a provider to pace and count requests."""

    def __init__(self, inner: LLMProvider, throttle: Throttle):
        self.inner, self.throttle = inner, throttle
        self.provider, self.model = inner.provider, inner.model

    def complete(self, messages, *, json_schema, schema_name):
        self.throttle.wait()
        self.throttle.requests += 1
        return self.inner.complete(messages, json_schema=json_schema, schema_name=schema_name)

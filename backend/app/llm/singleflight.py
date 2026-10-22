"""Single-flight: concurrent calls for the same key share one execution.

If two requests ask for the same card detail at once (a double tap, or React's
StrictMode double effect in development), only the first one calls the LLM; the
others wait for its result. One process only; across processes the database
claim in services/generation.py prevents duplicate work for concepts.
"""

import threading
from collections.abc import Callable, Hashable
from concurrent.futures import Future


class SingleFlight:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._calls: dict[Hashable, Future] = {}

    def do[T](self, key: Hashable, fn: Callable[[], T]) -> T:
        with self._lock:
            future = self._calls.get(key)
            leader = future is None
            if leader:
                future = Future()
                self._calls[key] = future
        if not leader:
            return future.result()
        try:
            result = fn()
        except BaseException as exc:
            future.set_exception(exc)
            raise
        else:
            future.set_result(result)
            return result
        finally:
            with self._lock:
                self._calls.pop(key, None)

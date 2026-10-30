import asyncio
from typing import Callable, Coroutine, Any

# Lightweight async worker queue for Phase A before Celery/Redis
class SimpleAsyncQueue:
    def __init__(self):
        self._queue = asyncio.Queue()

    async def enqueue(self, task: Callable[[], Coroutine[Any, Any, Any]]):
        await self._queue.put(task)

    async def worker_loop(self):
        while True:
            task = await self._queue.get()
            try:
                await task()
            except Exception as e:
                pass
            finally:
                self._queue.task_done()


async_queue = SimpleAsyncQueue()

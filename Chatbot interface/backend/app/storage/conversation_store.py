import json
import os
from abc import ABC, abstractmethod


class ConversationStore(ABC):
    @abstractmethod
    def get(self, conversation_id: str) -> list:
        pass

    @abstractmethod
    def save(self, conversation_id: str, history: list) -> None:
        pass

    @abstractmethod
    def delete(self, conversation_id: str) -> None:
        pass


class FileConversationStore(ConversationStore):
    def __init__(self, storage_dir: str | None = None):
        if storage_dir is None:
            backend_dir = os.path.dirname(
                os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            )
            storage_dir = os.path.join(backend_dir, ".storage")
        self.storage_dir = storage_dir
        os.makedirs(self.storage_dir, exist_ok=True)

    def _path(self, conversation_id: str) -> str:
        return os.path.join(self.storage_dir, f"{conversation_id}.json")

    def get(self, conversation_id: str) -> list:
        path = self._path(conversation_id)
        if not os.path.exists(path):
            return []
        with open(path, "r", encoding="utf-8") as file:
            return json.load(file)

    def save(self, conversation_id: str, history: list) -> None:
        path = self._path(conversation_id)
        with open(path, "w", encoding="utf-8") as file:
            json.dump(history, file, indent=2)

    def delete(self, conversation_id: str) -> None:
        path = self._path(conversation_id)
        if os.path.exists(path):
            os.remove(path)

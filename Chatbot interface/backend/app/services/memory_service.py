from app.config import Config
from app.storage.conversation_store import FileConversationStore

_store = FileConversationStore()


class MemoryService:
    @staticmethod
    def get_history(conversation_id: str) -> list:
        history = _store.get(conversation_id)
        if not history:
            history = [{"role": "system", "content": Config.SYSTEM_PROMPT}]
            _store.save(conversation_id, history)
        return history

    @staticmethod
    def append_message(conversation_id: str, role: str, content: str) -> list:
        history = MemoryService.get_history(conversation_id)
        history.append({"role": role, "content": content})

        if len(history) > Config.MAX_HISTORY_LENGTH + 1:
            system_message = history[0]
            recent_messages = history[-(Config.MAX_HISTORY_LENGTH):]
            history = [system_message, *recent_messages]

        _store.save(conversation_id, history)
        return history

    @staticmethod
    def delete_conversation(conversation_id: str) -> None:
        _store.delete(conversation_id)

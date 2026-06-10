import logging

from flask import Blueprint, jsonify, request

from app.services.grok_service import GrokService
from app.services.memory_service import MemoryService

logger = logging.getLogger(__name__)
chat_bp = Blueprint("chat", __name__)


@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    conversation_id = data.get("conversation_id")
    message = (data.get("message") or "").strip()

    if not conversation_id:
        return jsonify({"success": False, "error": "conversation_id is required."}), 400
    if not message:
        return jsonify({"success": False, "error": "message is required."}), 400

    try:
        history = MemoryService.get_history(conversation_id)
        history_with_user = [*history, {"role": "user", "content": message}]
        response_text = GrokService.chat(history_with_user)
        MemoryService.append_message(conversation_id, "user", message)
        MemoryService.append_message(conversation_id, "assistant", response_text)
        return jsonify({"success": True, "response": response_text}), 200
    except ValueError as error:
        return jsonify({"success": False, "error": str(error)}), 500
    except Exception as error:
        logger.exception("Chat request failed")
        return jsonify({"success": False, "error": "Something went wrong. Please try again."}), 500


@chat_bp.route("/conversation/<conversation_id>", methods=["GET"])
def get_conversation(conversation_id):
    history = MemoryService.get_history(conversation_id)
    return jsonify(history), 200


@chat_bp.route("/conversation/<conversation_id>", methods=["DELETE"])
def delete_conversation(conversation_id):
    MemoryService.delete_conversation(conversation_id)
    return jsonify({"success": True}), 200

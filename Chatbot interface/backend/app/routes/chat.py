import logging

from flask import Blueprint, jsonify, request

from app.services.qwen_service import QwenService
from app.services.memory_service import MemoryService

logger = logging.getLogger(__name__)
chat_bp = Blueprint("chat", __name__)


def _build_user_content(message: str, attachments: list) -> str | list:
    content_parts = []

    if message:
        content_parts.append({"type": "text", "text": message})

    for attachment in attachments:
        attachment_type = attachment.get("type")
        name = attachment.get("name", "attachment")

        if attachment_type == "image" and attachment.get("data"):
            content_parts.append(
                {
                    "type": "image_url",
                    "image_url": {"url": attachment["data"]},
                }
            )
        elif attachment_type == "file":
            file_content = attachment.get("content")
            if file_content:
                content_parts.append(
                    {
                        "type": "text",
                        "text": f"\n\n[File: {name}]\n{file_content}",
                    }
                )
            else:
                content_parts.append(
                    {
                        "type": "text",
                        "text": f"\n\n[Attached file: {name}]",
                    }
                )

    if not content_parts:
        return message
    if len(content_parts) == 1 and content_parts[0]["type"] == "text":
        return content_parts[0]["text"]
    return content_parts


def _build_storage_message(message: str, attachments: list) -> str:
    if not attachments:
        return message

    attachment_labels = []
    for attachment in attachments:
        name = attachment.get("name", "attachment")
        if attachment.get("type") == "image":
            attachment_labels.append(f"image:{name}")
        else:
            attachment_labels.append(f"file:{name}")

    attachment_summary = ", ".join(attachment_labels)
    if message:
        return f"{message}\n[Attachments: {attachment_summary}]"
    return f"[Attachments: {attachment_summary}]"


@chat_bp.route("/chat", methods=["POST"])
def chat():
    data = request.get_json(silent=True) or {}
    conversation_id = data.get("conversation_id")
    message = (data.get("message") or "").strip()
    attachments = data.get("attachments") or []

    if not conversation_id:
        return jsonify({"success": False, "error": "conversation_id is required."}), 400
    if not message and not attachments:
        return jsonify({"success": False, "error": "message or attachments are required."}), 400

    try:
        history = MemoryService.get_history(conversation_id)
        user_content = _build_user_content(message, attachments)
        history_with_user = [*history, {"role": "user", "content": user_content}]
        response_text = QwenService.chat(history_with_user)
        
        title = None
        if len(history) <= 1:
            title = message[:30] + "..." if len(message) > 30 else message

        storage_message = _build_storage_message(message, attachments)
        MemoryService.append_message(conversation_id, "user", storage_message)
        MemoryService.append_message(conversation_id, "assistant", response_text)
        
        response_data = {"success": True, "response": response_text}
        if title:
            response_data["title"] = title.strip('"\'* \n')
            
        return jsonify(response_data), 200
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

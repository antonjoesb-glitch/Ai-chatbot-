import logging
import requests

logger = logging.getLogger(__name__)

class QwenService:
    _model_name = "llama3.2:1b"
    _ollama_url = "http://localhost:11434/api/chat"

    @classmethod
    def chat(cls, messages: list) -> str:
        # Filter out complex content (like image dicts) from messages
        processed_messages = []
        for msg in messages:
            content = msg.get("content")
            if isinstance(content, list):
                text_parts = [part["text"] for part in content if part.get("type") == "text"]
                processed_content = "\n".join(text_parts)
            else:
                processed_content = str(content)
            
            processed_messages.append({
                "role": msg.get("role", "user"),
                "content": processed_content
            })

        payload = {
            "model": cls._model_name,
            "messages": processed_messages,
            "stream": False,
            "options": {
                "temperature": 0.7,
                "top_p": 0.9,
                "num_predict": 256
            }
        }

        try:
            logger.info(f"Sending request to Ollama ({cls._model_name})...")
            response = requests.post(cls._ollama_url, json=payload, timeout=60)
            
            if response.status_code == 404:
                raise ValueError("Model is still downloading or not found. Please wait a minute and try again!")
                
            response.raise_for_status()
            
            data = response.json()
            return data.get("message", {}).get("content", "")
            
        except requests.exceptions.ConnectionError:
            logger.error("Failed to connect to Ollama. Is it running?")
            raise ValueError("Could not connect to local AI. Please ensure Ollama is installed and running.")
        except Exception as e:
            logger.error(f"Error during Ollama generation: {e}")
            raise ValueError("Failed to generate a response from the local AI model.")

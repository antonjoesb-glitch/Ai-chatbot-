import logging

import requests

from app.config import Config

logger = logging.getLogger(__name__)


class GrokService:
    @staticmethod
    def _resolve_provider() -> tuple[str, str]:
        provider = (Config.AI_PROVIDER or "").strip().lower()
        api_key = Config.GROK_API_KEY or ""

        if not provider:
            if api_key.startswith("gsk_"):
                provider = "groq"
            elif api_key.startswith("xai-"):
                provider = "xai"
            else:
                provider = "xai"

        if provider == "groq":
            return (
                "https://api.groq.com/openai/v1/chat/completions",
                Config.GROK_MODEL
                if Config.GROK_MODEL and Config.GROK_MODEL != "grok-beta"
                else "llama-3.3-70b-versatile",
            )

        base_url = Config.GROK_API_URL or "https://api.x.ai/v1"
        if "api.xai.com" in base_url:
            base_url = "https://api.x.ai/v1"

        model = Config.GROK_MODEL
        if not model or model == "grok-beta":
            model = "grok-3"

        return f"{base_url.rstrip('/')}/chat/completions", model

    @staticmethod
    def chat(messages: list) -> str:
        if not Config.GROK_API_KEY:
            raise ValueError(
                "No API key configured. Add GROK_API_KEY to backend/.env."
            )

        url, model = GrokService._resolve_provider()
        headers = {
            "Authorization": f"Bearer {Config.GROK_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": model,
            "messages": messages,
        }

        try:
            response = requests.post(
                url,
                headers=headers,
                json=payload,
                timeout=Config.GROK_TIMEOUT,
            )
            response.raise_for_status()
        except requests.HTTPError as error:
            status = error.response.status_code if error.response is not None else None
            detail = ""
            if error.response is not None:
                try:
                    detail = error.response.json().get("error", {}).get("message", "")
                except ValueError:
                    detail = error.response.text[:200]

            if status == 401:
                raise ValueError(
                    "Invalid API key. Check GROK_API_KEY in backend/.env."
                ) from error
            if status == 404:
                raise ValueError(
                    f"Model '{model}' was not found. Update GROK_MODEL in backend/.env."
                ) from error

            logger.error("AI API error %s: %s", status, detail or error)
            raise ValueError(
                detail or f"AI service error ({status}). Please try again."
            ) from error
        except requests.RequestException as error:
            logger.error("AI API request failed: %s", error)
            raise ValueError(
                "Could not reach the AI service. Check your internet connection."
            ) from error

        data = response.json()
        return data["choices"][0]["message"]["content"]

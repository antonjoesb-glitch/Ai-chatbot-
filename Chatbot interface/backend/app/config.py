import os
from dotenv import load_dotenv

# Locate and load .env file from the backend parent directory
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
load_dotenv(os.path.join(backend_dir, '.env'))

class Config:
    """Configuration class for handling application environment variables."""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'grok-chatbot-secret-key-default-19827319')
    
    # Flask application settings
    PORT = int(os.environ.get('PORT', 5000))
    
    # AI API credentials (supports Groq keys: gsk_... or xAI keys: xai-...)
    GROK_API_KEY = os.environ.get('GROK_API_KEY')
    AI_PROVIDER = os.environ.get('AI_PROVIDER', '').strip().lower()
    GROK_API_URL = os.environ.get('GROK_API_URL', 'https://api.x.ai/v1').rstrip('/')
    GROK_MODEL = os.environ.get('GROK_MODEL', '')
    
    # Request timeout for external API calls
    GROK_TIMEOUT = int(os.environ.get('GROK_TIMEOUT', 30))

    # Conversational memory and history management settings
    MAX_HISTORY_LENGTH = int(os.environ.get('MAX_HISTORY_LENGTH', 20))
    SYSTEM_PROMPT = os.environ.get('SYSTEM_PROMPT', 'You are a helpful assistant.')
    CONVERSATION_STORE_TYPE = os.environ.get('CONVERSATION_STORE_TYPE', 'file')
    SUMMARY_THRESHOLD = int(os.environ.get('SUMMARY_THRESHOLD', 12))

    @staticmethod
    def validate():
        """Validates that necessary credentials are present."""
        errors = []
        if not Config.GROK_API_KEY:
            errors.append("GROK_API_KEY is not set in the environment variables.")
        return errors


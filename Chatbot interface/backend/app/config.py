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
    

    # Conversational memory and history management settings
    MAX_HISTORY_LENGTH = int(os.environ.get('MAX_HISTORY_LENGTH', 20))
    SYSTEM_PROMPT = os.environ.get('SYSTEM_PROMPT', 'You are a helpful assistant.')
    CONVERSATION_STORE_TYPE = os.environ.get('CONVERSATION_STORE_TYPE', 'file')
    SUMMARY_THRESHOLD = int(os.environ.get('SUMMARY_THRESHOLD', 12))

    @staticmethod
    def validate():
        """Validates that necessary credentials are present."""
        errors = []
        # No external API keys to validate for local model
        return errors


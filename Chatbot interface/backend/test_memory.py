import unittest
from unittest.mock import patch, MagicMock
import os
import shutil
import json

# Setup environment variables before imports
os.environ['GROK_API_KEY'] = 'gsk_mock_test_key_for_testing'
os.environ['CONVERSATION_STORE_TYPE'] = 'file'

from app import create_app
from app.services.memory_service import MemoryService
from app.storage.conversation_store import FileConversationStore

class TestConversationalMemory(unittest.TestCase):
    def setUp(self):
        self.app = create_app()
        self.client = self.app.test_client()
        self.test_storage_dir = os.path.join(
            os.path.dirname(os.path.abspath(__file__)), 
            ".test_storage"
        )
        # Override storage dir for FileConversationStore in tests
        self.store = FileConversationStore(storage_dir=self.test_storage_dir)
        self.memory_patcher = patch('app.services.memory_service._store', self.store)
        self.memory_patcher.start()

    def tearDown(self):
        self.memory_patcher.stop()
        if os.path.exists(self.test_storage_dir):
            shutil.rmtree(self.test_storage_dir)

    def test_conversation_store_get_save_delete(self):
        conv_id = "test_session_1"
        history = [{"role": "user", "content": "Hello!"}]
        self.store.save(conv_id, history)
        
        retrieved = self.store.get(conv_id)
        self.assertEqual(len(retrieved), 1)
        self.assertEqual(retrieved[0]["content"], "Hello!")
        
        self.store.delete(conv_id)
        self.assertEqual(len(self.store.get(conv_id)), 0)

    def test_memory_service_initialization(self):
        conv_id = "test_session_2"
        # Reading fresh history should populate system prompt
        history = MemoryService.get_history(conv_id)
        self.assertEqual(len(history), 1)
        self.assertEqual(history[0]["role"], "system")

    @patch('app.services.grok_service.requests.post')
    def test_chat_flow_and_api(self, mock_post):
        # Mocking the Groq/Grok API response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [
                {
                    "message": {
                        "content": "Hello! I am an assistant."
                    }
                }
            ]
        }
        mock_post.return_value = mock_response

        # Request to /api/chat
        payload = {
            "conversation_id": "test_session_api",
            "message": "Hi, I am Joe"
        }
        
        response = self.client.post(
            '/api/chat',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200)
        res_data = json.loads(response.data)
        self.assertTrue(res_data["success"])
        self.assertEqual(res_data["response"], "Hello! I am an assistant.")

        # Check conversation history endpoint
        history_response = self.client.get('/api/conversation/test_session_api')
        self.assertEqual(history_response.status_code, 200)
        history_data = json.loads(history_response.data)
        
        # Should have: 1 system prompt, 1 user message, 1 assistant response = 3 total messages
        self.assertEqual(len(history_data), 3)
        self.assertEqual(history_data[1]["role"], "user")
        self.assertEqual(history_data[1]["content"], "Hi, I am Joe")
        self.assertEqual(history_data[2]["role"], "assistant")
        self.assertEqual(history_data[2]["content"], "Hello! I am an assistant.")

if __name__ == '__main__':
    unittest.main()

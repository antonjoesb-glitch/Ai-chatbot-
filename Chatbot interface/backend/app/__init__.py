import os

from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from app.config import Config
import logging

def create_app():
    # Configure logging
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
    )
    logger = logging.getLogger(__name__)

    app = Flask(__name__)
    app.config.from_object(Config)

    # Validate essential environment variables configuration
    validation_errors = Config.validate()
    if validation_errors:
        for error in validation_errors:
            logger.warning(f"Configuration warning: {error}")

    # Enable CORS for api routes to allow seamless integration with the frontend
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Import and register Blueprints
    from app.routes.chat import chat_bp
    app.register_blueprint(chat_bp, url_prefix='/api')

    frontend_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), '..', '..', 'dist')
    )

    @app.route('/health')
    def health():
        return jsonify({
            "success": True,
            "message": "Grok Chatbot is running successfully!"
        }), 200

    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_frontend(path):
        if path.startswith('api/'):
            return jsonify({
                "success": False,
                "error": "The requested resource was not found."
            }), 404

        if path and os.path.exists(os.path.join(frontend_dir, path)):
            return send_from_directory(frontend_dir, path)

        index_path = os.path.join(frontend_dir, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(frontend_dir, 'index.html')

        return jsonify({
            "success": False,
            "error": "Frontend build not found. Run npm run build in the project root."
        }), 404

    # JSON error handlers for standard HTTP errors
    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            "success": False,
            "error": "The requested resource was not found."
        }), 404

    @app.errorhandler(405)
    def method_not_allowed(error):
        return jsonify({
            "success": False,
            "error": "The HTTP method is not allowed for this endpoint."
        }), 405

    @app.errorhandler(500)
    def internal_server_error(error):
        return jsonify({
            "success": False,
            "error": "An internal server error occurred."
        }), 500

    return app

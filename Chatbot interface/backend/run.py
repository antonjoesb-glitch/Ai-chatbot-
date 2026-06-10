from app import create_app
from app.config import Config

app = create_app()

if __name__ == '__main__':
    # Start the Flask application on specified port and bind to all interfaces
    # Default port is 5000; debug mode is enabled for development
    app.run(host='0.0.0.0', port=Config.PORT, debug=True)

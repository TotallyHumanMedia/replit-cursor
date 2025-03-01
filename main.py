from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import os
import uuid
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["200 per minute"]
)

socketio = SocketIO(app, cors_allowed_origins="*")

# Store connected users
connected_users = {}

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def handle_connect():
    # Generate a unique ID for this user
    user_id = str(uuid.uuid4())
    connected_users[request.sid] = {
        'id': user_id,
        'x': 0,
        'y': 0
    }
    
    # Tell this user their ID
    emit('you_connected', {
        'id': user_id,
        'count': len(connected_users)
    })
    
    # Tell everyone else about this new user
    emit('user_connected', {
        'id': user_id,
        'count': len(connected_users)
    }, broadcast=True, include_self=False)

@socketio.on('cursor_move')
def handle_cursor_move(data):
    if request.sid in connected_users:
        user = connected_users[request.sid]
        user['x'] = data['x']
        user['y'] = data['y']
        
        # Broadcast this user's cursor position to everyone else
        emit('cursor_update', {
            'id': user['id'],
            'x': data['x'],
            'y': data['y']
        }, broadcast=True, include_self=False)

@socketio.on('disconnect')
def handle_disconnect():
    if request.sid in connected_users:
        user_id = connected_users[request.sid]['id']
        del connected_users[request.sid]
        
        # Tell everyone this user left
        emit('user_disconnected', {
            'id': user_id,
            'count': len(connected_users)
        }, broadcast=True)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))
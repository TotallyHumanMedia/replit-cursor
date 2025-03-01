// Connect to Socket.IO server
const socket = io();

// Store data
let myId = null;
const cursors = {};
const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF5', 
    '#FF33F5', '#FFF533', '#33FFB2', '#A833FF', '#FF8C33'
];

// DOM elements
const userCountElement = document.getElementById('user-count');
const cursorContainer = document.getElementById('cursor-container');
const myCursor = document.getElementById('my-cursor');

// Handle mouse movement
document.addEventListener('mousemove', (e) => {
    const x = e.clientX;
    const y = e.clientY;
    
    // Update local cursor
    myCursor.style.left = `${x}px`;
    myCursor.style.top = `${y}px`;
    
    // Send position to server (throttled)
    throttledSend(x, y);
});

// Throttle function to limit updates
let lastSendTime = 0;
const throttleInterval = 20; // ms between updates

function throttledSend(x, y) {
    const now = Date.now();
    if (now - lastSendTime >= throttleInterval) {
        lastSendTime = now;
        socket.emit('cursor_move', { x, y });
    }
}

// Socket.IO event handlers
socket.on('you_connected', (data) => {
    myId = data.id;
    userCountElement.textContent = data.count;
});

socket.on('user_connected', (data) => {
    userCountElement.textContent = data.count;
});

socket.on('user_disconnected', (data) => {
    userCountElement.textContent = data.count;
    
    // Remove cursor element
    if (cursors[data.id]) {
        cursorContainer.removeChild(cursors[data.id]);
        delete cursors[data.id];
    }
});

socket.on('cursor_update', (data) => {
    // Create cursor if it doesn't exist
    if (!cursors[data.id]) {
        const cursor = document.createElement('div');
        cursor.className = 'cursor';
        
        // Random color
        const colorIndex = Math.floor(Math.random() * colors.length);
        const cursorColor = colors[colorIndex];
        
        // Add specific styling
        const style = document.createElement('style');
        style.textContent = `
            #cursor-${data.id}:before {
                border-bottom-color: ${cursorColor};
            }
        `;
        document.head.appendChild(style);
        
        cursor.id = `cursor-${data.id}`;
        cursorContainer.appendChild(cursor);
        cursors[data.id] = cursor;
    }
    
    // Update cursor position
    const cursor = cursors[data.id];
    cursor.style.left = `${data.x}px`;
    cursor.style.top = `${data.y}px`;
});
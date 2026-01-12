// Global Chat WebSocket Manager
const API_BASE_URL = window.API_BASE_URL || 'http://localhost:8000';

class GlobalChatManager {
    constructor() {
        this.ws = null;
        this.empId = null;
        this.empName = null;
        this.messages = [];
        this.loadedMessageIds = new Set(); // Track loaded message IDs to prevent duplicates
        this.isConnected = false;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }

    init(empId, empName) {
        this.empId = empId;
        this.empName = empName;
        this.setupEventListeners();
    }

    setupEventListeners() {
        const chatToggle = document.getElementById('chat-toggle');
        const chatClose = document.getElementById('chat-close');
        const chatSend = document.getElementById('chat-send');
        const chatInput = document.getElementById('chat-input');
        const chatContainer = document.getElementById('chat-container');

        if (chatToggle) {
            chatToggle.addEventListener('click', () => this.toggleChat());
        }

        if (chatClose) {
            chatClose.addEventListener('click', () => this.closeChat());
        }

        if (chatSend) {
            chatSend.addEventListener('click', () => this.sendMessage());
        }

        if (chatInput) {
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendMessage();
                }
            });
        }
    }

    connect() {
        if (this.isConnected || !this.empId) return;

        try {
            const wsUrl = API_BASE_URL.replace('http', 'ws') + `/ws/chat/global?emp_id=${this.empId}`;
            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => {
                console.log('Global chat connected');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.showConnectionStatus('Connected', 'success');

                // Load chat history when connection is established
                this.loadChatHistory();
            };

            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleMessage(data);
            };

            this.ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.showConnectionStatus('Connection error', 'error');
            };

            this.ws.onclose = () => {
                console.log('Global chat disconnected');
                this.isConnected = false;
                this.attemptReconnect();
            };
        } catch (error) {
            console.error('Failed to connect to chat:', error);
            this.showConnectionStatus('Failed to connect', 'error');
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
            this.isConnected = false;
        }
    }

    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
            setTimeout(() => this.connect(), delay);
        } else {
            this.showConnectionStatus('Connection lost', 'error');
        }
    }

    async loadChatHistory() {
        try {
            const token = sessionStorage.getItem('token');
            const response = await fetch(`${API_BASE_URL}/chat/history?limit=50`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                console.error('Failed to load chat history');
                document.getElementById('chat-messages').innerHTML = `
                    <div class="chat-empty text-danger">
                        <i class="bi bi-exclamation-circle"></i>
                        <p>Failed to load history. Please refresh.</p>
                    </div>
                `;
                return;
            }

            const messages = await response.json();
            const messagesContainer = document.getElementById('chat-messages');

            // Clear container and reset loaded IDs
            messagesContainer.innerHTML = '';
            this.loadedMessageIds.clear();

            if (messages.length === 0) {
                messagesContainer.innerHTML = `
                    <div class="chat-empty">
                        <i class="bi bi-chat-dots"></i>
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                `;
                return;
            }

            // Display messages in chronological order
            messages.forEach(msg => {
                this.addMessage({
                    id: msg.id,
                    emp_id: msg.emp_id,
                    emp_name: msg.emp_name,
                    message: msg.message,
                    created_at: msg.created_at
                });
            });

            this.scrollToBottom();
        } catch (error) {
            console.error('Error loading chat history:', error);
        }
    }

    handleMessage(data) {
        if (data.type === 'Global_chat') {
            this.addMessage(data);
        }
    }

    addMessage(messageData) {
        const messagesContainer = document.getElementById('chat-messages');
        if (!messagesContainer) return;

        // Prevent duplicate messages by checking ID
        if (messageData.id && this.loadedMessageIds.has(messageData.id)) {
            console.log('Duplicate message prevented:', messageData.id);
            return;
        }

        // Track this message ID
        if (messageData.id) {
            this.loadedMessageIds.add(messageData.id);
        }

        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${messageData.emp_id === this.empId ? 'own' : 'other'}`;

        const headerDiv = document.createElement('div');
        headerDiv.className = 'chat-message-header';

        const nameSpan = document.createElement('span');
        nameSpan.className = 'chat-message-name';
        nameSpan.textContent = messageData.emp_name || 'Unknown';

        const timeSpan = document.createElement('span');
        timeSpan.className = 'chat-message-time';
        timeSpan.textContent = this.formatTime(messageData.created_at || new Date());

        headerDiv.appendChild(nameSpan);
        headerDiv.appendChild(timeSpan);

        const contentDiv = document.createElement('div');
        contentDiv.className = 'chat-message-content';
        contentDiv.textContent = messageData.message;

        messageDiv.appendChild(headerDiv);
        messageDiv.appendChild(contentDiv);

        messagesContainer.appendChild(messageDiv);
        this.scrollToBottom();

        // Remove empty state if present
        const emptyState = messagesContainer.querySelector('.chat-empty');
        if (emptyState) {
            emptyState.remove();
        }
    }

    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();

        if (!message || !this.isConnected) return;

        try {
            const messageData = {
                type: 'Global_chat',
                emp_id: this.empId,
                emp_name: this.empName,
                message: message,
                created_at: new Date().toISOString()
            };

            this.ws.send(JSON.stringify(messageData));

            // DON'T add own message here - it will come back via WebSocket broadcast
            // This prevents duplicate messages

            input.value = '';
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showToast('Failed to send message', 'error');
        }
    }

    toggleChat() {
        const chatContainer = document.getElementById('chat-container');
        const chatToggle = document.getElementById('chat-toggle');

        if (chatContainer.classList.contains('active')) {
            this.closeChat();
        } else {
            chatContainer.classList.add('active');
            chatToggle.style.display = 'none';

            if (!this.isConnected) {
                this.connect();
            } else {
                // If already connected, just reload history
                this.loadChatHistory();
            }

            // Focus input
            setTimeout(() => {
                document.getElementById('chat-input')?.focus();
            }, 300);
        }
    }

    closeChat() {
        const chatContainer = document.getElementById('chat-container');
        const chatToggle = document.getElementById('chat-toggle');

        chatContainer.classList.remove('active');
        chatToggle.style.display = 'flex';
    }

    scrollToBottom() {
        const messagesContainer = document.getElementById('chat-messages');
        if (messagesContainer) {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    formatTime(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) {
            return 'Just now';
        } else if (diff < 3600000) {
            const mins = Math.floor(diff / 60000);
            return `${mins}m ago`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
        }
    }

    showConnectionStatus(message, type) {
        const statusDiv = document.getElementById('chat-status');
        if (statusDiv) {
            statusDiv.textContent = message;
            statusDiv.className = `chat-status ${type}`;
            setTimeout(() => {
                statusDiv.textContent = '';
                statusDiv.className = 'chat-status';
            }, 3000);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type === 'error' ? 'danger' : 'info'} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

        const container = document.getElementById('toast-container');
        if (container) {
            container.appendChild(toast);
            const bsToast = new bootstrap.Toast(toast);
            bsToast.show();
            setTimeout(() => toast.remove(), 5000);
        }
    }
}

// Initialize global chat manager
const globalChat = new GlobalChatManager();

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.globalChat = globalChat;
}

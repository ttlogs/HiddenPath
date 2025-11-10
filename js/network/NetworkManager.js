class NetworkManager {
    constructor() {
        this.socket = null;
        this.playerId = null;
        this.connected = false;
        this.players = new Map();
        this.messageQueue = [];
    }
    
    connect(serverUrl = 'ws://localhost:3000') {
        return new Promise((resolve, reject) => {
            try {
                this.socket = new WebSocket(serverUrl);
                
                this.socket.onopen = () => {
                    console.log('✅ Подключение к серверу установлено');
                    this.connected = true;
                    
                    // Отправляем все сообщения из очереди
                    this.messageQueue.forEach(message => this.send(message));
                    this.messageQueue = [];
                    
                    resolve();
                };
                
                this.socket.onmessage = (event) => {
                    this.handleMessage(JSON.parse(event.data));
                };
                
                this.socket.onclose = () => {
                    console.log('❌ Соединение с сервером разорвано');
                    this.connected = false;
                    this.showDisconnectMessage();
                };
                
                this.socket.onerror = (error) => {
                    console.error('❌ Ошибка WebSocket:', error);
                    reject(error);
                };
                
            } catch (error) {
                reject(error);
            }
        });
    }
    
    handleMessage(message) {
        switch (message.type) {
            case 'init':
                this.playerId = message.playerId;
                message.players.forEach(player => {
                    this.players.set(player.id, player);
                });
                console.log(`🎮 Инициализирован игрок ${this.playerId}`);
                break;
                
            case 'playerJoined':
                this.players.set(message.player.id, message.player);
                console.log(`👋 Игрок ${message.player.id} присоединился`);
                this.showChatMessage(`Игрок ${message.player.id} присоединился к игре`, 'system');
                break;
                
            case 'playerLeft':
                this.players.delete(message.playerId);
                console.log(`👋 Игрок ${message.playerId} вышел`);
                this.showChatMessage(`Игрок ${message.playerId} покинул игру`, 'system');
                break;
                
            case 'playerMoved':
                const player = this.players.get(message.playerId);
                if (player) {
                    player.position = message.position;
                    player.direction = message.direction;
                }
                break;
                
            case 'grassBent':
                // Можно добавить визуальные эффекты для примятой травы другими игроками
                document.dispatchEvent(new CustomEvent('remoteGrassBent', {
                    detail: message
                }));
                break;
                
            case 'chatMessage':
                this.showChatMessage(message.message, 'player', message.playerName);
                break;
        }
    }
    
    send(message) {
        if (!this.connected) {
            this.messageQueue.push(message);
            return;
        }
        
        try {
            this.socket.send(JSON.stringify(message));
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
        }
    }

    sendPlayerUpdate(position, direction) {
        this.send({
            type: 'playerUpdate',
            position: position,
            direction: direction
        });
    }

    sendGrassBent(position, radius = 1.8) {
        this.send({
            type: 'grassBent',
            position: position,
            radius: radius
        });
    }
    
    sendChatMessage(message) {
        this.send({
            type: 'chatMessage',
            message: message
        });
    }
    
    showChatMessage(message, type = 'player', playerName = '') {
        const chatDiv = document.getElementById('chatMessages') || this.createChatUI();
        const messageDiv = document.createElement('div');
        
        messageDiv.style.cssText = `
            margin: 5px 0;
            padding: 5px 10px;
            border-radius: 10px;
            word-wrap: break-word;
            ${type === 'system' ? 'background: rgba(255,255,255,0.1); color: #aaa; font-style: italic;' : 
              'background: rgba(74, 156, 90, 0.3); color: white;'}
        `;
        
        if (type === 'player') {
            messageDiv.innerHTML = `<strong>${playerName}:</strong> ${message}`;
        } else {
            messageDiv.textContent = message;
        }
        
        chatDiv.appendChild(messageDiv);
        chatDiv.scrollTop = chatDiv.scrollHeight;
    }
    
    createChatUI() {
        const chatContainer = document.createElement('div');
        chatContainer.id = 'chatContainer';
        chatContainer.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 20px;
            width: 300px;
            height: 200px;
            background: rgba(0,0,0,0.7);
            border-radius: 10px;
            padding: 10px;
            color: white;
            font-family: Arial, sans-serif;
            font-size: 12px;
            display: flex;
            flex-direction: column;
        `;
        
        const chatMessages = document.createElement('div');
        chatMessages.id = 'chatMessages';
        chatMessages.style.cssText = `
            flex: 1;
            overflow-y: auto;
            margin-bottom: 10px;
        `;
        
        const chatInputContainer = document.createElement('div');
        chatInputContainer.style.cssText = `
            display: flex;
            gap: 5px;
        `;
        
        const chatInput = document.createElement('input');
        chatInput.type = 'text';
        chatInput.placeholder = 'Напишите сообщение...';
        chatInput.style.cssText = `
            flex: 1;
            padding: 5px;
            border: none;
            border-radius: 5px;
            background: rgba(255,255,255,0.9);
        `;
        
        const sendButton = document.createElement('button');
        sendButton.textContent = '➤';
        sendButton.style.cssText = `
            padding: 5px 10px;
            border: none;
            border-radius: 5px;
            background: #4a9c5a;
            color: white;
            cursor: pointer;
        `;
        
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && chatInput.value.trim()) {
                this.sendChatMessage(chatInput.value.trim());
                chatInput.value = '';
            }
        });
        
        sendButton.addEventListener('click', () => {
            if (chatInput.value.trim()) {
                this.sendChatMessage(chatInput.value.trim());
                chatInput.value = '';
            }
        });
        
        chatInputContainer.appendChild(chatInput);
        chatInputContainer.appendChild(sendButton);
        
        chatContainer.appendChild(chatMessages);
        chatContainer.appendChild(chatInputContainer);
        document.body.appendChild(chatContainer);
        
        return chatMessages;
    }
    
    showDisconnectMessage() {
        const messageDiv = document.createElement('div');
        messageDiv.id = 'disconnectMessage';
        messageDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,0,0,0.8);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 10000;
        `;
        messageDiv.innerHTML = `
            <h3>❌ Потеряно соединение с сервером</h3>
            <p>Попытка переподключения...</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">
                Перезагрузить
            </button>
        `;
        document.body.appendChild(messageDiv);
    }
    
    getPlayers() {
        return this.players;
    }
    
    getPlayerId() {
        return this.playerId;
    }
    
    isConnected() {
        return this.connected;
    }
}
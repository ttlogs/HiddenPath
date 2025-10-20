class UIManager {
    constructor() {
        this.elements = {
            trailCounter: document.getElementById('trailCounter'),
            grassBent: document.getElementById('grassBent'),
            visibility: document.getElementById('visibility'),
            playersOnline: document.getElementById('playersOnline')
        };
    }

    updateTrailCounter(count) {
        this.elements.trailCounter.innerHTML =
        `Следов оставлено: <span style="color: #9acd32">${count}</span>`;
    }

    updateGrassBent(count) {
        this.elements.grassBent.innerHTML =
        `Примято травы: <span style="color: #9acd32">${count}</span>`;
    }

    updateVisibility(level) {
        let text, color;

        switch(level) {
            case 'LOW':
                text = "НИЗКАЯ";
                color = "#32cd32";
                break;
            case 'MEDIUM':
                text = "СРЕДНЯЯ";
                color = "#ffd700";
                break;
            case 'HIGH':
                text = "ВЫСОКАЯ";
                color = "#ff4500";
                break;
        }

        this.elements.visibility.innerHTML =
        `Заметность: <span style="color: ${color}">${text}</span>`;
    }

    updatePlayersOnline(count) {
        if (this.elements.playersOnline) {
            this.elements.playersOnline.innerHTML =
            `Игроков онлайн: <span style="color: #4ecdc4">${count}</span>`;
        }
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
                document.dispatchEvent(new CustomEvent('sendChatMessage', {
                    detail: chatInput.value.trim()
                }));
                chatInput.value = '';
            }
        });

        sendButton.addEventListener('click', () => {
            if (chatInput.value.trim()) {
                document.dispatchEvent(new CustomEvent('sendChatMessage', {
                    detail: chatInput.value.trim()
                }));
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

    showAlert(message, type = 'warning') {
        const alertDiv = document.createElement('div');
        alertDiv.style.cssText = `
            position: absolute;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'warning' ? '#ff4444' : '#4a9c5a'};
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 1000;
            animation: fadeInOut 3s ease-in-out;
        `;
        alertDiv.textContent = message;
        document.body.appendChild(alertDiv);

        setTimeout(() => {
            document.body.removeChild(alertDiv);
        }, 3000);
    }
}
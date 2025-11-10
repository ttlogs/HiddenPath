const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const players = new Map();
let playerIdCounter = 1;

// Serve static files from the parent directory
app.use(express.static(path.join(__dirname, '..')));

// Handle root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Handle all other routes by serving index.html (for SPA)
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

wss.on('connection', (ws) => {
    const playerId = playerIdCounter++;
    console.log(`🎮 Игрок ${playerId} подключился`);
    
    // Создаем нового игрока
    const player = {
        id: playerId,
        position: { x: (Math.random() - 0.5) * 10, y: 0.2, z: (Math.random() - 0.5) * 10 }, // Случайная стартовая позиция
        direction: { x: 0, y: 0, z: -1 },
        color: getRandomColor(),
        ws: ws
    };
    
    players.set(playerId, player);
    
    // Отправляем новому игроку текущее состояние мира
    ws.send(JSON.stringify({
        type: 'init',
        playerId: playerId,
        players: Array.from(players.values()).map(p => ({
            id: p.id,
            position: p.position,
            direction: p.direction,
            color: p.color
        }))
    }));
    
    // Сообщаем всем о новом игроке
    broadcast({
        type: 'playerJoined',
        player: {
            id: playerId,
            position: player.position,
            direction: player.direction,
            color: player.color
        }
    }, playerId);
    
    // Обработка сообщений от клиента
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            handleMessage(playerId, message);
        } catch (error) {
            console.error('Ошибка парсинга сообщения:', error);
        }
    });
    
    // Обработка отключения
    ws.on('close', () => {
        console.log(`🎮 Игрок ${playerId} отключился`);
        players.delete(playerId);
        
        // Сообщаем всем об отключении игрока
        broadcast({
            type: 'playerLeft',
            playerId: playerId
        });
    });
    
    ws.on('error', (error) => {
        console.error(`WebSocket ошибка у игрока ${playerId}:`, error);
    });
});

function handleMessage(playerId, message) {
    const player = players.get(playerId);
    if (!player) return;
    
    switch (message.type) {
        case 'playerUpdate':
            // Обновляем позицию игрока
            player.position = message.position;
            player.direction = message.direction;
            
            // Рассылаем обновление всем кроме отправителя
            broadcast({
                type: 'playerMoved',
                playerId: playerId,
                position: message.position,
                direction: message.direction
            }, playerId);
            break;
            
        case 'grassBent':
            // Рассылаем информацию о примятой траве
            broadcast({
                type: 'grassBent',
                playerId: playerId,
                position: message.position,
                radius: message.radius
            }, playerId);
            break;
            
        case 'chatMessage':
            // Рассылаем сообщение чата
            broadcast({
                type: 'chatMessage',
                playerId: playerId,
                message: message.message,
                playerName: `Игрок ${playerId}`
            });
            break;
    }
}

function broadcast(message, excludePlayerId = null) {
    const data = JSON.stringify(message);
    
    players.forEach((player, playerId) => {
        if (playerId !== excludePlayerId && player.ws.readyState === WebSocket.OPEN) {
            player.ws.send(data);
        }
    });
}

function getRandomColor() {
    const colors = [
        0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 
        0xfeca57, 0xff9ff3, 0x54a0ff, 0x5f27cd
    ];
    return colors[Math.floor(Math.random() * colors.length)];
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`🌐 Откройте http://localhost:${PORT} в браузере`);
    console.log(`📁 Обслуживаются файлы из: ${path.join(__dirname, '..')}`);
});

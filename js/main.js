class Game {
    constructor() {
        this.sceneManager = new SceneManager();
        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.statsManager = new StatsManager();
        this.firebaseManager = new FirebaseManager();
        this.remotePlayers = new Map();
        this.gameState = 'connecting';
        this.lastTime = performance.now();

        this.setupEventListeners();
        this.init();
    }

    setupEventListeners() {
        document.addEventListener('playerCaught', () => {
            this.gameOver();
        });

        document.addEventListener('sendChatMessage', (event) => {
            if (this.firebaseManager && this.firebaseManager.isConnected()) {
                this.firebaseManager.sendChatMessage(event.detail);
            }
        });

        // Firebase события
        document.addEventListener('remotePlayerJoined', (event) => {
            this.addRemotePlayer(event.detail);
        });

        document.addEventListener('remotePlayerUpdated', (event) => {
            this.updateRemotePlayer(event.detail);
        });

        document.addEventListener('remotePlayerLeft', (event) => {
            this.removeRemotePlayer(event.detail.playerId);
        });

        document.addEventListener('remoteChatMessage', (event) => {
            this.uiManager.showChatMessage(
                event.detail.message,
                'player',
                event.detail.playerName
            );
        });
    }

    async init() {
        this.showConnectionScreen();

        try {
            const connected = await this.firebaseManager.connect();
            if (connected) {
                this.gameState = 'playing';
                this.hideConnectionScreen();
                this.initializeGameObjects();
            } else {
                this.showConnectionError();
                return;
            }
        } catch (error) {
            console.error('Ошибка подключения:', error);
            this.showConnectionError();
            return;
        }

        console.log('🎮 Мультиплеерная игра запущена (Firebase)!');

        this.lastTime = performance.now();
        this.animate();
    }

    initializeGameObjects() {
        this.grassField = new GrassField(40, 8000);
        this.player = new Player();
        this.trailSystem = new TrailSystem(2000);
        this.mobManager = new MobManager();
        this.cameraController = new CameraController(
            this.sceneManager.camera,
            this.player
        );

        this.sceneManager.add(this.grassField.getGroup());
        this.sceneManager.add(this.player.getMesh());
        this.sceneManager.add(this.trailSystem.getMesh());
        this.sceneManager.add(this.mobManager.getGroup());

        this.createMapBoundaries();
        this.cameraController.ensureSafePosition();

        this.mobManager.spawnMob('guard');
        setTimeout(() => this.mobManager.spawnMob('archer'), 2000);
    }

    showConnectionScreen() {
        const connectionDiv = document.createElement('div');
        connectionDiv.id = 'connectionScreen';
        connectionDiv.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.9);
            color: white;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        connectionDiv.innerHTML = `
            <h1>🌿 Тайная Тропа - Мультиплеер</h1>
            <div style="margin: 20px 0; font-size: 18px;">
                <div id="connectionStatus">🔄 Подключение к Firebase...</div>
            </div>
            <div style="margin-top: 20px; font-size: 14px; color: #aaa;">
                Откройте эту страницу в другом окне браузера для игры вместе!
            </div>
        `;
        document.body.appendChild(connectionDiv);
    }

    hideConnectionScreen() {
        const connectionDiv = document.getElementById('connectionScreen');
        if (connectionDiv) {
            connectionDiv.remove();
        }
    }

    showConnectionError() {
        const connectionDiv = document.getElementById('connectionScreen');
        if (connectionDiv) {
            connectionDiv.innerHTML = `
                <h1>🌿 Тайная Тропа - Мультиплеер</h1>
                <div style="margin: 20px 0; font-size: 18px; color: #ff4444;">
                    ❌ Не удалось подключиться к Firebase
                </div>
                <button onclick="location.reload()" style="padding: 10px 20px; margin: 10px;">
                    Попробовать снова
                </button>
                <div style="margin-top: 20px; font-size: 14px; color: #aaa;">
                    Проверьте настройки Firebase в коде
                </div>
            `;
        }
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.gameState === 'playing') {
            if (!this.player || typeof this.player.update !== 'function') {
                console.error('❌ Player не инициализирован');
                return;
            }

            const playerMoved = this.player.update(this.inputManager, this.sceneManager.camera);
            let bentResult = { total: 0, fresh: 0 };

            if (playerMoved && this.player.didActuallyMove()) {
                bentResult = this.grassField.bendGrassAround(this.player.getPosition());
                if (bentResult.total > 0) {
                    this.statsManager.addBentGrass(bentResult.total);
                }

                const trailCount = this.trailSystem.addPoint(this.player.getPosition());
                this.statsManager.setTrailCount(trailCount);

                if (this.firebaseManager && this.firebaseManager.isConnected()) {
                    this.firebaseManager.sendPlayerUpdate(
                        this.player.getPosition(),
                        this.player.getDirection()
                    );
                }
            }

            if (this.grassField) {
                this.grassField.restoreGrass();
            }

            if (this.mobManager) {
                this.mobManager.update(this.player.getPosition(), deltaTime);
            }

            const currentVisibility = this.statsManager.calculateVisibility(
                this.player.didActuallyMove() ? this.player.getCurrentSpeed() : 0,
                bentResult.fresh
            );

            if (this.cameraController) {
                this.cameraController.update(this.inputManager);
                this.cameraController.ensureSafePosition();
            }

            this.updateUI();
        }

        if (this.sceneManager) {
            this.sceneManager.render();
        }
        this.frameCount = (this.frameCount || 0) + 1;
    }

    addRemotePlayer(playerData) {
        const remotePlayer = new RemotePlayer(playerData);
        this.remotePlayers.set(playerData.id, remotePlayer);

        this.sceneManager.add(remotePlayer.getMesh());
        this.sceneManager.add(remotePlayer.getTrailMesh());

        console.log(`➕ Добавлен удаленный игрок ${playerData.id}`);
        this.uiManager.showChatMessage(`Игрок ${playerData.id.substr(7, 4)} присоединился`, 'system');
    }

    updateRemotePlayer(playerData) {
        const remotePlayer = this.remotePlayers.get(playerData.id);
        if (remotePlayer) {
            remotePlayer.update(playerData.position, playerData.direction);
        }
    }

    removeRemotePlayer(playerId) {
        const remotePlayer = this.remotePlayers.get(playerId);
        if (remotePlayer) {
            this.sceneManager.remove(remotePlayer.getMesh());
            this.sceneManager.remove(remotePlayer.getTrailMesh());
            remotePlayer.destroy();
            this.remotePlayers.delete(playerId);

            console.log(`➖ Удален игрок ${playerId}`);
            this.uiManager.showChatMessage(`Игрок ${playerId.substr(7, 4)} вышел`, 'system');
        }
    }

    createMapBoundaries() {
        const boundarySize = 40;
        const halfSize = boundarySize / 2;

        const boundaryGeometry = new THREE.BoxGeometry(boundarySize, 0.1, 0.1);
        const boundaryMaterial = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.3
        });

        const boundaries = [
            { position: [0, 0.05, halfSize], rotation: [0, 0, 0] },
            { position: [0, 0.05, -halfSize], rotation: [0, 0, 0] },
            { position: [halfSize, 0.05, 0], rotation: [0, Math.PI/2, 0] },
            { position: [-halfSize, 0.05, 0], rotation: [0, Math.PI/2, 0] }
        ];

        boundaries.forEach(boundary => {
            const mesh = new THREE.Mesh(boundaryGeometry, boundaryMaterial);
            mesh.position.set(boundary.position[0], boundary.position[1], boundary.position[2]);
            mesh.rotation.set(boundary.rotation[0], boundary.rotation[1], boundary.rotation[2]);
            this.sceneManager.add(mesh);
        });
    }

    updateUI() {
        const stats = this.statsManager.getStats();
        const mobsCount = this.mobManager ? this.mobManager.getMobs().length : 0;
        const playersOnline = this.remotePlayers.size + 1;

        this.uiManager.updateTrailCounter(stats.trailCount);
        this.uiManager.updateGrassBent(stats.bentGrass);
        this.uiManager.updateVisibility(stats.visibility);
        this.uiManager.updatePlayersOnline(playersOnline);

        let mobsElement = document.getElementById('mobsCount');
        if (!mobsElement) {
            mobsElement = document.createElement('div');
            mobsElement.className = 'stats';
            mobsElement.id = 'mobsCount';
            document.getElementById('ui').appendChild(mobsElement);
        }
        mobsElement.innerHTML = `Мобов на карте: <span style="color: #ff4444">${mobsCount}</span>`;
    }

    gameOver() {
        this.gameState = 'gameOver';
        console.log('💀 ИГРА ОКОНЧЕНА - вас поймали!');

        const gameOverDiv = document.createElement('div');
        gameOverDiv.id = 'gameOver';
        gameOverDiv.innerHTML = `
            <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                       background: rgba(0,0,0,0.9); color: white; padding: 30px; border-radius: 15px;
                       text-align: center; border: 3px solid #ff4444;">
                <h1 style="color: #ff4444; margin: 0 0 20px 0;">💀 ВАС ПОЙМАЛИ!</h1>
                <p>Следов оставлено: ${this.statsManager.trailCount}</p>
                <p>Примято травы: ${this.statsManager.totalBentGrass}</p>
                <p>Игроков онлайн: ${this.remotePlayers.size + 1}</p>
                <button onclick="location.reload()" style="margin-top: 20px; padding: 10px 20px;
                       background: #4a9c5a; color: white; border: none; border-radius: 5px; cursor: pointer;">
                    Играть снова
                </button>
            </div>
        `;
        document.body.appendChild(gameOverDiv);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
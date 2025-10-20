class Game {
    constructor() {
        console.log('🚀 Конструктор Game запущен');

        // Проверяем что классы загружены
        if (typeof Player === 'undefined') {
            console.error('❌ Класс Player не загружен!');
            this.showError('Player class not loaded');
            return;
        }

        if (typeof SceneManager === 'undefined') {
            console.error('❌ Класс SceneManager не загружен!');
            this.showError('SceneManager class not loaded');
            return;
        }

        // Инициализируем базовые компоненты СРАЗУ
        this.sceneManager = new SceneManager();
        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.statsManager = new StatsManager();

        // Создаем игровые объекты СРАЗУ
        this.initializeGameObjects();

        this.firebaseManager = new FirebaseManager();
        this.remotePlayers = new Map();
        this.gameState = 'playing'; // Сразу играем
        this.lastTime = performance.now();

        this.setupEventListeners();

        console.log('✅ Все игровые объекты созданы, запускаем анимацию');
        this.animate();
    }

    initializeGameObjects() {
        console.log('🔄 Инициализация игровых объектов...');

        try {
            // Создаем все игровые объекты
            this.grassField = new GrassField(40, 8000);
            this.player = new Player(); // Должно работать теперь
            this.trailSystem = new TrailSystem(2000);
            this.mobManager = new MobManager();

            // Проверяем что player создан правильно
            if (!this.player || typeof this.player.update !== 'function') {
                throw new Error('Player не инициализирован правильно');
            }

            this.cameraController = new CameraController(
                this.sceneManager.camera,
                this.player
            );

            // Добавляем в сцену
            this.sceneManager.add(this.grassField.getGroup());
            this.sceneManager.add(this.player.getMesh());
            this.sceneManager.add(this.trailSystem.getMesh());
            this.sceneManager.add(this.mobManager.getGroup());

            this.createMapBoundaries();
            this.cameraController.ensureSafePosition();

            // Спавним мобов
            this.mobManager.spawnMob('guard');
            setTimeout(() => this.mobManager.spawnMob('archer'), 2000);

            console.log('✅ Игровые объекты инициализированы:', {
                player: !!this.player,
                grassField: !!this.grassField,
                mobManager: !!this.mobManager,
                cameraController: !!this.cameraController
            });

        } catch (error) {
            console.error('❌ Ошибка инициализации игровых объектов:', error);
            this.showError('Ошибка создания игрового мира: ' + error.message);
        }
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

        // Firebase события (подписываемся позже)
        setTimeout(() => {
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
        }, 1000);
    }

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,0,0,0.9);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            z-index: 10000;
            font-family: Arial, sans-serif;
        `;
        errorDiv.innerHTML = `
            <h3>❌ Ошибка загрузки игры</h3>
            <p>${message}</p>
            <button onclick="location.reload()" style="margin-top: 10px; padding: 5px 10px;">
                Перезагрузить
            </button>
        `;
        document.body.appendChild(errorDiv);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        if (this.gameState === 'playing') {
            // Проверяем что player существует и имеет метод update
            if (!this.player) {
                console.error('❌ Player не существует!');
                return;
            }

            if (typeof this.player.update !== 'function') {
                console.error('❌ Player.update не является функцией!', this.player);
                return;
            }

            // Обновляем игрока
            const playerMoved = this.player.update(this.inputManager, this.sceneManager.camera);
            let bentResult = { total: 0, fresh: 0 };

            if (playerMoved && this.player.didActuallyMove()) {
                bentResult = this.grassField.bendGrassAround(this.player.getPosition());
                if (bentResult.total > 0) {
                    this.statsManager.addBentGrass(bentResult.total);
                }

                const trailCount = this.trailSystem.addPoint(this.player.getPosition());
                this.statsManager.setTrailCount(trailCount);

                // Отправляем в Firebase если подключены
                if (this.firebaseManager && this.firebaseManager.isConnected()) {
                    this.firebaseManager.sendPlayerUpdate(
                        this.player.getPosition(),
                        this.player.getDirection()
                    );
                }
            }

            // Обновляем игру
            this.grassField.restoreGrass();
            if (this.mobManager && this.player) {
                this.mobManager.update(this.player.getPosition(), deltaTime);
            }

            const currentVisibility = this.statsManager.calculateVisibility(
                this.player.didActuallyMove() ? this.player.getCurrentSpeed() : 0,
                bentResult.fresh
            );

            this.cameraController.update(this.inputManager);
            this.cameraController.ensureSafePosition();
            this.updateUI();
        }

        this.sceneManager.render();
        this.frameCount = (this.frameCount || 0) + 1;
    }

    addRemotePlayer(playerData) {
        if (!this.remotePlayers.has(playerData.id)) {
            const remotePlayer = new RemotePlayer(playerData);
            this.remotePlayers.set(playerData.id, remotePlayer);

            this.sceneManager.add(remotePlayer.getMesh());
            this.sceneManager.add(remotePlayer.getTrailMesh());

            console.log(`➕ Добавлен удаленный игрок ${playerData.id}`);
            this.uiManager.showChatMessage(`Игрок ${playerData.id.substr(7, 4)} присоединился`, 'system');
        }
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

// Запускаем игру когда всё загружено
window.addEventListener('DOMContentLoaded', () => {
    console.log('📄 DOM загружен, запускаем игру...');

    // Даем время всем скриптам загрузиться
    setTimeout(() => {
        console.log('🎮 Запуск игры...');
        new Game();
    }, 100);
});
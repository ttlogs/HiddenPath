class Game {
    constructor() {
        console.log('🚀 Конструктор Game запущен');
        this.grassField = null;

        // Проверяем что классы загружены
        if (typeof Player === 'undefined') {
            console.error('❌ Класс Player не загружен!');
            this.showError('Player class not loaded');
            return;
        }

        // Инициализируем базовые компоненты СРАЗУ
        this.sceneManager = new SceneManager();
        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.statsManager = new StatsManager();

        // Пытаемся создать FirebaseManager (даже если он не загрузится)
        try {
            this.firebaseManager = new FirebaseManager();
            this.remotePlayers = new Map();
            console.log('✅ FirebaseManager создан');
        } catch (error) {
            console.warn('⚠️ FirebaseManager не загружен, продолжаем без мультиплеера');
            this.firebaseManager = null;
            this.remotePlayers = new Map();
        }

        this.gameState = 'initializing';
        this.lastTime = performance.now();

        // Создаем игровые объекты СРАЗУ
        this.initializeGameObjects();
        this.setupEventListeners();

        // Пытаемся подключиться к Firebase (не блокируем игру)
        this.initializeFirebase();

        console.log('✅ Все игровые объекты созданы');
        this.animate();
    }

    initializeGameObjects() {
        console.log('🔄 Инициализация игровых объектов...');

        try {
            this.grassField = new GrassField(40, 8000);
            this.player = new Player();
            this.trailSystem = new TrailSystem(2000);
            this.mobManager = new MobManager();

            this.cameraController = new OrbitCameraController(
                this.sceneManager.camera,
                this.player
            );

            // Добавляем в сцену
            this.sceneManager.add(this.grassField.getGroup());
            this.sceneManager.add(this.player.getMesh());
            this.sceneManager.add(this.trailSystem.getMesh());
            this.sceneManager.add(this.mobManager.getGroup());

            this.createMapBoundaries();


            // Спавним мобов
            this.mobManager.spawnMob('guard');
            setTimeout(() => this.mobManager.spawnMob('archer'), 2000);

            this.gameState = 'playing';

            console.log('✅ Игровые объекты инициализированы');
        } catch (error) {
            console.error('❌ Ошибка инициализации:', error);
            this.showError('Ошибка создания игрового мира: ' + error.message);
        }
    }

    async initializeFirebase() {
        if (!this.firebaseManager) {
            console.log('⚠️ FirebaseManager недоступен, пропускаем подключение');
            this.uiManager.showFirebaseStatus('Мультиплеер отключен', 'error');
            return;
        }

        try {
            const connected = await this.firebaseManager.connect();
            if (connected) {
                console.log('🎮 Мультиплеер активирован!');
                this.uiManager.showFirebaseStatus('Мультиплеер подключен', 'success');

                // Сразу проверяем существующих игроков
                setTimeout(() => {
                    this.checkExistingPlayers();
                }, 2000);
            } else {
                console.log('⚠️ Firebase не подключен, играем в одиночку');
                this.uiManager.showFirebaseStatus('Одиночный режим', 'error');
            }
        } catch (error) {
            console.error('❌ Ошибка инициализации Firebase:', error);
            this.uiManager.showFirebaseStatus('Ошибка подключения', 'error');
        }
    }

    checkExistingPlayers() {
        if (this.firebaseManager && this.firebaseManager.players) {
            console.log('🔍 Проверяем существующих игроков...');
            this.firebaseManager.players.forEach((playerData, playerId) => {
                if (playerId !== this.firebaseManager.playerId) {
                    console.log(`➕ Добавляем существующего игрока: ${playerId}`);
                    this.addRemotePlayer({
                        id: playerId,
                        ...playerData
                    });
                }
            });
        }
    }

    setupEventListeners() {
        document.addEventListener('playerCaught', () => {
            this.gameOver();
        });

        document.addEventListener('sendChatMessage', (event) => {
            if (this.firebaseManager && this.firebaseManager.isConnected()) {
                this.firebaseManager.sendChatMessage(event.detail);
            } else {
                this.uiManager.showChatMessage(event.detail, 'player', 'Вы');
            }
        });

        // Добавляем отладку Firebase событий
        document.addEventListener('remotePlayerJoined', (event) => {
            console.log('🎯 MAIN: remotePlayerJoined', event.detail);
            this.addRemotePlayer(event.detail);
        });

        document.addEventListener('remotePlayerUpdated', (event) => {
            console.log('🎯 MAIN: remotePlayerUpdated', event.detail);
            this.updateRemotePlayer(event.detail);
        });

        document.addEventListener('remotePlayerLeft', (event) => {
            console.log('🎯 MAIN: remotePlayerLeft', event.detail);
            this.removeRemotePlayer(event.detail.playerId);
        });

        document.addEventListener('remoteChatMessage', (event) => {
            console.log('🎯 MAIN: remoteChatMessage', event.detail);
            this.uiManager.showChatMessage(
                event.detail.message,
                'player',
                event.detail.playerName
            );
        });
        document.addEventListener('beforeunload', () => {
            if (this.firebaseManager) {
                this.firebaseManager.destroy();
            }
        });
    }

    showFirebaseStatus(message) {
        const statusDiv = document.createElement('div');
        statusDiv.style.cssText = `
            position: absolute;
            top: 120px;
            left: 20px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 100;
        `;
        statusDiv.textContent = message;
        statusDiv.id = 'firebaseStatus';
        document.body.appendChild(statusDiv);

        setTimeout(() => {
            if (document.body.contains(statusDiv)) {
                document.body.removeChild(statusDiv);
            }
        }, 3000);
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
            // Обновляем игрока
            const playerMoved = this.player.update(this.inputManager, this.sceneManager.camera);
            let bentResult = { total: 0, fresh: 0 };

            if (playerMoved && this.player.didActuallyMove()) {
                // Обновляем позицию локального игрока в системе травы
                this.grassField.updatePlayerPosition(
                    this.firebaseManager ? this.firebaseManager.getPlayerId() : 'local_player',
                    this.player.getPosition() // это уже THREE.Vector3
                );

                // Приминаем траву вокруг ВСЕХ игроков
                bentResult = this.grassField.bendGrassAroundAllPlayers();

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
            } else if (this.grassField) {
                // Даже если не двигаемся, обновляем позицию для системы травы
                this.grassField.updatePlayerPosition(
                    this.firebaseManager ? this.firebaseManager.getPlayerId() : 'local_player',
                    this.player.getPosition()
                );

                // Все равно приминаем траву вокруг всех игроков
                bentResult = this.grassField.bendGrassAroundAllPlayers();
            }

            // Обновляем игру
            this.grassField.restoreGrass();
            this.mobManager.update(this.player.getPosition(), deltaTime);

            const currentVisibility = this.statsManager.calculateVisibility(
                this.player.didActuallyMove() ? this.player.getCurrentSpeed() : 0,
                bentResult.fresh
            );

            this.cameraController.update(this.inputManager);

            // Update grass visibility cone
            this.grassField.updateVisibility(
                this.player.getPosition(),
                this.player.getFacingAngle()
            );

            this.updateUI();
        }

        this.sceneManager.render();
        this.frameCount = (this.frameCount || 0) + 1;
    }

    addRemotePlayer(playerData) {
        console.log('🎯 MAIN: Добавление удаленного игрока', playerData.id);

        const remotePlayer = new RemotePlayer(playerData);
        this.remotePlayers.set(playerData.id, remotePlayer);

        this.sceneManager.add(remotePlayer.getMesh());
        this.sceneManager.add(remotePlayer.getTrailMesh());

        // ДОБАВЛЯЕМ: регистрируем удаленного игрока в системе травы
        if (this.grassField && playerData.position) {
            // Убеждаемся, что позиция корректна
            const position = playerData.position;
            if (typeof position.x === 'number' && typeof position.z === 'number') {
                this.grassField.updatePlayerPosition(playerData.id, position);
            } else {
                console.warn('⚠️ Некорректная начальная позиция удаленного игрока:', playerData.id, position);
            }
        }

        console.log(`➕ Добавлен удаленный игрок ${playerData.id}`);
        this.uiManager.showChatMessage(`Игрок ${playerData.id.substr(7, 6)} присоединился`, 'system');

        // Обновляем счетчик игроков
        this.uiManager.updatePlayersCount(this.remotePlayers.size + 1);
        this.uiManager.showFirebaseStatus(`Игроков: ${this.remotePlayers.size + 1}`, 'info');
    }

    updateRemotePlayer(playerData) {
        const remotePlayer = this.remotePlayers.get(playerData.id);
        if (remotePlayer) {
            remotePlayer.update(playerData.position, playerData.direction);

            // ДОБАВЛЯЕМ: обновляем позицию в системе травы
            if (this.grassField && playerData.position) {
                // Убеждаемся, что позиция корректна
                const position = playerData.position;
                if (typeof position.x === 'number' && typeof position.z === 'number') {
                    this.grassField.updatePlayerPosition(playerData.id, position);
                } else {
                    console.warn('⚠️ Некорректная позиция удаленного игрока:', playerData.id, position);
                }
            }
        } else {
            // Если игрок не найден, но пришли данные - возможно нужно создать
            console.log('🔄 Игрок не найден, создаем нового:', playerData.id);
            this.addRemotePlayer(playerData);
        }
    }

    removeRemotePlayer(playerId) {
        console.log('🎯 MAIN: Удаление игрока', playerId);

        const remotePlayer = this.remotePlayers.get(playerId);
        if (remotePlayer) {
            this.sceneManager.remove(remotePlayer.getMesh());
            this.sceneManager.remove(remotePlayer.getTrailMesh());
            remotePlayer.destroy();
            this.remotePlayers.delete(playerId);

            // ДОБАВЛЯЕМ: удаляем из системы травы
            if (this.grassField) {
                this.grassField.removePlayer(playerId);
            }

            console.log(`➖ Удален игрок ${playerId}`);
            this.uiManager.showChatMessage(`Игрок ${playerId.substr(7, 6)} вышел`, 'system');

            // Обновляем счетчик игроков
            this.uiManager.updatePlayersCount(this.remotePlayers.size + 1);
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

        // Отладочная информация Firebase
        if (this.firebaseManager) {
            this.uiManager.showFirebaseDebugInfo(this.firebaseManager.players);
        }

        // ДОБАВЛЯЕМ: отладочная информация о системе травы
        if (this.grassField && this.frameCount % 60 === 0) { // Каждую секунду
            const grassDebug = this.grassField.getDebugInfo();
            console.log('🌿 Grass System Debug:', grassDebug);
        }

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
    setTimeout(() => {
        console.log('🎮 Запуск игры...');
        new Game();
    }, 100);
});
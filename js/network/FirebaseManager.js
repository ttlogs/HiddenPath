class FirebaseManager {
    constructor() {
        console.log('🔥 FirebaseManager создан');
        this.players = new Map();
        this.playerId = null;
        this.connected = false;
        this.db = null;
        this.app = null;

        this.playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    async connect() {
        console.log('🔄 Попытка подключения к Firebase...');

        try {
            // Используем конфиг из config.js
            const firebaseConfig = typeof FirebaseConfig !== 'undefined' ? FirebaseConfig : {
                // Fallback для локальной разработки (пустые значения)
                apiKey: "",
                authDomain: "",
                databaseURL: "",
                projectId: "",
                storageBucket: "",
                messagingSenderId: "",
                appId: ""
            };

            console.log('🔧 Конфиг Firebase:', {
                ...firebaseConfig,
                apiKey: firebaseConfig.apiKey ? '***SET***' : '***MISSING***',
                databaseURL: firebaseConfig.databaseURL || '***MISSING***'
            });

            // Валидация конфига
            if (!firebaseConfig.apiKey || !firebaseConfig.databaseURL) {
                console.error('❌ Неполная конфигурация Firebase');
                console.log('💡 Проверьте что все переменные установлены в config.js');
                return false;
            }

            // Проверяем корректность database URL
            if (!firebaseConfig.databaseURL.startsWith('https://')) {
                console.error('❌ Некорректный database URL:', firebaseConfig.databaseURL);
                return false;
            }

            // Проверяем что Firebase SDK загружен
            if (typeof firebase === 'undefined') {
                console.error('❌ Firebase SDK не загружен!');
                return false;
            }

            console.log('✅ Firebase SDK загружен, версия:', firebase.SDK_VERSION);

            // Инициализируем Firebase
            let app;
            if (!firebase.apps.length) {
                console.log('🆕 Инициализация нового Firebase приложения');
                app = firebase.initializeApp(firebaseConfig);
            } else {
                console.log('🔄 Использование существующего Firebase приложения');
                app = firebase.app();
            }

            this.app = app;
            this.db = firebase.database(app); // Важно: передаем app явно
            this.connected = true;

            console.log('✅ Подключение к Firebase установлено');
            console.log('🔗 Database URL:', this.db.ref().toString());

            // ТЕСТ: проверяем запись и чтение
            const testPassed = await this.testFirebaseConnection();
            if (!testPassed) {
                console.error('❌ Тест Firebase не пройден');
                return false;
            }

            // Создаем игрока
            await this.createPlayer();

            // Настраиваем слушатели
            this.setupEventListeners();

            return true;

        } catch (error) {
            console.error('❌ Критическая ошибка подключения к Firebase:', error);
            return false;
        }
    }

    async testFirebaseConnection() {
        console.log('🧪 Начало тестирования Firebase...');

        try {
            const testRef = this.db.ref('connection_test');
            const testData = {
                message: 'Hello Firebase!',
                timestamp: Date.now(),
                random: Math.random()
            };

            console.log('📝 Пробуем записать тестовые данные...');

            // Записываем данные
            await testRef.set(testData);
            console.log('✅ Тестовые данные записаны');

            // Читаем данные обратно
            console.log('📖 Пробуем прочитать тестовые данные...');
            const snapshot = await testRef.once('value');
            const readData = snapshot.val();

            console.log('✅ Тестовые данные прочитаны:', readData);

            // Проверяем что данные совпадают
            if (readData && readData.message === testData.message) {
                console.log('🎉 Тест Firebase пройден успешно!');

                // Очищаем тестовые данные
                await testRef.remove();
                console.log('🧹 Тестовые данные удалены');

                return true;
            } else {
                console.error('❌ Тестовые данные не совпадают');
                return false;
            }

        } catch (error) {
            console.error('❌ Ошибка тестирования Firebase:', error);
            return false;
        }
    }

    async createPlayer() {
        console.log('👤 Создание игрока в Firebase...');

        const playerData = {
            id: this.playerId,
            position: {
                x: (Math.random() - 0.5) * 10,
                y: 0.2,
                z: (Math.random() - 0.5) * 10
            },
            direction: { x: 0, y: 0, z: -1 },
            color: this.getRandomColor(),
            online: true,
            lastUpdate: Date.now(),
            created: new Date().toISOString()
        };

        try {
            const playerRef = this.db.ref('players/' + this.playerId);
            console.log('📝 Запись игрока по пути:', playerRef.toString());

            await playerRef.set(playerData);
            console.log('✅ Игрок успешно создан в Firebase:', this.playerId);

            // Проверяем что игрок действительно записался
            setTimeout(() => this.verifyPlayerCreation(), 1000);

        } catch (error) {
            console.error('❌ Ошибка создания игрока:', error);
        }
    }

    async verifyPlayerCreation() {
        console.log('🔍 Проверка создания игрока...');

        try {
            const snapshot = await this.db.ref('players/' + this.playerId).once('value');
            const playerData = snapshot.val();

            if (playerData) {
                console.log('✅ Игрок найден в Firebase:', playerData);
            } else {
                console.error('❌ Игрок НЕ найден в Firebase!');
            }
        } catch (error) {
            console.error('❌ Ошибка проверки игрока:', error);
        }
    }

    setupEventListeners() {
        console.log('👂 Настройка слушателей Firebase...');

        // Слушаем ВСЕ изменения в players
        this.db.ref('players').on('value', (snapshot) => {
            const playersData = snapshot.val();
            console.log('📨 Получены данные игроков:', playersData);
            this.handlePlayersUpdate(playersData);
        });

        // Также слушаем отдельные события
        this.db.ref('players').on('child_added', (snapshot) => {
            console.log('➕ Добавлен новый игрок:', snapshot.key, snapshot.val());
        });

        this.db.ref('players').on('child_changed', (snapshot) => {
            console.log('🔄 Изменен игрок:', snapshot.key, snapshot.val());
        });

        this.db.ref('players').on('child_removed', (snapshot) => {
            console.log('➖ Удален игрок:', snapshot.key);
        });
    }

    handlePlayersUpdate(playersData) {
        console.log('🔄 Обработка обновления игроков:', playersData);

        if (!playersData) {
            console.log('ℹ️ Нет данных игроков (пустая база)');
            return;
        }

        const playerCount = Object.keys(playersData).length;
        console.log(`👥 Найдено игроков в базе: ${playerCount}`);

        Object.keys(playersData).forEach(playerKey => {
            const playerData = playersData[playerKey];
            console.log(`   🔍 Игрок ${playerKey}:`, {
                online: playerData.online,
                position: playerData.position,
                lastUpdate: new Date(playerData.lastUpdate).toLocaleTimeString()
            });
        });
    }

    sendPlayerUpdate(position, direction) {
        if (!this.connected) {
            return;
        }

        const updateData = {
            position: { x: position.x, y: position.y, z: position.z },
            direction: { x: direction.x, y: direction.y, z: direction.z },
            lastUpdate: Date.now(),
            online: true
        };

        this.db.ref('players/' + this.playerId).update(updateData)
            .then(() => {
            console.log('📤 Позиция обновлена');
        })
            .catch((error) => {
            console.error('❌ Ошибка обновления позиции:', error);
        });
    }

    getRandomColor() {
        const colors = [0xff6b6b, 0x4ecdc4, 0x45b7d1, 0x96ceb4, 0xfeca57, 0xff9ff3];
        return colors[Math.floor(Math.random() * colors.length)];
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

    disconnect() {
        if (this.db && this.playerId) {
            this.db.ref('players/' + this.playerId).update({ online: false });
        }
        this.connected = false;
    }
}
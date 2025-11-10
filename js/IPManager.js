// IPManager.js
class IPManager {
    constructor() {
        this.storageKey = 'player_ip_id';
        this.playerId = this.getOrCreatePlayerId();
    }

    async getPlayerIP() {
        try {
            // Используем внешний сервис для получения IP
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            console.error('❌ Ошибка получения IP:', error);
            // Fallback - генерируем ID на основе браузера
            return this.generateBrowserId();
        }
    }

    generateBrowserId() {
        // Генерируем ID на основе характеристик браузера
        const navigatorInfo = [
            navigator.userAgent,
            navigator.language,
            navigator.hardwareConcurrency,
            screen.width + 'x' + screen.height
        ].join('|');

        return 'browser_' + this.hashCode(navigatorInfo);
    }

    hashCode(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    async getOrCreatePlayerId() {
        // Пробуем получить из localStorage
        let storedId = localStorage.getItem(this.storageKey);

        if (storedId) {
            console.log('📁 Найден сохраненный ID:', storedId);
            return storedId;
        }

        // Генерируем новый ID на основе IP + случайности
        const ip = await this.getPlayerIP();
        const newId = 'player_' + this.hashCode(ip) + '_' + Math.random().toString(36).substr(2, 9);

        console.log('🆕 Сгенерирован новый ID:', newId, 'для IP:', ip);

        // Сохраняем в localStorage
        localStorage.setItem(this.storageKey, newId);

        return newId;
    }

    getPlayerId() {
        return this.playerId;
    }

    // Для отладки
    getDebugInfo() {
        return {
            playerId: this.playerId,
            storageKey: this.storageKey
        };
    }
}
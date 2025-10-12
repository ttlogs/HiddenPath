class Game {
    constructor() {
        this.sceneManager = new SceneManager();
        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.statsManager = new StatsManager();
        this.gameState = 'playing';
        this.lastTime = performance.now();
        
        this.setupEventListeners();
        this.init();
    }
    
    setupEventListeners() {
        document.addEventListener('playerCaught', () => {
            this.gameOver();
        });
    }
    
    async init() {
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
        
        // Спавним первых мобов
        this.mobManager.spawnMob('guard');
        setTimeout(() => this.mobManager.spawnMob('archer'), 2000);
        
        // НОВОЕ: принудительно устанавливаем безопасную позицию камеры
        this.cameraController.ensureSafePosition();
        
        console.log('🎮 Игра запущена! Остерегайтесь мобов-охранников!');
        
        this.lastTime = performance.now();
        this.animate();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;
        
        if (this.gameState === 'playing') {
            const playerMoved = this.player.update(this.inputManager, this.sceneManager.camera);
            let bentResult = { total: 0, fresh: 0 };
            
            if (playerMoved) {
                bentResult = this.grassField.bendGrassAround(this.player.getPosition());
                if (bentResult.total > 0) {
                    this.statsManager.addBentGrass(bentResult.total);
                }
                
                const trailCount = this.trailSystem.addPoint(this.player.getPosition());
                this.statsManager.setTrailCount(trailCount);
            }
            
            this.grassField.restoreGrass();
            
            this.mobManager.update(this.player.getPosition(), deltaTime);
            
            const currentVisibility = this.statsManager.calculateVisibility(
                this.player.getCurrentSpeed(),
                bentResult.fresh
            );
            
            this.cameraController.update(this.inputManager);
            
            // НОВОЕ: дополнительная проверка безопасности камеры каждый кадр
            this.cameraController.ensureSafePosition();
            
            this.updateUI();
            
            // Отладочная информация о камере (можно убрать в финальной версии)
            if (this.frameCount % 300 === 0) {
                const debug = this.cameraController.debugInfo();
                console.log('📷 Камера:', {
                    высота: debug.heightAboveGround.toFixed(2),
                    минВысота: debug.minHeight,
                    углы: `X: ${(debug.angles.x * 180/Math.PI).toFixed(1)}°, Y: ${(debug.angles.y * 180/Math.PI).toFixed(1)}°`
                });
            }
        }
        
        this.sceneManager.render();
        this.frameCount = (this.frameCount || 0) + 1;
    }
    
    updateUI() {
        const stats = this.statsManager.getStats();
        const mobsCount = this.mobManager.getMobs().length;
        
        this.uiManager.updateTrailCounter(stats.trailCount);
        this.uiManager.updateGrassBent(stats.bentGrass);
        this.uiManager.updateVisibility(stats.visibility);
        
        // Добавляем информацию о мобах
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
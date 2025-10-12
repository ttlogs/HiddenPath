class Game {
    constructor() {
        this.sceneManager = new SceneManager();
        this.inputManager = new InputManager();
        this.uiManager = new UIManager();
        this.statsManager = new StatsManager();
        
        this.init();
    }
    
    async init() {
        this.grassField = new GrassField(40, 8000);
        this.player = new Player();
        this.trailSystem = new TrailSystem(2000);
        this.cameraController = new CameraController(
            this.sceneManager.camera, 
            this.player
        );
        
        this.sceneManager.add(this.grassField.getGroup());
        this.sceneManager.add(this.player.getMesh());
        this.sceneManager.add(this.trailSystem.getMesh());
        
        console.log('🎮 Игра запущена!');
        console.log('🖱️ ЛКМ + движение мыши - вращение камеры');
        console.log('🔓 Мышь отпущена - камера следует за игроком');
        
        this.animate();
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
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
        
        const currentVisibility = this.statsManager.calculateVisibility(
            this.player.getCurrentSpeed(),
            bentResult.fresh
        );
        
        this.cameraController.update(this.inputManager);
        this.updateUI();
        this.sceneManager.render();
    }
    
    updateUI() {
        const stats = this.statsManager.getStats();
        this.uiManager.updateTrailCounter(stats.trailCount);
        this.uiManager.updateGrassBent(stats.bentGrass);
        this.uiManager.updateVisibility(stats.visibility);
    }
}

window.addEventListener('DOMContentLoaded', () => {
    new Game();
});
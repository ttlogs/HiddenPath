class StatsManager {
    constructor() {
        this.totalBentGrass = 0;
        this.trailCount = 0;
        this.currentVisibility = 0;
        this.visibilityDecayRate = 0.5;
    }
    
    calculateVisibility(playerSpeed, freshBentGrass) {
        const speedVisibility = Math.min(50, playerSpeed * 300);
        const freshGrassVisibility = Math.min(30, freshBentGrass * 3);
        const totalGrassVisibility = Math.min(20, this.totalBentGrass / 15);

        const targetVisibility = speedVisibility + freshGrassVisibility + totalGrassVisibility;
        
        this.currentVisibility = THREE.MathUtils.lerp(
            this.currentVisibility, 
            targetVisibility, 
            0.1
        );
        
        this.currentVisibility = Math.max(0, this.currentVisibility - this.visibilityDecayRate);
        
        return this.currentVisibility;
    }
    
    getVisibilityLevel() {
        if (this.currentVisibility < 25) return 'LOW';
        if (this.currentVisibility < 60) return 'MEDIUM';
        return 'HIGH';
    }
    
    addBentGrass(count) {
        this.totalBentGrass += count;
    }
    
    setTrailCount(count) {
        this.trailCount = count;
    }
    
    getStats() {
        return {
            trailCount: this.trailCount,
            bentGrass: this.totalBentGrass,
            visibility: this.getVisibilityLevel()
        };
    }
    
    reset() {
        this.totalBentGrass = 0;
        this.trailCount = 0;
        this.currentVisibility = 0;
    }
}
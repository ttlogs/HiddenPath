class GrassField {
    constructor(size = 40, density = 8000) {
        this.size = size;
        this.density = density;
        this.group = new THREE.Group();
        this.grassBlades = [];
        this.bentBlades = new Set();
        
        this.generate();
    }
    
    generate() {
        for (let i = 0; i < this.density; i++) {
            const grassBlade = new GrassBlade();
            
            grassBlade.setPosition(
                (Math.random() - 0.5) * this.size,
                1.25,
                (Math.random() - 0.5) * this.size
            );
            
            this.grassBlades.push(grassBlade);
            this.group.add(grassBlade.getMesh());
        }
        
        console.log(`✅ Создано ${this.grassBlades.length} травинок`);
    }
    
    bendGrassAround(position, radius = 1.8) {
        let totalBent = 0;
        let freshBent = 0;
        
        this.grassBlades.forEach(grassBlade => {
            const distance = new THREE.Vector2(
                grassBlade.getMesh().position.x, 
                grassBlade.getMesh().position.z
            ).distanceTo(new THREE.Vector2(position.x, position.z));
            
            if (distance < radius) {
                if (!grassBlade.isBent()) {
                    const direction = new THREE.Vector3()
                        .subVectors(grassBlade.getMesh().position, position)
                        .normalize();
                    
                    if (grassBlade.bend(direction)) {
                        this.bentBlades.add(grassBlade);
                        totalBent++;
                        freshBent++;
                    }
                } else {
                    totalBent++;
                }
            }
        });
        
        return {
            total: totalBent,
            fresh: freshBent
        };
    }
    
    restoreGrass() {
        let restoredCount = 0;
        
        this.bentBlades.forEach(grassBlade => {
            if (grassBlade.restore()) {
                this.bentBlades.delete(grassBlade);
                restoredCount++;
            }
        });
        
        return restoredCount;
    }
    
    getGroup() {
        return this.group;
    }
    
    getBentCount() {
        return this.bentBlades.size;
    }
}
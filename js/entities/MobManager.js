class MobManager {
    constructor() {
        this.mobs = [];
        this.group = new THREE.Group();
        this.spawnTimer = 0;
        this.maxMobs = 3; // Уменьшим для начала
    }
    
    spawnMob(type = 'guard') {
        if (this.mobs.length >= this.maxMobs) return;
        
        const mob = new Mob(type);
        this.mobs.push(mob);
        this.group.add(mob.getMesh());
        
        console.log(`👹 Создан моб ${type}. Всего мобов: ${this.mobs.length}`);
    }
    
    update(playerPosition, deltaTime) {
        // Спавн новых мобов (упростим логику времени)
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > 5000 && this.mobs.length < this.maxMobs) {
            this.spawnMob();
            this.spawnTimer = 0;
        }
        
        // Обновляем всех мобов
        this.mobs.forEach(mob => {
            mob.update(playerPosition, 16); // Фиксированный deltaTime для простоты
        });
    }
    
    getGroup() {
        return this.group;
    }
    
    getMobs() {
        return this.mobs;
    }
}
class MobManager {
    constructor() {
        this.mobs = [];
        this.group = new THREE.Group();
        this.spawnTimer = 0;
        this.maxMobs = 3;
    }
    
    spawnMob(type = 'guard') {
        if (this.mobs.length >= this.maxMobs) return;
        
        const mob = new Mob(type);
        this.mobs.push(mob);
        this.group.add(mob.getMesh());
        
        console.log(`👹 Создан моб ${type}. Всего мобов: ${this.mobs.length}`);
    }
    
    startTurn(players) {
        this.mobs.forEach(mob => {
            mob.startTurn();
            mob.update(players);
        });
    }
    
    update(players) {
        this.mobs.forEach(mob => {
            mob.update(players);
        });
        
        // Проверяем столкновения с игроками
        this.checkCollisions(players);
    }
    
    checkCollisions(players) {
        players.forEach(player => {
            this.mobs.forEach(mob => {
                const distance = player.getPosition().distanceTo(mob.getPosition());
                if (distance < 1.5) {
                    mob.onPlayerCaught();
                }
            });
        });
    }
    
    getGroup() {
        return this.group;
    }
    
    getMobs() {
        return this.mobs;
    }
    
    removeMob(mob) {
        const index = this.mobs.indexOf(mob);
        if (index > -1) {
            this.group.remove(mob.getMesh());
            this.mobs.splice(index, 1);
        }
    }
}
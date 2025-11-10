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

    update(playerPosition, deltaTime) {
        // Спавн новых мобов
        this.spawnTimer += deltaTime;
        if (this.spawnTimer > 5000 && this.mobs.length < this.maxMobs) {
            this.spawnMob();
            this.spawnTimer = 0;
        }

        // Обновляем всех мобов
        this.mobs.forEach(mob => {
            mob.update(playerPosition, 16);
        });

        // Проверяем столкновения
        this.checkCollisions(playerPosition);
    }

    checkCollisions(playerPosition) {
        // Исправление: используем обычный forEach для массива mobs
        this.mobs.forEach(mob => {
            const distance = mob.getPosition().distanceTo(playerPosition);

            if (distance < 2.0) { // Радиус столкновения
                console.log('💀 Столкновение с мобом!');
                document.dispatchEvent(new CustomEvent('playerCaught'));
            }
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
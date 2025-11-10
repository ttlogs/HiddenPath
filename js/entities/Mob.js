class Mob {
    constructor(type = 'guard') {
        this.type = type;
        this.mesh = this.createMesh();
        this.position = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.speed = 0.02;
        this.state = 'patrol';
        this.visionRange = 6;
        this.chaseRange = 10;
        this.lastKnownPlayerPosition = new THREE.Vector3();
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;

        this.init();
    }

    createMesh() {
        let geometry, material;

        switch(this.type) {
            case 'guard':
                geometry = new THREE.ConeGeometry(0.4, 1.2, 8);
                material = new THREE.MeshLambertMaterial({ color: 0xff4444 });
                break;
            case 'archer':
                geometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 8);
                material = new THREE.MeshLambertMaterial({ color: 0xff8844 });
                break;
            default:
                geometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
                material = new THREE.MeshLambertMaterial({ color: 0xaa4444 });
        }

        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.6;
        return mesh;
    }

    init() {
        // Создаём случайные точки патрулирования
        for (let i = 0; i < 3; i++) {
            this.patrolPoints.push(new THREE.Vector3(
                (Math.random() - 0.5) * 25,
                0,
                (Math.random() - 0.5) * 25
            ));
        }

        // Начинаем с случайной точки
        const startPoint = this.patrolPoints[Math.floor(Math.random() * this.patrolPoints.length)];
        this.position.copy(startPoint);
        this.mesh.position.copy(this.position);
        this.setNextPatrolPoint();
    }

    setNextPatrolPoint() {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
        this.targetPosition.copy(this.patrolPoints[this.currentPatrolIndex]);
    }

    update(playerPosition, deltaTime) {
        switch(this.state) {
            case 'patrol':
                this.updatePatrol(playerPosition);
                break;
            case 'chase':
                this.updateChase(playerPosition);
                break;
            case 'return':
                this.updateReturn();
                break;
        }

        this.move();
        this.mesh.position.copy(this.position);

        // Поворачиваем моба в направлении движения
        if (this.targetPosition.clone().sub(this.position).length() > 0.1) {
            const direction = this.targetPosition.clone().sub(this.position).normalize();
            this.mesh.rotation.y = Math.atan2(direction.x, direction.z);
        }
    }

    updatePatrol(playerPosition) {
        const distanceToPlayer = this.position.distanceTo(playerPosition);

        // Проверяем видимость игрока
        if (distanceToPlayer < this.visionRange) {
            this.state = 'chase';
            this.lastKnownPlayerPosition.copy(playerPosition);
            this.targetPosition.copy(playerPosition);
            console.log('🚨 Моб заметил игрока!');
        }

        // Достигли точки патрулирования - идём к следующей
        if (this.position.distanceTo(this.targetPosition) < 1.5) {
            this.setNextPatrolPoint();
        }
    }

    updateChase(playerPosition) {
        const distanceToPlayer = this.position.distanceTo(playerPosition);

        if (distanceToPlayer < this.visionRange) {
            this.lastKnownPlayerPosition.copy(playerPosition);
            this.targetPosition.copy(playerPosition);
        } else {
            // Игрок скрылся из виду
            if (this.position.distanceTo(this.lastKnownPlayerPosition) < 1.5) {
                this.state = 'return';
                this.setNextPatrolPoint();
            } else {
                this.targetPosition.copy(this.lastKnownPlayerPosition);
            }
        }

        // Игрок слишком далеко - возвращаемся к патрулированию
        if (distanceToPlayer > this.chaseRange) {
            this.state = 'return';
            this.setNextPatrolPoint();
        }
    }

    updateReturn() {
        if (this.position.distanceTo(this.targetPosition) < 1.5) {
            this.state = 'patrol';
        }
    }

    move() {
        const direction = this.targetPosition.clone().sub(this.position).normalize();
        this.position.add(direction.multiplyScalar(this.speed));
    }

    getMesh() {
        return this.mesh;
    }

    getPosition() {
        return this.position.clone();
    }

    getState() {
        return this.state;
    }

    // Добавляем метод для отладки
    debugInfo() {
        return {
            position: this.position.clone(),
            state: this.state,
            type: this.type
        };
    }
}
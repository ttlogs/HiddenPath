class Player {
    constructor() {
        console.log('🎮 Создание простого игрока...');

        this.speed = 0.08;
        this.position = new THREE.Vector3();
        this.direction = new THREE.Vector3(0, 0, -1);

        // Простой меш
        const geometry = new THREE.SphereGeometry(0.2, 8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: 0x228b22,
            transparent: true,
            opacity: 0.3
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.y = 0.2;

        this.actuallyMoved = false;
        this.lastPosition = new THREE.Vector3();
    }

    update(inputManager, camera) {
        if (!inputManager) return false;

        const movement = inputManager.getMovementVector();
        this.lastPosition.copy(this.position);

        let moved = false;

        if (movement.length() > 0) {
            // Простое движение без учета камеры
            this.position.x += movement.x * this.speed;
            this.position.z += movement.z * this.speed;

            // Границы
            this.position.x = THREE.MathUtils.clamp(this.position.x, -18, 18);
            this.position.z = THREE.MathUtils.clamp(this.position.z, -18, 18);

            // Update facing direction based on movement
            this.direction.copy(movement).normalize();

            this.mesh.position.copy(this.position);
            moved = true;
        }

        this.actuallyMoved = this.position.distanceTo(this.lastPosition) > 0.001;
        return moved;
    }

    getCurrentSpeed() {
        return this.speed;
    }

    getMesh() {
        return this.mesh;
    }

    getPosition() {
        return this.position.clone();
    }

    getDirection() {
        return this.direction.clone();
    }

    getFacingAngle() {
        return Math.atan2(this.direction.x, this.direction.z);
    }

    didActuallyMove() {
        return this.actuallyMoved;
    }
}
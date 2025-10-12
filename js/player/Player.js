class Player {
    constructor() {
        this.normalSpeed = 0.08;
        this.slowSpeed = 0.03;
        this.sprintSpeed = 0.15;
        this.currentSpeed = 0;
        this.radius = 0.2;
        this.mesh = this.createMesh();
        this.position = new THREE.Vector3();
        this.boundary = 19;
        this.direction = new THREE.Vector3(0, 0, -1);
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(this.radius, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: 0x228b22,
            transparent: true,
            opacity: 0.3
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.2;
        
        const marker = new THREE.Mesh(
            new THREE.SphereGeometry(0.1, 6, 6),
            new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.1 })
        );
        mesh.add(marker);
        
        return mesh;
    }
    
    update(inputManager, camera) {
        const movement = inputManager.getMovementVector();
        let moved = false;
        
        if (inputManager.isKeyPressed('ShiftLeft')) {
            this.currentSpeed = this.sprintSpeed;
        } else if (inputManager.isKeyPressed('ControlLeft')) {
            this.currentSpeed = this.slowSpeed;
        } else {
            this.currentSpeed = this.normalSpeed;
        }
        
        if (movement.length() > 0) {
            const cameraDirection = this.getCameraRelativeMovement(movement, camera);
            
            this.position.x += cameraDirection.x * this.currentSpeed;
            this.position.z += cameraDirection.z * this.currentSpeed;
            
            if (cameraDirection.length() > 0.1) {
                this.direction.copy(cameraDirection).normalize();
            }
            
            this.applyBoundaries();
            this.mesh.position.copy(this.position);
            moved = true;
        } else {
            this.currentSpeed = 0;
        }
        
        return moved;
    }
    
    getCameraRelativeMovement(movement, camera) {
        const cameraDirection = new THREE.Vector3();
        camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        const cameraRight = new THREE.Vector3();
        cameraRight.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0));
        
        const result = new THREE.Vector3();
        
        if (movement.z !== 0) {
            result.add(cameraDirection.clone().multiplyScalar(-movement.z));
        }
        
        if (movement.x !== 0) {
            result.add(cameraRight.clone().multiplyScalar(movement.x));
        }
        
        return result.normalize();
    }
    
    applyBoundaries() {
        this.position.x = THREE.MathUtils.clamp(this.position.x, -this.boundary, this.boundary);
        this.position.z = THREE.MathUtils.clamp(this.position.z, -this.boundary, this.boundary);
    }
    
    getCurrentSpeed() {
        return this.currentSpeed;
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
}
class CameraController {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;
        this.offset = new THREE.Vector3(0, 8, 12);
        this.lerpSpeed = 0.05;
    }
    
    update() {
        const targetPosition = new THREE.Vector3(
            this.target.position.x + this.offset.x,
            this.target.position.y + this.offset.y,
            this.target.position.z + this.offset.z
        );
        
        // Добавляем лёгкое "дыхание" камеры
        targetPosition.y += Math.sin(Date.now() * 0.001) * 0.5;
        
        this.camera.position.lerp(targetPosition, this.lerpSpeed);
        this.camera.lookAt(this.target.position);
    }
    
    setTarget(target) {
        this.target = target;
    }
}
class CameraController {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;
        
        this.distance = 12;
        this.angles = new THREE.Vector2(
            Math.PI * 0.1,
            Math.PI * 0.25
        );
        
        this.mouseSensitivity = 0.002;
        this.lerpSpeed = 0.1;
        
        this.minPitch = -Math.PI * 0.4;
        this.maxPitch = Math.PI * 0.4;
        
        this.freeLook = false;
    }
    
    update(inputManager) {
        if (inputManager.isMouseDown()) {
            this.freeLook = true;
            const mouseDelta = inputManager.getMouseDelta();
            
            if (mouseDelta.x !== 0 || mouseDelta.y !== 0) {
                this.angles.y -= mouseDelta.x * this.mouseSensitivity;
                this.angles.x -= mouseDelta.y * this.mouseSensitivity;
                
                this.angles.x = THREE.MathUtils.clamp(
                    this.angles.x, 
                    this.minPitch, 
                    this.maxPitch
                );
            }
            
            inputManager.clearMouseDelta();
        } else {
            this.freeLook = false;
            this.followPlayer();
        }
        
        this.updateCameraPosition();
    }
    
    followPlayer() {
        const playerDirection = this.player.getDirection();
        if (playerDirection.length() > 0.1) {
            const targetAngle = Math.atan2(-playerDirection.x, -playerDirection.z);
            this.angles.y = THREE.MathUtils.lerp(this.angles.y, targetAngle, 0.05);
        }
        
        const targetPitch = Math.PI * 0.1;
        this.angles.x = THREE.MathUtils.lerp(this.angles.x, targetPitch, 0.05);
    }
    
    updateCameraPosition() {
        const targetPosition = this.calculateCameraPosition();
        this.camera.position.lerp(targetPosition, this.lerpSpeed);
        this.camera.lookAt(this.player.getPosition());
    }
    
    calculateCameraPosition() {
        const spherical = new THREE.Spherical();
        spherical.radius = this.distance;
        spherical.phi = Math.PI * 0.5 - this.angles.x;
        spherical.theta = this.angles.y;
        
        const position = new THREE.Vector3();
        position.setFromSpherical(spherical);
        position.add(this.player.getPosition());
        
        if (!this.freeLook) {
            position.y += Math.sin(Date.now() * 0.001) * 0.3;
        }
        
        return position;
    }
    
    setPlayer(player) {
        this.player = player;
    }
    
    getAngles() {
        return this.angles.clone();
    }
}
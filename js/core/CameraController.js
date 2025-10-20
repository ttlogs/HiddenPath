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
        
        this.minPitch = -Math.PI * 0.2;
        this.maxPitch = Math.PI * 0.4;
        
        this.minHeight = 2.0;
        this.maxHeight = 25.0;
        
        this.freeLook = false;
        
        this.smoothFollowSpeed = 0.05;
        this.targetAngles = this.angles.clone();
    }
    
    update(inputManager) {
        const wheelDelta = inputManager.getWheelDelta();
        if (wheelDelta !== 0) {
            this.distance += wheelDelta * 0.01;
            this.distance = THREE.MathUtils.clamp(this.distance, 5, 25);
        }
        
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
                
                this.targetAngles.copy(this.angles);
            }
            
            inputManager.clearMouseDelta();
        } else {
            this.freeLook = false;
            this.followPlayer();
        }
        
        this.angles.x = THREE.MathUtils.lerp(this.angles.x, this.targetAngles.x, this.smoothFollowSpeed);
        this.angles.y = THREE.MathUtils.lerp(this.angles.y, this.targetAngles.y, this.smoothFollowSpeed);
        
        this.updateCameraPosition();
    }
    
    followPlayer() {
        const playerDirection = this.player.getDirection();
        if (playerDirection.length() > 0.1) {
            const targetAngle = Math.atan2(-playerDirection.x, -playerDirection.z);
            this.targetAngles.y = targetAngle;
        }
        
        const targetPitch = Math.PI * 0.1;
        this.targetAngles.x = THREE.MathUtils.lerp(this.targetAngles.x, targetPitch, 0.05);
    }
    
    updateCameraPosition() {
        const targetPosition = this.calculateCameraPosition();
        const finalPosition = this.adjustCameraHeight(targetPosition);
        
        this.camera.position.lerp(finalPosition, this.lerpSpeed);
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
    
    adjustCameraHeight(targetPosition) {
        const playerPos = this.player.getPosition();
        const groundHeight = 0;
        
        const minAllowedHeight = groundHeight + this.minHeight;
        
        if (targetPosition.y < minAllowedHeight) {
            targetPosition.y = minAllowedHeight;
            
            const heightDiff = minAllowedHeight - playerPos.y;
            const maxViewAngle = Math.atan2(heightDiff, this.distance * 0.8);
            
            if (this.angles.x > maxViewAngle) {
                this.angles.x = maxViewAngle;
                this.targetAngles.x = maxViewAngle;
            }
        }
        
        if (targetPosition.y > this.maxHeight) {
            targetPosition.y = this.maxHeight;
        }
        
        return targetPosition;
    }
    
    ensureSafePosition() {
        const currentPos = this.camera.position.clone();
        const playerPos = this.player.getPosition();
        
        const groundHeight = 0;
        const minAllowedHeight = groundHeight + this.minHeight;
        
        if (currentPos.y < minAllowedHeight) {
            currentPos.y = minAllowedHeight;
            this.camera.position.copy(currentPos);
            
            const direction = new THREE.Vector3()
                .subVectors(currentPos, playerPos)
                .normalize();
            
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(direction);
            
            this.angles.x = Math.PI * 0.5 - spherical.phi;
            this.angles.y = spherical.theta;
            this.targetAngles.copy(this.angles);
        }
    }
    
    setPlayer(player) {
        this.player = player;
    }
    
    setDistance(distance) {
        this.distance = THREE.MathUtils.clamp(distance, 5, 25);
    }
    
    getAngles() {
        return this.angles.clone();
    }
    
    debugInfo() {
        return {
            position: this.camera.position.clone(),
            angles: this.angles.clone(),
            targetAngles: this.targetAngles.clone(),
            heightAboveGround: this.camera.position.y,
            minHeight: this.minHeight
        };
    }
}
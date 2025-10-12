class CameraController {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;
        
        this.distance = 12;
        this.angles = new THREE.Vector2(
            Math.PI * 0.1,  // Наклон вверх/вниз
            Math.PI * 0.25  // Поворот вокруг
        );
        
        this.mouseSensitivity = 0.002;
        this.lerpSpeed = 0.1;
        
        // Ограничения углов
        this.minPitch = -Math.PI * 0.2;  // Увеличим минимальный наклон (меньше вниз)
        this.maxPitch = Math.PI * 0.4;   // Оставим максимальный наклон
        
        // НОВОЕ: минимальная высота камеры над землей
        this.minHeight = 2.0;  // Минимальная высота камеры над землей
        this.maxHeight = 25.0; // Максимальная высота камеры
        
        this.freeLook = false;
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
                
                // Ограничиваем угол наклона
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
        
        // НОВОЕ: проверяем высоту камеры над землей
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
        const groundHeight = 0; // Высота земли (можно настроить если земля неровная)
        
        // Вычисляем минимально допустимую высоту для текущей позиции
        const minAllowedHeight = groundHeight + this.minHeight;
        
        // Если камера ниже минимальной высоты - поднимаем её
        if (targetPosition.y < minAllowedHeight) {
            targetPosition.y = minAllowedHeight;
            
            // Дополнительно: автоматически корректируем угол наклона
            // чтобы камера не пыталась смотреть сквозь землю
            const heightDiff = minAllowedHeight - playerPos.y;
            const maxViewAngle = Math.atan2(heightDiff, this.distance * 0.8);
            
            if (this.angles.x > maxViewAngle) {
                this.angles.x = maxViewAngle;
            }
        }
        
        // Также ограничиваем максимальную высоту
        if (targetPosition.y > this.maxHeight) {
            targetPosition.y = this.maxHeight;
        }
        
        return targetPosition;
    }

    ensureSafePosition() {
        const currentPos = this.camera.position.clone();
        const playerPos = this.player.getPosition();
        
        // Проверяем высоту и при необходимости корректируем
        const groundHeight = 0;
        const minAllowedHeight = groundHeight + this.minHeight;
        
        if (currentPos.y < minAllowedHeight) {
            currentPos.y = minAllowedHeight;
            this.camera.position.copy(currentPos);
            
            // Пересчитываем углы на основе безопасной позиции
            const direction = new THREE.Vector3()
                .subVectors(currentPos, playerPos)
                .normalize();
            
            const spherical = new THREE.Spherical();
            spherical.setFromVector3(direction);
            
            this.angles.x = Math.PI * 0.5 - spherical.phi;
            this.angles.y = spherical.theta;
        }
    }
    
    setPlayer(player) {
        this.player = player;
    }
    
    getAngles() {
        return this.angles.clone();
    }

    debugInfo() {
        return {
            position: this.camera.position.clone(),
            angles: this.angles.clone(),
            heightAboveGround: this.camera.position.y,
            minHeight: this.minHeight
        };
    }
}
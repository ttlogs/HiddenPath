class OrbitCameraController {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target;

        // Настройки камеры
        this.distance = 8;
        this.minDistance = 3;
        this.maxDistance = 15;

        this.angles = {
            horizontal: Math.PI / 4, // 45 градусов
            vertical: Math.PI / 6    // 30 градусов
        };

        this.minVerticalAngle = Math.PI / 12;  // 15 градусов
        this.maxVerticalAngle = Math.PI / 3;   // 60 градусов

        // Чувствительность управления
        this.rotationSpeed = 0.005;
        this.zoomSpeed = 0.5;

        // Состояние ввода
        this.isRotating = false;
        this.lastMousePosition = { x: 0, y: 0 };

        // Смещение камеры от центра цели
        this.targetOffset = new THREE.Vector3(0, 1.5, 0);

        // Плавность движения
        this.smoothness = 0.1;
        this.currentPosition = new THREE.Vector3();
        this.currentLookAt = new THREE.Vector3();

        this.initEventListeners();
        this.update(0, true); // Инициализируем позицию
    }

    initEventListeners() {
        // Вращение камеры
        document.addEventListener('mousedown', (event) => {
            if (event.button === 2) { // Правая кнопка мыши
                this.isRotating = true;
                this.lastMousePosition = { x: event.clientX, y: event.clientY };
                document.body.style.cursor = 'grabbing';
            }
        });

        document.addEventListener('mousemove', (event) => {
            if (this.isRotating) {
                const deltaX = event.clientX - this.lastMousePosition.x;
                const deltaY = event.clientY - this.lastMousePosition.y;

                this.angles.horizontal -= deltaX * this.rotationSpeed;
                this.angles.vertical -= deltaY * this.rotationSpeed;

                // Ограничиваем вертикальный угол
                this.angles.vertical = Math.max(
                    this.minVerticalAngle,
                    Math.min(this.maxVerticalAngle, this.angles.vertical)
                );

                this.lastMousePosition = { x: event.clientX, y: event.clientY };
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (event.button === 2) {
                this.isRotating = false;
                document.body.style.cursor = 'default';
            }
        });

        // Зум колесиком мыши
        document.addEventListener('wheel', (event) => {
            event.preventDefault();

            this.distance += event.deltaY * 0.01 * this.zoomSpeed;
            this.distance = Math.max(
                this.minDistance,
                Math.min(this.maxDistance, this.distance)
            );
        });

        // Предотвращаем контекстное меню при вращении
        document.addEventListener('contextmenu', (event) => {
            if (this.isRotating) {
                event.preventDefault();
            }
        });

        // Клавиши для управления камерой
        this.keys = {
            arrowLeft: false,
            arrowRight: false,
            arrowUp: false,
            arrowDown: false,
            q: false,
            e: false
        };

        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'ArrowLeft': this.keys.arrowLeft = true; break;
                case 'ArrowRight': this.keys.arrowRight = true; break;
                case 'ArrowUp': this.keys.arrowUp = true; break;
                case 'ArrowDown': this.keys.arrowDown = true; break;
                case 'KeyQ': this.keys.q = true; break;
                case 'KeyE': this.keys.e = true; break;
            }
        });

        document.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'ArrowLeft': this.keys.arrowLeft = false; break;
                case 'ArrowRight': this.keys.arrowRight = false; break;
                case 'ArrowUp': this.keys.arrowUp = false; break;
                case 'ArrowDown': this.keys.down = false; break;
                case 'KeyQ': this.keys.q = false; break;
                case 'KeyE': this.keys.e = false; break;
            }
        });
    }

    calculateIdealPosition() {
        // Вычисляем позицию камеры на сфере вокруг цели
        const horizontalDistance = this.distance * Math.cos(this.angles.vertical);
        const verticalDistance = this.distance * Math.sin(this.angles.vertical);

        const idealPosition = new THREE.Vector3();
        idealPosition.x = this.target.position.x + horizontalDistance * Math.cos(this.angles.horizontal);
        idealPosition.y = this.target.position.y + verticalDistance + this.targetOffset.y;
        idealPosition.z = this.target.position.z + horizontalDistance * Math.sin(this.angles.horizontal);

        return idealPosition;
    }

    calculateIdealLookAt() {
        // Точка, в которую смотрит камера (немного выше основания цели)
        const idealLookAt = new THREE.Vector3(
            this.target.position.x,
            this.target.position.y + this.targetOffset.y,
            this.target.position.z
        );

        return idealLookAt;
    }

    update(deltaTime, force = false) {
        // Обработка клавиш для вращения камеры
        if (this.keys.arrowLeft || this.keys.q) {
            this.angles.horizontal -= 0.02;
        }
        if (this.keys.arrowRight || this.keys.e) {
            this.angles.horizontal += 0.02;
        }
        if (this.keys.arrowUp) {
            this.angles.vertical = Math.max(
                this.minVerticalAngle,
                this.angles.vertical - 0.02
            );
        }
        if (this.keys.arrowDown) {
            this.angles.vertical = Math.min(
                this.maxVerticalAngle,
                this.angles.vertical + 0.02
            );
        }

        const idealPosition = this.calculateIdealPosition();
        const idealLookAt = this.calculateIdealLookAt();

        if (force) {
            // Мгновенное перемещение
            this.currentPosition.copy(idealPosition);
            this.currentLookAt.copy(idealLookAt);
        } else {
            // Плавное перемещение
            this.currentPosition.lerp(idealPosition, this.smoothness);
            this.currentLookAt.lerp(idealLookAt, this.smoothness);
        }

        // Устанавливаем позицию и направление камеры
        this.camera.position.copy(this.currentPosition);
        this.camera.lookAt(this.currentLookAt);
    }

    // Вспомогательные методы
    setDistance(distance) {
        this.distance = Math.max(this.minDistance, Math.min(this.maxDistance, distance));
    }

    setAngles(horizontal, vertical) {
        this.angles.horizontal = horizontal;
        this.angles.vertical = Math.max(
            this.minVerticalAngle,
            Math.min(this.maxVerticalAngle, vertical)
        );
    }

    getCameraState() {
        return {
            distance: this.distance,
            angles: { ...this.angles },
            position: this.currentPosition.clone(),
            lookAt: this.currentLookAt.clone()
        };
    }

    // Сброс камеры в стандартную позицию
    reset() {
        this.distance = 8;
        this.angles.horizontal = Math.PI / 4;
        this.angles.vertical = Math.PI / 6;
    }
}
class InputManager {
    constructor() {
        this.keys = {};
        this.mouse = {
            x: 0,
            y: 0,
            deltaX: 0,
            deltaY: 0,
            isDown: false,
            wheelDelta: 0
        };
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        document.addEventListener('mousemove', (event) => {
            this.mouse.deltaX = event.movementX || 0;
            this.mouse.deltaY = event.movementY || 0;
            this.mouse.x = event.clientX;
            this.mouse.y = event.clientY;
        });
        
        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) {
                this.mouse.isDown = true;
            }
        });
        
        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.mouse.isDown = false;
            }
        });
        
        document.addEventListener('contextmenu', (event) => {
            event.preventDefault();
        });

        document.addEventListener('wheel', (event) => {
            this.mouse.wheelDelta = event.deltaY;
            event.preventDefault();
        });
    }
    
    isKeyPressed(keyCode) {
        return this.keys[keyCode] || false;
    }
    
    getMovementVector() {
        const movement = new THREE.Vector3();
        
        if (this.isKeyPressed('KeyW') || this.isKeyPressed('ArrowUp')) {
            movement.z -= 1;
        }
        if (this.isKeyPressed('KeyS') || this.isKeyPressed('ArrowDown')) {
            movement.z += 1;
        }
        if (this.isKeyPressed('KeyA') || this.isKeyPressed('ArrowLeft')) {
            movement.x -= 1;
        }
        if (this.isKeyPressed('KeyD') || this.isKeyPressed('ArrowRight')) {
            movement.x += 1;
        }
        
        return movement.normalize();
    }
    
    getMouseDelta() {
        return new THREE.Vector2(this.mouse.deltaX, this.mouse.deltaY);
    }
    
    clearMouseDelta() {
        this.mouse.deltaX = 0;
        this.mouse.deltaY = 0;
    }
    
    isMouseDown() {
        return this.mouse.isDown;
    }

    getWheelDelta() {
        const delta = this.mouse.wheelDelta;
        this.mouse.wheelDelta = 0;
        return delta;
    }
}
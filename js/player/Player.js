class Player {
    constructor(id, name = 'Игрок') {
        this.id = id;
        this.name = name;
        this.mesh = this.createMesh();
        this.position = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.boundary = 18;
        this.direction = new THREE.Vector3(0, 0, -1);
        
        // Пошаговая система
        this.movePoints = 3;
        this.remainingMoves = 3;
        this.hasMoved = false;
        this.isActive = false;
        
        // Сетка для отображения доступных ходов
        this.moveGrid = new THREE.Group();
        this.availableMoves = [];
        
        this.init();
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const hue = Math.random();
        const material = new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(hue, 0.8, 0.5),
            transparent: true,
            opacity: 0.8
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = 0.3;
        
        // Подпись игрока
        const textGeometry = new THREE.PlaneGeometry(1, 0.3);
        const textMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.y = 1.2;
        textMesh.rotation.x = -Math.PI / 2;
        mesh.add(textMesh);
        
        return mesh;
    }
    
    init() {
        // Начальная позиция в углу карты
        this.position.set(
            (Math.random() > 0.5 ? 1 : -1) * 15,
            0,
            (Math.random() > 0.5 ? 1 : -1) * 15
        );
        this.mesh.position.copy(this.position);
        this.updateMoveGrid();
    }
    
    // НОВАЯ логика: планирование хода
    planMove(targetPosition) {
        if (!this.isActive || this.hasMoved) return false;
        
        const distance = this.position.distanceTo(targetPosition);
        const moveCost = Math.ceil(distance / 2);
        
        if (moveCost <= this.remainingMoves && this.isPositionValid(targetPosition)) {
            this.targetPosition.copy(targetPosition);
            this.remainingMoves -= moveCost;
            this.hasMoved = true;
            
            console.log(`🎮 Игрок ${this.name} планирует ход на (${targetPosition.x.toFixed(1)}, ${targetPosition.z.toFixed(1)})`);
            return true;
        }
        
        return false;
    }
    
    // Выполнение запланированного хода
    executeMove() {
        if (this.hasMoved) {
            this.position.copy(this.targetPosition);
            this.mesh.position.copy(this.position);
            this.updateMoveGrid();
            
            // Анимация движения
            this.animateMove();
            
            return true;
        }
        return false;
    }
    
    animateMove() {
        const startPos = this.mesh.position.clone();
        const endPos = this.position.clone();
        const duration = 500;
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.mesh.position.lerpVectors(startPos, endPos, progress);
            this.mesh.position.y = 0.3 + Math.sin(progress * Math.PI) * 0.5;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.mesh.position.copy(endPos);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // Сброс состояния для нового хода
    startTurn() {
        this.isActive = true;
        this.hasMoved = false;
        this.remainingMoves = this.movePoints;
        this.updateMoveGrid();
        console.log(`🎮 Ход игрока ${this.name}, очков движения: ${this.remainingMoves}`);
    }
    
    endTurn() {
        this.isActive = false;
        this.hideMoveGrid();
    }
    
    // Сетка доступных ходов
    updateMoveGrid() {
        this.hideMoveGrid();
        
        if (!this.isActive) return;
        
        const gridSize = 5;
        const halfSize = Math.floor(gridSize / 2);
        
        for (let x = -halfSize; x <= halfSize; x++) {
            for (let z = -halfSize; z <= halfSize; z++) {
                if (x === 0 && z === 0) continue;
                
                const targetX = this.position.x + x * 2;
                const targetZ = this.position.z + z * 2;
                const targetPos = new THREE.Vector3(targetX, 0, targetZ);
                
                const distance = this.position.distanceTo(targetPos);
                const moveCost = Math.ceil(distance / 2);
                
                if (moveCost <= this.remainingMoves && this.isPositionValid(targetPos)) {
                    this.showMoveIndicator(targetPos, moveCost);
                }
            }
        }
    }
    
    showMoveIndicator(position, cost) {
        const geometry = new THREE.CircleGeometry(0.8, 8);
        const material = new THREE.MeshBasicMaterial({
            color: cost <= 1 ? 0x00ff00 : cost === 2 ? 0xffff00 : 0xff8800,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        
        const indicator = new THREE.Mesh(geometry, material);
        indicator.position.set(position.x, 0.05, position.z);
        indicator.rotation.x = -Math.PI / 2;
        
        this.moveGrid.add(indicator);
        this.availableMoves.push({
            position: position,
            cost: cost,
            mesh: indicator
        });
    }
    
    hideMoveGrid() {
        while (this.moveGrid.children.length > 0) {
            this.moveGrid.remove(this.moveGrid.children[0]);
        }
        this.availableMoves = [];
    }
    
    isPositionValid(position) {
        return Math.abs(position.x) <= this.boundary && 
               Math.abs(position.z) <= this.boundary;
    }
    
    getMesh() {
        return this.mesh;
    }
    
    getMoveGrid() {
        return this.moveGrid;
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getDirection() {
        return this.direction.clone();
    }
    
    didActuallyMove() {
        return this.hasMoved;
    }
}
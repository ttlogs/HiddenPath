class Mob {
    constructor(type = 'guard') {
        this.type = type;
        this.mesh = this.createMesh();
        this.position = new THREE.Vector3();
        this.targetPosition = new THREE.Vector3();
        this.visionRange = 6;
        this.chaseRange = 10;
        this.lastKnownPlayerPosition = new THREE.Vector3();
        this.patrolPoints = [];
        this.currentPatrolIndex = 0;
        
        // Пошаговая система
        this.movePoints = 2;
        this.remainingMoves = 2;
        this.hasMoved = false;
        this.isActive = false;
        
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
    
    update(players) {
        if (!this.isActive) return;
        
        // Ищем ближайшего игрока
        const nearestPlayer = this.findNearestPlayer(players);
        
        if (nearestPlayer && this.position.distanceTo(nearestPlayer.position) < this.visionRange) {
            // Преследование игрока
            this.chasePlayer(nearestPlayer);
        } else {
            // Патрулирование
            this.patrol();
        }
        
        this.executeMove();
    }
    
    findNearestPlayer(players) {
        let nearestPlayer = null;
        let minDistance = Infinity;
        
        players.forEach(player => {
            const distance = this.position.distanceTo(player.position);
            if (distance < minDistance) {
                minDistance = distance;
                nearestPlayer = player;
            }
        });
        
        return nearestPlayer;
    }
    
    chasePlayer(player) {
        const direction = player.position.clone().sub(this.position).normalize();
        this.targetPosition = this.position.clone().add(direction.multiplyScalar(2));
        
        // Проверяем валидность позиции
        if (!this.isPositionValid(this.targetPosition)) {
            this.targetPosition.copy(this.position);
        }
    }
    
    patrol() {
        if (this.position.distanceTo(this.targetPosition) < 1.5) {
            this.setNextPatrolPoint();
        }
    }
    
    executeMove() {
        if (this.hasMoved) {
            this.position.copy(this.targetPosition);
            this.mesh.position.copy(this.position);
            this.hasMoved = false;
            
            // Анимация движения моба
            this.animateMove();
        }
    }
    
    animateMove() {
        const startPos = this.mesh.position.clone();
        const endPos = this.position.clone();
        const duration = 300;
        
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.mesh.position.lerpVectors(startPos, endPos, progress);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.mesh.position.copy(endPos);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    startTurn() {
        this.isActive = true;
        this.hasMoved = true;
        this.remainingMoves = this.movePoints;
    }
    
    endTurn() {
        this.isActive = false;
    }
    
    isPositionValid(position) {
        return Math.abs(position.x) <= 18 && Math.abs(position.z) <= 18;
    }
    
    onPlayerCaught() {
        console.log('💀 Игрок пойман!');
        document.dispatchEvent(new CustomEvent('playerCaught'));
    }
    
    getMesh() {
        return this.mesh;
    }
    
    getPosition() {
        return this.position.clone();
    }
    
    getState() {
        return this.hasMoved ? 'moved' : 'waiting';
    }
}
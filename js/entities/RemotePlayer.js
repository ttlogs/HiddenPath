class RemotePlayer {
    constructor(playerData) {
        this.id = playerData.id;
        this.position = new THREE.Vector3(
            playerData.position.x,
            playerData.position.y,
            playerData.position.z
        );
        this.direction = new THREE.Vector3(
            playerData.direction.x,
            playerData.direction.y,
            playerData.direction.z
        );
        this.color = playerData.color;
        this.mesh = this.createMesh();
        this.trailSystem = new TrailSystem(500);
    }
    
    createMesh() {
        const geometry = new THREE.SphereGeometry(0.3, 12, 12);
        const material = new THREE.MeshBasicMaterial({ 
            color: this.color,
            transparent: true,
            opacity: 0.7
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(this.position);
        
        // Добавляем имя игрока
        const nameLabel = this.createNameLabel();
        mesh.add(nameLabel);
        
        return mesh;
    }
    
    createNameLabel() {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 32;
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'rgba(0,0,0,0.5)';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.font = 'bold 14px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(`Игрок ${this.id}`, canvas.width/2, 20);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(2, 0.5, 1);
        sprite.position.y = 1.2;
        
        return sprite;
    }
    
    update(position, direction) {
        // Плавное перемещение
        this.position.lerp(new THREE.Vector3(
            position.x,
            position.y,
            position.z
        ), 0.3);
        
        this.direction.copy(new THREE.Vector3(
            direction.x,
            direction.y,
            direction.z
        ));
        
        this.mesh.position.copy(this.position);
        
        // Добавляем след
        this.trailSystem.addPoint(this.position.clone());
    }
    
    getMesh() {
        return this.mesh;
    }
    
    getTrailMesh() {
        return this.trailSystem.getMesh();
    }
    
    destroy() {
        // Очистка ресурсов
        this.trailSystem.clear();
    }
}
class RemotePlayer {
    constructor(playerData) {
        console.log('👥 Создание удаленного игрока:', playerData);

        this.id = playerData.id;
        this.position = new THREE.Vector3(
            playerData.position?.x || (Math.random() - 0.5) * 10,
            playerData.position?.y || 0.2,
            playerData.position?.z || (Math.random() - 0.5) * 10
        );

        // Сделаем игрока более заметным
        const geometry = new THREE.SphereGeometry(0.5, 16, 16); // Увеличили размер
        const material = new THREE.MeshBasicMaterial({
            color: playerData.color || 0xff6b6b,
            transparent: true,
            opacity: 0.9 // Сделали менее прозрачным
        });

        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.position);

        // Добавим имя над игроком
        this.addNameLabel(playerData.id);

        // Система следов
        this.trailSystem = new TrailSystem(500);

        console.log('✅ Удаленный игрок создан:', this.id, this.position);
    }

    addNameLabel(playerId) {
        // Простая текстура с именем
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');

        // Фон
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // Текст
        context.font = 'bold 24px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.fillText(`Игрок ${playerId.substr(7, 6)}`, canvas.width/2, 40);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

        const sprite = new THREE.Sprite(material);
        sprite.scale.set(3, 0.8, 1);
        sprite.position.y = 1.5; // Над головой игрока

        this.mesh.add(sprite);
    }

    update(position, direction) {
        console.log(`🔄 Обновление игрока ${this.id}:`, position);

        this.position.set(position.x, position.y, position.z);
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
        console.log(`🗑️ Удаление игрока ${this.id}`);
        if (this.trailSystem) {
            this.trailSystem.clear();
        }
    }
}
class TrailSystem {
    constructor(maxPoints = 2000) {
        this.maxPoints = maxPoints;
        this.points = [];
        this.mesh = this.createTrailMesh();
    }
    
    createTrailMesh() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.maxPoints * 3);
        const colors = new Float32Array(this.maxPoints * 3);
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.6,
            vertexColors: true,
            transparent: true,
            opacity: 0.8
        });
        
        return new THREE.Points(geometry, material);
    }
    
    addPoint(position) {
        if (this.points.length >= this.maxPoints) {
            this.points.shift();
        }
        
        this.points.push(position.clone());
        this.updateGeometry();
        
        return this.points.length;
    }
    
    updateGeometry() {
        const positions = this.mesh.geometry.attributes.position.array;
        const colors = this.mesh.geometry.attributes.color.array;
        
        this.points.forEach((point, index) => {
            const posIndex = index * 3;
            
            positions[posIndex] = point.x;
            positions[posIndex + 1] = 0.05;
            positions[posIndex + 2] = point.z;
            
            const colorIntensity = Math.min(1, index / 500);
            colors[posIndex] = 0.4 + colorIntensity * 0.3;
            colors[posIndex + 1] = 0.6 - colorIntensity * 0.2;
            colors[posIndex + 2] = 0.2;
        });
        
        this.mesh.geometry.attributes.position.needsUpdate = true;
        this.mesh.geometry.attributes.color.needsUpdate = true;
        this.mesh.geometry.setDrawRange(0, this.points.length);
    }
    
    getMesh() {
        return this.mesh;
    }
    
    getPointCount() {
        return this.points.length;
    }
    
    clear() {
        this.points = [];
        this.updateGeometry();
    }
}
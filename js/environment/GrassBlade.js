class GrassBlade {
    constructor() {
        this.geometry = new THREE.PlaneGeometry(0.15, 2.5);
        this.material = this.createMaterial();
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        
        this.init();
    }
    
    createMaterial() {
        const hue = 0.3 + Math.random() * 0.1;
        const saturation = 0.6 + Math.random() * 0.3;
        const lightness = 0.3 + Math.random() * 0.2;
        
        return new THREE.MeshLambertMaterial({ 
            color: new THREE.Color().setHSL(hue, saturation, lightness),
            side: THREE.DoubleSide
        });
    }
    
    init() {
        const scale = 0.8 + Math.random() * 0.6;
        this.mesh.scale.set(scale, scale, scale);
        
        this.mesh.rotation.x = (Math.random() - 0.5) * 0.4;
        this.mesh.rotation.z = (Math.random() - 0.5) * 0.2;
        this.mesh.rotation.y = Math.random() * Math.PI * 2;
        
        this.mesh.userData = {
            originalRotation: this.mesh.rotation.clone(),
            originalScale: this.mesh.scale.clone(),
            isBent: false,
            bendTime: 0,
            bendDirection: new THREE.Vector3()
        };
    }
    
    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
    
    bend(direction) {
        if (this.mesh.userData.isBent) return false;
        
        this.mesh.userData.bendDirection.copy(direction);
        this.mesh.rotation.x = -Math.PI / 3;
        this.mesh.rotation.z = Math.atan2(direction.y, direction.x) * 0.5;
        this.mesh.scale.y = 0.6;
        this.mesh.userData.isBent = true;
        this.mesh.userData.bendTime = 0;
        
        this.mesh.material.color.lerp(new THREE.Color(0x6b8e23), 0.7);
        
        return true;
    }
    
    restore() {
        if (!this.mesh.userData.isBent) return false;
        
        this.mesh.userData.bendTime++;
        
        if (this.mesh.userData.bendTime > 240) {
            const progress = (this.mesh.userData.bendTime - 240) / 60;
            
            if (progress < 1) {
                this.mesh.rotation.x = THREE.MathUtils.lerp(
                    this.mesh.rotation.x,
                    this.mesh.userData.originalRotation.x,
                    progress
                );
                
                this.mesh.rotation.z = THREE.MathUtils.lerp(
                    this.mesh.rotation.z,
                    this.mesh.userData.originalRotation.z,
                    progress
                );
                
                this.mesh.scale.y = THREE.MathUtils.lerp(
                    this.mesh.scale.y,
                    this.mesh.userData.originalScale.y,
                    progress
                );
            } else {
                this.mesh.userData.isBent = false;
                return true;
            }
        }
        
        return false;
    }
    
    getMesh() {
        return this.mesh;
    }
    
    isBent() {
        return this.mesh.userData.isBent;
    }
}
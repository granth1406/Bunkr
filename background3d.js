import * as THREE from 'https://unpkg.com/three@0.139.2/build/three.module.js';

class ParticleBackground {
    constructor() {
        this.particleCount = 100;
        this.particles = [];
        this.links = [];
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            alpha: true,
            antialias: true 
        });
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();
        this.clock = new THREE.Clock();
        
        this.colors = {
            light: new THREE.Color(0x0d6efd),
            dark: new THREE.Color(0x45B7D1),
            neon: new THREE.Color(0x00ff00)
        };

        this.geometries = new Set();
        this.materials = new Set();
        this.lineMaterials = new Set();
        this.lineGeometries = new Set();
        this.isDestroyed = false;
        
        this.init();
    }

    init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.domElement.style.position = 'fixed';
        this.renderer.domElement.style.top = '0';
        this.renderer.domElement.style.left = '0';
        this.renderer.domElement.style.zIndex = '-1';
        document.body.prepend(this.renderer.domElement);

        // Setup camera
        this.camera.position.z = 30;

        // Create particles
        this.createParticles();
        
        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        
        // Start animation
        this.animate();
    }

    createParticles() {
        const particleGeometry = new THREE.BufferGeometry();
        this.geometries.add(particleGeometry);
        const positions = new Float32Array(this.particleCount * 3);
        const velocities = [];

        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

            velocities.push({
                x: (Math.random() - 0.5) * 0.1,
                y: (Math.random() - 0.5) * 0.1,
                z: (Math.random() - 0.5) * 0.1
            });
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: this.colors.light,
            size: 0.5,
            transparent: true,
            opacity: 0.8
        });
        this.materials.add(particleMaterial);

        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
        this.velocities = velocities;
    }

    updateParticles() {
        if (this.isDestroyed) return;

        const positions = this.particles.geometry.attributes.position.array;
        const maxDistance = 10;

        // Clear old lines and their resources
        this.links.forEach(line => {
            this.scene.remove(line);
            if (line.geometry) {
                this.lineGeometries.delete(line.geometry);
                line.geometry.dispose();
            }
            if (line.material) {
                this.lineMaterials.delete(line.material);
                line.material.dispose();
            }
        });
        this.links = [];

        // Update particle positions
        for (let i = 0; i < this.particleCount; i++) {
            positions[i * 3] += this.velocities[i].x;
            positions[i * 3 + 1] += this.velocities[i].y;
            positions[i * 3 + 2] += this.velocities[i].z;

            // Boundary check
            if (Math.abs(positions[i * 3]) > 25) this.velocities[i].x *= -1;
            if (Math.abs(positions[i * 3 + 1]) > 25) this.velocities[i].y *= -1;
            if (Math.abs(positions[i * 3 + 2]) > 25) this.velocities[i].z *= -1;
        }

        // Create links between nearby particles
        for (let i = 0; i < this.particleCount; i++) {
            const p1 = new THREE.Vector3(
                positions[i * 3],
                positions[i * 3 + 1],
                positions[i * 3 + 2]
            );

            for (let j = i + 1; j < this.particleCount; j++) {
                const p2 = new THREE.Vector3(
                    positions[j * 3],
                    positions[j * 3 + 1],
                    positions[j * 3 + 2]
                );

                const distance = p1.distanceTo(p2);

                if (distance < maxDistance) {
                    const lineGeometry = new THREE.BufferGeometry().setFromPoints([p1, p2]);
                    this.lineGeometries.add(lineGeometry);
                    
                    const lineMaterial = new THREE.LineBasicMaterial({ 
                        color: this.particles.material.color,
                        transparent: true,
                        opacity: (1 - distance / maxDistance) * 0.4
                    });
                    this.lineMaterials.add(lineMaterial);
                    
                    const line = new THREE.Line(lineGeometry, lineMaterial);
                    this.scene.add(line);
                    this.links.push(line);
                }
            }
        }

        this.particles.geometry.attributes.position.needsUpdate = true;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    onMouseMove(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.scene.rotation.y = this.mouse.x * 0.1;
        this.scene.rotation.x = this.mouse.y * 0.1;
    }

    updateTheme(theme) {
        const color = this.colors[theme];
        this.particles.material.color = color;
        this.links.forEach(link => link.material.color = color);
    }

    cleanup() {
        this.isDestroyed = true;

        // Stop animation loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }

        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        window.removeEventListener('mousemove', this.onMouseMove.bind(this));

        // Dispose of particle resources
        if (this.particles) {
            if (this.particles.geometry) {
                this.particles.geometry.dispose();
            }
            if (this.particles.material) {
                this.particles.material.dispose();
            }
        }

        // Dispose of line resources
        this.lineGeometries.forEach(geometry => {
            geometry.dispose();
        });
        this.lineMaterials.forEach(material => {
            material.dispose();
        });

        // Clear arrays and sets
        this.links = [];
        this.velocities = [];
        this.geometries.clear();
        this.materials.clear();
        this.lineGeometries.clear();
        this.lineMaterials.clear();

        // Clear scene
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            this.scene.remove(object);
        }

        // Dispose of renderer
        if (this.renderer) {
            this.renderer.dispose();
            const canvas = this.renderer.domElement;
            if (canvas && canvas.parentNode) {
                canvas.parentNode.removeChild(canvas);
            }
        }

        // Clear references
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
    }

    animate() {
        if (this.isDestroyed) return;
        
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        this.updateParticles();
        this.renderer.render(this.scene, this.camera);
    }
}

// Create and export background instance
const background = new ParticleBackground();
export default background;
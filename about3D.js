import * as THREE from 'https://unpkg.com/three@0.139.2/build/three.module.js';

class About3D {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: document.getElementById('about3DCanvas'),
            alpha: true,
            antialias: true 
        });
        
        this.developers = [
            {
                name: "Alex Chen",
                role: "Frontend Developer",
                image: "https://avatars.githubusercontent.com/u/1?v=4" // Replace with actual image
            },
            {
                name: "Sarah Smith",
                role: "Backend Developer",
                image: "https://avatars.githubusercontent.com/u/2?v=4" // Replace with actual image
            },
            {
                name: "Mike Johnson",
                role: "UI/UX Designer",
                image: "https://avatars.githubusercontent.com/u/3?v=4" // Replace with actual image
            }
        ];
        
        this.cards = [];
        this.textures = new Set();
        this.materials = new Set();
        this.geometries = new Set();
        this.init();

        // Increase camera distance for better view
        this.camera.position.z = 20;
        
        // Increase card size
        this.cardSize = {
            width: 8,
            height: 12
        };
        
        // Increase rotation radius
        this.rotationRadius = 12;
        
        // Slow down rotation for better visibility
        this.rotationSpeed = 0.001;

        // Enhance lighting
        this.setupLighting();
    }

    init() {
        // Setup
        this.renderer.setSize(window.innerWidth * 0.8, 400);
        this.camera.position.z = 15;

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const pointLight = new THREE.PointLight(0xffffff, 1);
        pointLight.position.set(10, 10, 10);
        this.scene.add(ambientLight, pointLight);

        // Create developer cards
        this.createDeveloperCards();

        // Event listeners
        window.addEventListener('resize', () => this.onWindowResize());
        this.renderer.domElement.addEventListener('mousemove', (e) => this.onMouseMove(e));

        // Start animation
        this.animate();
    }

    setupLighting() {
        // Ambient light for overall scene brightness
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // Main directional light
        const mainLight = new THREE.DirectionalLight(0xffffff, 1);
        mainLight.position.set(10, 10, 10);
        this.scene.add(mainLight);

        // Additional point lights for dramatic effect
        const pointLight1 = new THREE.PointLight(0x0066ff, 1, 20);
        pointLight1.position.set(-10, 5, 5);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xff0066, 1, 20);
        pointLight2.position.set(10, -5, 5);
        this.scene.add(pointLight2);
    }

    createDeveloperCards() {
        const loader = new THREE.TextureLoader();
        
        this.developers.forEach((dev, i) => {
            // Create card geometry
            const geometry = new THREE.PlaneGeometry(5, 7);
            this.geometries.add(geometry);
            
            // Create material with developer info
            const canvas = this.createCardCanvas(dev);
            const texture = new THREE.CanvasTexture(canvas);
            this.textures.add(texture);
            
            const material = new THREE.MeshPhongMaterial({ 
                map: texture,
                transparent: true
            });
            this.materials.add(material);

            // Create card mesh
            const card = new THREE.Mesh(geometry, material);
            
            // Position card in circular arrangement
            const angle = (i / this.developers.length) * Math.PI * 2;
            const radius = 8;
            card.position.x = Math.cos(angle) * radius;
            card.position.y = Math.sin(angle) * radius;
            
            this.cards.push(card);
            this.scene.add(card);
        });

        // Increase material shininess and add reflectivity
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            shininess: 100,
            reflectivity: 1,
            transparent: true,
            opacity: 0.9
        });
    }

    createCardCanvas(developer) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 712;
        const ctx = canvas.getContext('2d');

        // Card background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Developer info
        ctx.fillStyle = '#000000';
        ctx.font = '48px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(developer.name, canvas.width/2, canvas.height - 200);
        
        ctx.font = '36px Inter';
        ctx.fillText(developer.role, canvas.width/2, canvas.height - 150);

        return canvas;
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth * 0.8, 400);
    }

    onMouseMove(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.scene.rotation.y = x * 0.5;
        this.scene.rotation.x = y * 0.2;
    }

    animate() {
        this.animationFrameId = requestAnimationFrame(() => this.animate());
        
        // Rotate cards slightly
        this.cards.forEach(card => {
            card.rotation.y += 0.005;
        });

        this.renderer.render(this.scene, this.camera);
    }

    // Add cleanup method
    cleanup() {
        // Stop animation loop
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Remove event listeners
        window.removeEventListener('resize', this.onWindowResize.bind(this));
        this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove.bind(this));

        // Dispose of geometries
        this.geometries.forEach(geometry => {
            geometry.dispose();
        });

        // Dispose of materials
        this.materials.forEach(material => {
            if (material.map) {
                material.map.dispose();
            }
            material.dispose();
        });

        // Dispose of textures
        this.textures.forEach(texture => {
            texture.dispose();
        });

        // Clear scene
        while(this.scene.children.length > 0) { 
            const object = this.scene.children[0];
            this.scene.remove(object);
        }

        // Dispose of renderer if it exists
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
        this.cards = [];
        this.geometries.clear();
        this.materials.clear();
        this.textures.clear();
    }
}

// Initialize when about section becomes visible
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting && !window.about3D) {
            window.about3D = new About3D();
        }
    });
});

observer.observe(document.getElementById('about'));
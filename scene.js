/* ============================================================
   THREE.JS  —  HERO 3D PC SCENE
   Procedural geometry PC with neon lighting & auto-rotate
   ============================================================ */

class HeroScene {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.pcGroup = null;
        this.animationId = null;
        this.clock = new THREE.Clock();

        this.init();
    }

    init() {
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        // Scene
        this.scene = new THREE.Scene();

        // Camera
        this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
        this.camera.position.set(6, 4, 6);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 0);
        this.container.appendChild(this.renderer.domElement);

        // Controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = true;
        this.controls.autoRotateSpeed = 1.2;
        this.controls.enableZoom = true;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 15;
        this.controls.enablePan = false;

        // Lights
        this.addLights();

        // PC Model
        this.createPC();

        // Event listeners
        window.addEventListener('resize', () => this.onResize());

        // Start animation
        this.animate();
    }

    addLights() {
        // Ambient
        const ambient = new THREE.AmbientLight(0x404060, 0.6);
        this.scene.add(ambient);

        // Key light
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
        dirLight.position.set(5, 8, 5);
        this.scene.add(dirLight);

        // Cyan accent
        const cyan = new THREE.PointLight(0x00d4ff, 1.2, 25);
        cyan.position.set(4, 3, 4);
        this.scene.add(cyan);

        // Purple accent
        const purple = new THREE.PointLight(0x7b2ff7, 0.9, 25);
        purple.position.set(-4, 2, -3);
        this.scene.add(purple);

        // Magenta fill
        const magenta = new THREE.PointLight(0xff2d95, 0.4, 20);
        magenta.position.set(0, -2, 5);
        this.scene.add(magenta);
    }

    /* ----- Material helpers ----- */
    mat(color, opts = {}) {
        return new THREE.MeshStandardMaterial({
            color,
            metalness: opts.metalness ?? 0.5,
            roughness: opts.roughness ?? 0.4,
            emissive: opts.emissive ?? 0x000000,
            emissiveIntensity: opts.emissiveIntensity ?? 0,
            transparent: opts.transparent ?? false,
            opacity: opts.opacity ?? 1,
            side: opts.side ?? THREE.FrontSide
        });
    }

    /* ----- Build the PC Group ----- */
    createPC() {
        this.pcGroup = new THREE.Group();

        this.createCase();
        this.createMotherboard();
        this.createCPU();
        this.createCPUCooler();
        this.createGPU();
        this.createRAM();
        this.createPSU();
        this.createSSD();

        this.scene.add(this.pcGroup);
    }

    createCase() {
        // Wireframe case
        const caseGeo = new THREE.BoxGeometry(4, 4.5, 2.2);
        const edges = new THREE.EdgesGeometry(caseGeo);
        const lineMat = new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.35 });
        const wireframe = new THREE.LineSegments(edges, lineMat);
        this.pcGroup.add(wireframe);

        // Glass side panel
        const glassGeo = new THREE.PlaneGeometry(4, 4.5);
        const glassMat = this.mat(0x0a1628, {
            transparent: true, opacity: 0.12,
            metalness: 0.9, roughness: 0.1,
            side: THREE.DoubleSide
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.set(0, 0, 1.1);
        this.pcGroup.add(glass);

        // Back panel (opaque)
        const backGeo = new THREE.PlaneGeometry(4, 4.5);
        const backMat = this.mat(0x111133, { side: THREE.DoubleSide });
        const back = new THREE.Mesh(backGeo, backMat);
        back.position.set(0, 0, -1.1);
        this.pcGroup.add(back);

        // Bottom panel
        const botGeo = new THREE.PlaneGeometry(4, 2.2);
        const botMat = this.mat(0x111133, { side: THREE.DoubleSide });
        const bot = new THREE.Mesh(botGeo, botMat);
        bot.rotation.x = Math.PI / 2;
        bot.position.set(0, -2.25, 0);
        this.pcGroup.add(bot);
    }

    createMotherboard() {
        // Main PCB
        const pcbGeo = new THREE.BoxGeometry(3, 3.4, 0.08);
        const pcbMat = this.mat(0x0a3a0a, { roughness: 0.7, metalness: 0.2 });
        const pcb = new THREE.Mesh(pcbGeo, pcbMat);
        pcb.position.set(-0.2, 0.1, -0.9);
        this.pcGroup.add(pcb);

        // Circuit traces (decorative lines)
        const traceMat = new THREE.LineBasicMaterial({ color: 0x1a6b1a, transparent: true, opacity: 0.6 });
        for (let i = 0; i < 8; i++) {
            const points = [
                new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2.5, 0),
                new THREE.Vector3(-1 + Math.random() * 2, -1 + Math.random() * 2.5, 0)
            ];
            const traceGeo = new THREE.BufferGeometry().setFromPoints(points);
            const trace = new THREE.Line(traceGeo, traceMat);
            trace.position.set(-0.2, 0.1, -0.84);
            this.pcGroup.add(trace);
        }

        // CPU socket area
        const socketGeo = new THREE.BoxGeometry(0.6, 0.6, 0.04);
        const socketMat = this.mat(0x222244, { metalness: 0.7 });
        const socket = new THREE.Mesh(socketGeo, socketMat);
        socket.position.set(0.2, 0.8, -0.83);
        this.pcGroup.add(socket);

        // RAM slots
        for (let i = 0; i < 4; i++) {
            const slotGeo = new THREE.BoxGeometry(0.08, 1.2, 0.03);
            const slotMat = this.mat(0x333355);
            const slot = new THREE.Mesh(slotGeo, slotMat);
            slot.position.set(0.9 + i * 0.12, 0.8, -0.84);
            this.pcGroup.add(slot);
        }

        // PCIe slots
        for (let i = 0; i < 3; i++) {
            const slotGeo = new THREE.BoxGeometry(1.2, 0.06, 0.04);
            const slotMat = this.mat(0x333355);
            const slot = new THREE.Mesh(slotGeo, slotMat);
            slot.position.set(0, -0.5 - i * 0.4, -0.84);
            this.pcGroup.add(slot);
        }

        // I/O shield area
        const ioGeo = new THREE.BoxGeometry(0.15, 1.2, 0.04);
        const ioMat = this.mat(0x444466, { metalness: 0.8 });
        const io = new THREE.Mesh(ioGeo, ioMat);
        io.position.set(-1.55, 0.8, -0.84);
        this.pcGroup.add(io);

        // VRM heatsinks
        for (let i = 0; i < 3; i++) {
            const heatGeo = new THREE.BoxGeometry(0.2, 0.12, 0.15);
            const heatMat = this.mat(0x555577, { metalness: 0.7 });
            const heat = new THREE.Mesh(heatGeo, heatMat);
            heat.position.set(-0.9 + i * 0.3, 1.5, -0.84);
            this.pcGroup.add(heat);
        }
    }

    createCPU() {
        // IHS (integrated heat spreader)
        const cpuGeo = new THREE.BoxGeometry(0.45, 0.45, 0.06);
        const cpuMat = this.mat(0xaaaacc, { metalness: 0.85, roughness: 0.15 });
        const cpu = new THREE.Mesh(cpuGeo, cpuMat);
        cpu.position.set(0.2, 0.8, -0.78);
        cpu.userData = { name: 'CPU', floatOffset: 0 };
        this.pcGroup.add(cpu);
    }

    createCPUCooler() {
        const coolerGroup = new THREE.Group();

        // Heatsink fins
        const finMat = this.mat(0x888899, { metalness: 0.7, roughness: 0.3 });
        for (let i = 0; i < 12; i++) {
            const finGeo = new THREE.BoxGeometry(0.5, 0.03, 0.5);
            const fin = new THREE.Mesh(finGeo, finMat);
            fin.position.y = i * 0.06;
            coolerGroup.add(fin);
        }

        // Fan housing
        const fanGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.08, 16);
        const fanMat = this.mat(0x222240, { transparent: true, opacity: 0.8 });
        const fan = new THREE.Mesh(fanGeo, fanMat);
        fan.rotation.x = Math.PI / 2;
        fan.position.set(0, 0.35, 0.3);
        coolerGroup.add(fan);

        // Fan blades
        const bladeMat = this.mat(0x444466);
        for (let i = 0; i < 5; i++) {
            const bladeGeo = new THREE.BoxGeometry(0.22, 0.01, 0.06);
            const blade = new THREE.Mesh(bladeGeo, bladeMat);
            blade.rotation.y = (i / 5) * Math.PI;
            blade.position.set(0, 0.35, 0.3);
            coolerGroup.add(blade);
        }

        coolerGroup.position.set(0.2, 1.05, -0.65);
        coolerGroup.userData = { name: 'Cooler' };
        this.pcGroup.add(coolerGroup);
    }

    createGPU() {
        const gpuGroup = new THREE.Group();

        // PCB
        const pcbGeo = new THREE.BoxGeometry(1.8, 0.06, 0.6);
        const pcbMat = this.mat(0x0a0a2a);
        const pcb = new THREE.Mesh(pcbGeo, pcbMat);
        gpuGroup.add(pcb);

        // Shroud (backplate)
        const shroudGeo = new THREE.BoxGeometry(1.85, 0.04, 0.65);
        const shroudMat = this.mat(0x1a1a3a, { metalness: 0.6 });
        const shroud = new THREE.Mesh(shroudGeo, shroudMat);
        shroud.position.y = -0.05;
        gpuGroup.add(shroud);

        // Fan 1
        const fan1Geo = new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16);
        const fanMat = this.mat(0x222244);
        const fan1 = new THREE.Mesh(fan1Geo, fanMat);
        fan1.position.set(-0.4, 0.05, 0);
        gpuGroup.add(fan1);

        // Fan 2
        const fan2 = fan1.clone();
        fan2.position.set(0.4, 0.05, 0);
        gpuGroup.add(fan2);

        // RGB strip
        const rgbGeo = new THREE.BoxGeometry(1.6, 0.02, 0.03);
        const rgbMat = this.mat(0x00d4ff, {
            emissive: 0x00d4ff,
            emissiveIntensity: 0.8,
            metalness: 0
        });
        const rgb = new THREE.Mesh(rgbGeo, rgbMat);
        rgb.position.set(0, 0.04, 0.32);
        gpuGroup.add(rgb);

        gpuGroup.position.set(0, -0.5, -0.4);
        gpuGroup.userData = { name: 'GPU' };
        this.pcGroup.add(gpuGroup);
    }

    createRAM() {
        const ramMat = this.mat(0x1a1a3a, { metalness: 0.5 });
        const rgbColors = [0x00d4ff, 0x7b2ff7, 0x00d4ff, 0x7b2ff7];

        for (let i = 0; i < 2; i++) {
            const ramGroup = new THREE.Group();

            // PCB stick
            const stickGeo = new THREE.BoxGeometry(0.06, 0.9, 0.3);
            const stick = new THREE.Mesh(stickGeo, ramMat);
            ramGroup.add(stick);

            // Heatspreader
            const hsGeo = new THREE.BoxGeometry(0.065, 0.95, 0.32);
            const hsMat = this.mat(0x252545, { metalness: 0.6 });
            const hs = new THREE.Mesh(hsGeo, hsMat);
            ramGroup.add(hs);

            // RGB top strip
            const rgbGeo = new THREE.BoxGeometry(0.07, 0.04, 0.3);
            const rgbMat = this.mat(rgbColors[i], {
                emissive: rgbColors[i],
                emissiveIntensity: 0.6,
                metalness: 0
            });
            const rgb = new THREE.Mesh(rgbGeo, rgbMat);
            rgb.position.y = 0.49;
            ramGroup.add(rgb);

            ramGroup.position.set(0.95 + i * 0.14, 0.8, -0.84);
            ramGroup.userData = { name: 'RAM' };
            this.pcGroup.add(ramGroup);
        }
    }

    createPSU() {
        const psuGroup = new THREE.Group();

        // Box
        const boxGeo = new THREE.BoxGeometry(1.4, 0.7, 0.9);
        const boxMat = this.mat(0x1a1a2a, { metalness: 0.4, roughness: 0.6 });
        const box = new THREE.Mesh(boxGeo, boxMat);
        psuGroup.add(box);

        // Fan grill (circle)
        const grillGeo = new THREE.RingGeometry(0.15, 0.3, 16);
        const grillMat = this.mat(0x333355, { side: THREE.DoubleSide });
        const grill = new THREE.Mesh(grillGeo, grillMat);
        grill.rotation.x = Math.PI / 2;
        grill.position.y = 0.36;
        psuGroup.add(grill);

        // Label
        const labelGeo = new THREE.BoxGeometry(0.6, 0.01, 0.3);
        const labelMat = this.mat(0x00d4ff, {
            emissive: 0x00d4ff,
            emissiveIntensity: 0.3,
            metalness: 0
        });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(0, -0.36, 0);
        psuGroup.add(label);

        psuGroup.position.set(-0.5, -1.6, 0);
        psuGroup.userData = { name: 'PSU' };
        this.pcGroup.add(psuGroup);
    }

    createSSD() {
        const ssdGroup = new THREE.Group();

        // Body
        const bodyGeo = new THREE.BoxGeometry(0.6, 0.08, 0.35);
        const bodyMat = this.mat(0x222244, { metalness: 0.5 });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        ssdGroup.add(body);

        // Label
        const labelGeo = new THREE.BoxGeometry(0.3, 0.01, 0.15);
        const labelMat = this.mat(0x7b2ff7, {
            emissive: 0x7b2ff7,
            emissiveIntensity: 0.5,
            metalness: 0
        });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.y = 0.045;
        ssdGroup.add(label);

        ssdGroup.position.set(1.2, -1.2, -0.5);
        ssdGroup.userData = { name: 'SSD' };
        this.pcGroup.add(ssdGroup);
    }

    /* ----- Animation Loop ----- */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const t = this.clock.getElapsedTime();

        // Subtle float for the whole PC
        if (this.pcGroup) {
            this.pcGroup.position.y = Math.sin(t * 0.5) * 0.08;
        }

        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onResize() {
        if (!this.container) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (this.camera) {
            this.camera.aspect = w / h;
            this.camera.updateProjectionMatrix();
        }
        if (this.renderer) {
            this.renderer.setSize(w, h);
        }
    }

    dispose() {
        cancelAnimationFrame(this.animationId);
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

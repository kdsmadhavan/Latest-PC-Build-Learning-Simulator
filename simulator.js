/* ============================================================
   PC BUILD SIMULATOR ENGINE
   Step-by-step 3D PC assembly with progress & achievements
   ============================================================ */

class PCSimulator {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.animationId = null;
        this.clock = new THREE.Clock();

        this.caseGroup = null;
        this.componentMeshes = {};
        this.installedComponents = new Set();
        this.currentStep = 0;
        this.isGuided = false;
        this.buildStartTime = null;
        this.isInitialized = false;

        // Component definitions
        this.components = [
            {
                id: 'case', name: 'PC Case', icon: 'fa-box',
                desc: 'The PC case houses all your components. It provides structural support, airflow management, and protection.',
                specs: { 'Form Factor': 'Mid Tower ATX', 'Material': 'Steel + Tempered Glass', 'Fan Slots': '6 × 120mm', 'Drive Bays': '2 × 3.5" + 2 × 2.5"' },
                tip: 'Always install the case standoffs before mounting the motherboard to prevent short circuits.',
                position: { x: 0, y: 0, z: 0 },
                color: 0x00d4ff
            },
            {
                id: 'psu', name: 'Power Supply (PSU)', icon: 'fa-plug',
                desc: 'The PSU converts AC power from your wall outlet to the DC power your components need. A reliable PSU is crucial.',
                specs: { 'Wattage': '750W 80+ Gold', 'Modularity': 'Fully Modular', 'Fan Size': '120mm', 'Connectors': '24-pin, EPS, PCIe, SATA' },
                tip: 'Calculate your total system power draw and add 20% headroom when choosing a PSU.',
                position: { x: -0.5, y: -1.6, z: 0 },
                color: 0xff8800
            },
            {
                id: 'motherboard', name: 'Motherboard', icon: 'fa-server',
                desc: 'The motherboard is the main circuit board that connects all components together. Choose one compatible with your CPU.',
                specs: { 'Socket': 'LGA 1700 / AM5', 'Chipset': 'Z790 / X670E', 'RAM Slots': '4 × DDR5', 'PCIe Slots': '1 × x16, 2 × x4' },
                tip: 'Install the I/O shield in the case BEFORE mounting the motherboard.',
                position: { x: -0.2, y: 0.1, z: -0.9 },
                color: 0x00aa44
            },
            {
                id: 'cpu', name: 'Processor (CPU)', icon: 'fa-microchip',
                desc: 'The CPU is the brain of your computer — it executes every instruction. Handle with extreme care.',
                specs: { 'Cores / Threads': '16 / 32', 'Base Clock': '3.4 GHz', 'Boost Clock': '5.8 GHz', 'TDP': '125W' },
                tip: 'Align the golden triangle on the CPU with the triangle on the socket. Never force the CPU in.',
                position: { x: 0.2, y: 0.8, z: -0.78 },
                color: 0x4488ff
            },
            {
                id: 'cooler', name: 'CPU Cooler', icon: 'fa-fan',
                desc: 'The CPU cooler dissipates heat from the processor. Without it, your CPU would overheat in seconds.',
                specs: { 'Type': 'Tower Air Cooler', 'Fan Size': '120mm × 2', 'Height': '158mm', 'TDP Rating': '250W' },
                tip: 'Apply a pea-sized dot of thermal paste to the center of the CPU before mounting the cooler.',
                position: { x: 0.2, y: 1.3, z: -0.65 },
                color: 0x888899
            },
            {
                id: 'ram', name: 'Memory (RAM)', icon: 'fa-memory',
                desc: 'RAM provides fast temporary storage for active tasks. More RAM means smoother multitasking.',
                specs: { 'Capacity': '32GB (2 × 16GB)', 'Speed': 'DDR5-6000', 'Latency': 'CL36', 'Voltage': '1.35V' },
                tip: 'Install RAM in alternating slots (A2 and B2) for dual-channel mode — check your motherboard manual.',
                position: { x: 0.95, y: 0.8, z: -0.84 },
                color: 0x7b2ff7
            },
            {
                id: 'gpu', name: 'Graphics Card (GPU)', icon: 'fa-tv',
                desc: 'The GPU handles all visual processing — games, video editing, 3D rendering, and AI workloads.',
                specs: { 'VRAM': '16GB GDDR6X', 'Boost Clock': '2.52 GHz', 'CUDA Cores': '16,384', 'TDP': '320W' },
                tip: 'Make sure the PCIe power cables are fully seated. A loose cable is the #1 cause of GPU issues.',
                position: { x: 0, y: -0.5, z: -0.4 },
                color: 0xff2d95
            },
            {
                id: 'storage', name: 'Storage (NVMe SSD)', icon: 'fa-hard-drive',
                desc: 'NVMe SSDs provide blazing fast read/write speeds for your OS, games, and files.',
                specs: { 'Capacity': '2TB', 'Read Speed': '7,300 MB/s', 'Write Speed': '6,900 MB/s', 'Interface': 'PCIe Gen 5 × 4' },
                tip: 'Install your OS on the NVMe drive for the fastest boot times. Add a SATA SSD for bulk storage.',
                position: { x: 1.2, y: -1.2, z: -0.5 },
                color: 0xffaa00
            }
        ];

        // Build step instructions
        this.buildSteps = [
            { componentId: 'case', instruction: 'Start by preparing the PC case. Remove the side panels and lay the case flat for easier installation.' },
            { componentId: 'psu', instruction: 'Install the Power Supply Unit (PSU) at the bottom of the case. Route the cables through the back for clean cable management.' },
            { componentId: 'motherboard', instruction: 'Mount the motherboard onto the standoffs inside the case. Align the I/O ports with the I/O shield at the back.' },
            { componentId: 'cpu', instruction: 'Carefully install the CPU into the motherboard socket. Align the golden triangle and gently lower it — never force it!' },
            { componentId: 'cooler', instruction: 'Apply thermal paste and mount the CPU cooler. Ensure even mounting pressure on all sides.' },
            { componentId: 'ram', instruction: 'Install the RAM sticks into the motherboard slots. Push firmly until both clips snap into place.' },
            { componentId: 'gpu', instruction: 'Insert the GPU into the top PCIe x16 slot. Press firmly until the retention clip clicks, then secure the bracket.' },
            { componentId: 'storage', instruction: 'Install the NVMe SSD into the M.2 slot on the motherboard. Secure with the mounting screw.' }
        ];
    }

    /* ---- Initialize 3D Scene ---- */
    initScene() {
        if (this.isInitialized) return;

        const w = this.container.clientWidth;
        const h = this.container.clientHeight;

        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x050510, 0.035);

        this.camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 100);
        this.camera.position.set(7, 5, 7);

        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x050510, 0.9);
        this.container.appendChild(this.renderer.domElement);

        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.autoRotate = false;
        this.controls.enableZoom = true;
        this.controls.minDistance = 4;
        this.controls.maxDistance = 18;

        this.addLights();
        this.createGrid();
        this.createComponentMeshes();

        window.addEventListener('resize', () => this.onResize());

        this.isInitialized = true;
        this.animate();
    }

    addLights() {
        this.scene.add(new THREE.AmbientLight(0x404060, 0.5));

        const dir = new THREE.DirectionalLight(0xffffff, 0.6);
        dir.position.set(5, 8, 5);
        this.scene.add(dir);

        const cyan = new THREE.PointLight(0x00d4ff, 1, 30);
        cyan.position.set(5, 4, 5);
        this.scene.add(cyan);

        const purple = new THREE.PointLight(0x7b2ff7, 0.7, 25);
        purple.position.set(-5, 3, -4);
        this.scene.add(purple);
    }

    createGrid() {
        const gridHelper = new THREE.GridHelper(20, 40, 0x111133, 0x0a0a22);
        gridHelper.position.y = -2.5;
        this.scene.add(gridHelper);
    }

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

    /* ---- Create 3D component meshes (initially hidden above) ---- */
    createComponentMeshes() {
        this.components.forEach(comp => {
            let mesh;

            switch (comp.id) {
                case 'case':
                    mesh = this.buildCaseMesh();
                    break;
                case 'psu':
                    mesh = this.buildPSUMesh(comp.color);
                    break;
                case 'motherboard':
                    mesh = this.buildMotherboardMesh();
                    break;
                case 'cpu':
                    mesh = this.buildCPUMesh();
                    break;
                case 'cooler':
                    mesh = this.buildCoolerMesh();
                    break;
                case 'ram':
                    mesh = this.buildRAMMesh(comp.color);
                    break;
                case 'gpu':
                    mesh = this.buildGPUMesh(comp.color);
                    break;
                case 'storage':
                    mesh = this.buildStorageMesh(comp.color);
                    break;
                default:
                    const geo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
                    mesh = new THREE.Mesh(geo, this.mat(comp.color));
            }

            // Start hidden (far above)
            mesh.position.set(comp.position.x, comp.position.y + 8, comp.position.z);
            mesh.visible = false;
            mesh.userData = { componentId: comp.id };

            this.scene.add(mesh);
            this.componentMeshes[comp.id] = mesh;
        });
    }

    buildCaseMesh() {
        const group = new THREE.Group();
        const caseGeo = new THREE.BoxGeometry(4, 4.5, 2.2);
        const edges = new THREE.EdgesGeometry(caseGeo);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x00d4ff, transparent: true, opacity: 0.4 }));
        group.add(line);

        // Glass panel
        const glassGeo = new THREE.PlaneGeometry(4, 4.5);
        const glass = new THREE.Mesh(glassGeo, this.mat(0x0a1628, { transparent: true, opacity: 0.1, side: THREE.DoubleSide }));
        glass.position.set(0, 0, 1.1);
        group.add(glass);

        // Back + bottom panels
        const panelMat = this.mat(0x111133, { side: THREE.DoubleSide });
        const back = new THREE.Mesh(new THREE.PlaneGeometry(4, 4.5), panelMat);
        back.position.z = -1.1;
        group.add(back);
        const bot = new THREE.Mesh(new THREE.PlaneGeometry(4, 2.2), panelMat);
        bot.rotation.x = Math.PI / 2; bot.position.y = -2.25;
        group.add(bot);

        return group;
    }

    buildPSUMesh(color) {
        const group = new THREE.Group();
        const box = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.7, 0.9), this.mat(0x1a1a2a, { metalness: 0.4 }));
        group.add(box);
        const label = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.01, 0.3), this.mat(color, { emissive: color, emissiveIntensity: 0.4, metalness: 0 }));
        label.position.y = -0.36;
        group.add(label);
        return group;
    }

    buildMotherboardMesh() {
        const group = new THREE.Group();
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(3, 3.4, 0.08), this.mat(0x0a3a0a, { roughness: 0.7, metalness: 0.2 }));
        group.add(pcb);
        // slots
        for (let i = 0; i < 4; i++) {
            const slot = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.2, 0.03), this.mat(0x333355));
            slot.position.set(1.1 + i * 0.12, 0.7, 0.06);
            group.add(slot);
        }
        for (let i = 0; i < 3; i++) {
            const pcie = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.06, 0.04), this.mat(0x333355));
            pcie.position.set(0.2, -0.6 - i * 0.4, 0.06);
            group.add(pcie);
        }
        return group;
    }

    buildCPUMesh() {
        const group = new THREE.Group();
        const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.45, 0.45, 0.06), this.mat(0xaaaacc, { metalness: 0.85, roughness: 0.15 }));
        group.add(ihs);
        // Gold contacts
        const contacts = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.4, 0.01), this.mat(0xddaa44, { metalness: 0.9 }));
        contacts.position.z = -0.035;
        group.add(contacts);
        return group;
    }

    buildCoolerMesh() {
        const group = new THREE.Group();
        const finMat = this.mat(0x888899, { metalness: 0.7 });
        for (let i = 0; i < 10; i++) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.5), finMat);
            fin.position.y = i * 0.06;
            group.add(fin);
        }
        const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.06, 16), this.mat(0x222240, { transparent: true, opacity: 0.7 }));
        fan.rotation.x = Math.PI / 2;
        fan.position.set(0, 0.3, 0.28);
        group.add(fan);
        return group;
    }

    buildRAMMesh(color) {
        const group = new THREE.Group();
        for (let i = 0; i < 2; i++) {
            const stick = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.95, 0.32), this.mat(0x252545, { metalness: 0.6 }));
            stick.position.x = i * 0.14;
            group.add(stick);
            const rgb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.3), this.mat(color, { emissive: color, emissiveIntensity: 0.6, metalness: 0 }));
            rgb.position.set(i * 0.14, 0.49, 0);
            group.add(rgb);
        }
        return group;
    }

    buildGPUMesh(color) {
        const group = new THREE.Group();
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.06, 0.6), this.mat(0x0a0a2a));
        group.add(pcb);
        const shroud = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.04, 0.65), this.mat(0x1a1a3a, { metalness: 0.6 }));
        shroud.position.y = -0.05;
        group.add(shroud);
        const fan1 = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.04, 16), this.mat(0x222244));
        fan1.position.set(-0.4, 0.05, 0);
        group.add(fan1);
        const fan2 = fan1.clone();
        fan2.position.set(0.4, 0.05, 0);
        group.add(fan2);
        const rgb = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.02, 0.03), this.mat(color, { emissive: color, emissiveIntensity: 0.8, metalness: 0 }));
        rgb.position.set(0, 0.04, 0.32);
        group.add(rgb);
        return group;
    }

    buildStorageMesh(color) {
        const group = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.35), this.mat(0x222244, { metalness: 0.5 }));
        group.add(body);
        const label = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.01, 0.15), this.mat(color, { emissive: color, emissiveIntensity: 0.5, metalness: 0 }));
        label.position.y = 0.045;
        group.add(label);
        return group;
    }

    /* ---- Install a component ---- */
    installComponent(componentId, callback) {
        if (this.installedComponents.has(componentId)) return;

        const mesh = this.componentMeshes[componentId];
        const comp = this.components.find(c => c.id === componentId);
        if (!mesh || !comp) return;

        mesh.visible = true;

        // Animate from above to target position
        const targetY = comp.position.y;
        mesh.position.set(comp.position.x, targetY + 6, comp.position.z);

        const startTime = performance.now();
        const duration = 1200;

        const animateIn = (now) => {
            const elapsed = now - startTime;
            const t = Math.min(elapsed / duration, 1);

            // Ease out bounce
            const ease = t < 0.5
                ? 4 * t * t * t
                : 1 - Math.pow(-2 * t + 2, 3) / 2;

            mesh.position.y = targetY + 6 * (1 - ease);

            if (mesh.rotation) {
                mesh.rotation.y = (1 - ease) * Math.PI * 0.5;
            }

            if (t < 1) {
                requestAnimationFrame(animateIn);
            } else {
                mesh.position.y = targetY;
                mesh.rotation.y = 0;
                this.installedComponents.add(componentId);
                if (callback) callback();
            }
        };

        requestAnimationFrame(animateIn);
    }

    /* ---- Uninstall all ---- */
    resetBuild() {
        this.installedComponents.clear();
        this.currentStep = 0;
        this.isGuided = false;
        this.buildStartTime = null;

        Object.values(this.componentMeshes).forEach(mesh => {
            mesh.visible = false;
            mesh.position.y += 8;
        });
    }

    /* ---- Start guided build ---- */
    startGuidedBuild() {
        this.resetBuild();
        this.isGuided = true;
        this.currentStep = 0;
        this.buildStartTime = Date.now();
        return this.buildSteps[0];
    }

    /* ---- Advance guided build ---- */
    advanceStep() {
        if (this.currentStep < this.buildSteps.length - 1) {
            this.currentStep++;
            return this.buildSteps[this.currentStep];
        }
        return null; // build complete
    }

    getCurrentStep() {
        return this.buildSteps[this.currentStep] || null;
    }

    getBuildProgress() {
        return this.installedComponents.size / this.components.length;
    }

    getBuildTime() {
        if (!this.buildStartTime) return 0;
        return Math.floor((Date.now() - this.buildStartTime) / 1000);
    }

    isBuildComplete() {
        return this.installedComponents.size === this.components.length;
    }

    /* ---- Viewport controls ---- */
    zoomIn() {
        if (this.camera) {
            this.camera.position.multiplyScalar(0.9);
        }
    }

    zoomOut() {
        if (this.camera) {
            this.camera.position.multiplyScalar(1.1);
        }
    }

    toggleAutoRotate() {
        if (this.controls) {
            this.controls.autoRotate = !this.controls.autoRotate;
            return this.controls.autoRotate;
        }
        return false;
    }

    resetView() {
        if (this.camera) {
            this.camera.position.set(7, 5, 7);
        }
        if (this.controls) {
            this.controls.target.set(0, 0, 0);
        }
    }

    /* ---- Animation ---- */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());

        const t = this.clock.getElapsedTime();

        // Subtle pulse on installed components' emissive elements
        this.installedComponents.forEach(id => {
            const mesh = this.componentMeshes[id];
            if (mesh && mesh.children) {
                mesh.children.forEach(child => {
                    if (child.material && child.material.emissiveIntensity > 0) {
                        child.material.emissiveIntensity = 0.4 + Math.sin(t * 2) * 0.2;
                    }
                });
            }
        });

        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onResize() {
        if (!this.container) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w === 0 || h === 0) return;
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
        if (this.renderer) this.renderer.dispose();
    }
}

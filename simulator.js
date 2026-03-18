/* ============================================================
   PC BUILD SIMULATOR — PROFESSIONAL v3.0
   Fully Interactive 3D PC Case, OrbitControls, Camera Buttons,
   Component Hover/Click, Assembly Simulation, Tooltips
   ============================================================ */
class PCSimulator {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        if (!this.container) return;

        this.scene = this.camera = this.renderer = this.controls = null;
        this.animationId = null;
        this.clock = new THREE.Clock();
        this.componentMeshes  = {};   // id -> mesh/group in sidebar (floating)
        this.installedMeshes  = {};   // id -> mesh/group snapped inside case
        this.installedComponents = new Set();
        this.hoveredMesh   = null;
        this.selectedMesh  = null;
        this.raycaster     = new THREE.Raycaster();
        this.mouse         = new THREE.Vector2();
        this.currentStep   = 0;
        this.isGuided      = false;
        this.buildStartTime = null;
        this.isInitialized = false;
        this._building     = false;

        // Case state
        this.caseOpen      = false;
        this.sidePanelMesh = null;
        this.sidePanelTargetRot = 0;

        // Tooltip DOM
        this.tooltip = this._createTooltip();

        // Spin refs for fans
        this._spinMeshes = [];

        this.components = [
            { id:'motherboard', name:'ATX Motherboard',       category:'motherboard',  icon:'fa-server',           color:0x00cc55,  slotPos:{x:0,y:0.05,z:-0.3},   desc:'Main circuit board connecting all components.',  specs:{'Socket':'LGA 1700 / AM5','Chipset':'Z790','RAM Slots':'4×DDR5','M.2 Slots':'3×PCIe 4.0'}, tip:'Install the I/O shield in the case BEFORE mounting the motherboard.' },
            { id:'cpu',         name:'Processor (CPU)',        category:'cpu',          icon:'fa-microchip',        color:0x4499ff,  slotPos:{x:0,y:0.7,z:-0.3},    desc:'The brains — executes every instruction.',        specs:{'Cores/Threads':'16/32','Base Clock':'3.4 GHz','Boost Clock':'5.8 GHz','TDP':'125W'}, tip:'Align the golden triangle on the CPU with the socket marker.' },
            { id:'ram',         name:'DDR5 RAM (32GB)',        category:'memory',       icon:'fa-memory',           color:0x9933ff,  slotPos:{x:0.55,y:0.7,z:-0.3}, desc:'Fast temporary working memory.',                 specs:{'Capacity':'32GB (2×16GB)','Speed':'DDR5-6000','Latency':'CL36','Voltage':'1.35V'}, tip:'Install in A2+B2 slots for dual-channel.' },
            { id:'gpu',         name:'Graphics Card (GPU)',   category:'graphics',     icon:'fa-tv',               color:0xff2d95,  slotPos:{x:0,y:-0.35,z:-0.15}, desc:'Handles all visual processing.',                 specs:{'VRAM':'16GB GDDR6X','Boost Clock':'2.52 GHz','TDP':'320W'}, tip:'Seat firmly until the PCIe retention clip clicks.' },
            { id:'psu',         name:'Power Supply (PSU)',    category:'power',        icon:'fa-plug',             color:0xff8800,  slotPos:{x:0,y:-1.1,z:0.35},    desc:'Converts AC wall power to regulated DC.',        specs:{'Wattage':'750W','Modularity':'Fully Modular','Efficiency':'80+ Gold'}, tip:'Add 20% headroom over your total system draw.' },
            { id:'storage',     name:'NVMe SSD (M.2)',        category:'storage',      icon:'fa-hard-drive',       color:0xffcc00,  slotPos:{x:0.4,y:0.1,z:-0.3},  desc:'PCIe Gen 4 M.2 SSD — fastest storage available.',specs:{'Capacity':'2TB','Read':'7300 MB/s','Write':'6900 MB/s'}, tip:'Install OS here for fastest boot.' },
            { id:'hdd',         name:'Hard Drive (HDD)',      category:'storage',      icon:'fa-hard-drive',       color:0xcc7700,  slotPos:{x:0,y:-0.7,z:0.35},    desc:'Spinning magnetic disk. Highest capacity per dollar.',specs:{'Capacity':'4TB','RPM':'7200','Cache':'256MB'}, tip:'Secure with 4 screws to reduce vibration noise.' },
            { id:'cooler',      name:'CPU Cooler (Air)',      category:'cooling',      icon:'fa-fan',              color:0xaaaacc,  slotPos:{x:0,y:1.35,z:-0.25},  desc:'Tower air cooler with dual 120mm fans.',         specs:{'Type':'Tower Air','Fans':'2×120mm','TDP Rating':'250W'}, tip:'Apply thermal paste before mounting.' },
            { id:'casefan',     name:'Case Fans (120mm)',     category:'cooling',      icon:'fa-fan',              color:0x22aaff,  slotPos:{x:-0.95,y:0.5,z:0.1}, desc:'Moves air through case.',                        specs:{'Size':'3×120mm','Speed':'1800 RPM','Airflow':'60 CFM'}, tip:'Aim for positive pressure (more intake than exhaust).' },
        ];

        this.buildSteps = [
            { componentId:'motherboard', instruction:'Step 1 — Mount the ATX motherboard onto standoffs. Align I/O with the shield.' },
            { componentId:'cpu',         instruction:'Step 2 — Open the socket lever, align CPU golden triangle, and lower gently.' },
            { componentId:'ram',         instruction:'Step 3 — Insert RAM into slots A2+B2. Push until both clips click shut.' },
            { componentId:'storage',     instruction:'Step 4 — Slot the NVMe SSD at 30° into M.2 slot and secure with screw.' },
            { componentId:'gpu',         instruction:'Step 5 — Insert GPU into the top PCIe x16 slot until retention clip latches.' },
            { componentId:'psu',         instruction:'Step 6 — Install the PSU at the bottom. Orient fan-side down if bottom-vented.' },
            { componentId:'hdd',         instruction:'Step 7 — Mount the HDD in a drive bay. Connect SATA data + power cables.' },
            { componentId:'cooler',      instruction:'Step 8 — Mount the CPU cooler with even pressure, connect fan to CPU_FAN.' },
            { componentId:'casefan',     instruction:'Step 9 — Install case fans: front/bottom as intake, rear/top as exhaust. Build complete! 🎉' },
        ];
    }

    /* ─── Tooltip ─── */
    _createTooltip() {
        const el = document.createElement('div');
        el.id = 'sim-3d-tooltip';
        el.style.cssText = `
            position:fixed;pointer-events:none;z-index:9000;
            background:rgba(5,5,20,0.92);border:1px solid rgba(0,212,255,0.5);
            border-radius:8px;padding:8px 14px;color:#e0e8ff;
            font-family:'Inter',sans-serif;font-size:0.82rem;line-height:1.5;
            backdrop-filter:blur(8px);box-shadow:0 4px 24px rgba(0,212,255,0.2);
            max-width:220px;opacity:0;transition:opacity 0.2s;
        `;
        document.body.appendChild(el);
        return el;
    }

    _showTooltip(comp, x, y) {
        this.tooltip.innerHTML = `<strong style="color:#00d4ff;display:block;margin-bottom:4px">${comp.name}</strong>${comp.desc}`;
        this.tooltip.style.left = (x + 14) + 'px';
        this.tooltip.style.top  = (y - 10) + 'px';
        this.tooltip.style.opacity = '1';
    }

    _hideTooltip() {
        this.tooltip.style.opacity = '0';
    }

    /* ─── Material helpers ─── */
    mat(color, opts = {}) {
        return new THREE.MeshStandardMaterial({
            color,
            metalness: opts.metalness ?? 0.45,
            roughness: opts.roughness ?? 0.4,
            emissive: opts.emissive ?? 0x000000,
            emissiveIntensity: opts.emissiveIntensity ?? 0,
            transparent: opts.transparent ?? false,
            opacity: opts.opacity ?? 1,
            side: opts.side ?? THREE.FrontSide
        });
    }

    /* ─── Init (retry until container has size) ─── */
    initScene() {
        if (this.isInitialized || this._building) return;
        this._building = true;
        const tryInit = () => {
            const w = this.container.clientWidth;
            const h = this.container.clientHeight;
            if (w < 10 || h < 10) { requestAnimationFrame(tryInit); return; }
            this._buildScene(w, h);
        };
        tryInit();
    }

    _buildScene(w, h) {
        /* ── Scene ── */
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x06091a);
        this.scene.fog = new THREE.FogExp2(0x06091a, 0.018);

        /* ── Camera ── */
        this.camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
        this.camera.position.set(6, 4, 7);

        /* ── Renderer ── */
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(w, h);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.1;
        this.container.appendChild(this.renderer.domElement);

        /* ── OrbitControls ── */
        if (typeof THREE.OrbitControls === 'function') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.07;
            this.controls.minDistance = 2;
            this.controls.maxDistance = 22;
            this.controls.maxPolarAngle = Math.PI * 0.85;
            this.controls.target.set(0, 0, 0);
        } else {
            console.warn('[PCSimulator] OrbitControls not loaded — orbit disabled');
            this.controls = { update:()=>{}, autoRotate:false, target:new THREE.Vector3(), reset:()=>{} };
        }

        /* ── Lights ── */
        const ambient = new THREE.AmbientLight(0x8899cc, 1.0);
        this.scene.add(ambient);

        const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
        keyLight.position.set(8, 12, 8);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(2048, 2048);
        keyLight.shadow.camera.near = 0.1;
        keyLight.shadow.camera.far = 50;
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x4488ff, 0.7);
        fillLight.position.set(-8, 4, -5);
        this.scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0xff6600, 0.4);
        rimLight.position.set(0, -5, -8);
        this.scene.add(rimLight);

        // Colored point lights for atmosphere
        const cyanPt = new THREE.PointLight(0x00d4ff, 3, 15);
        cyanPt.position.set(4, 5, 4);
        this.scene.add(cyanPt);
        const purplePt = new THREE.PointLight(0x9933ff, 2, 14);
        purplePt.position.set(-4, 3, -4);
        this.scene.add(purplePt);

        /* ── Ground ── */
        const ground = new THREE.Mesh(
            new THREE.PlaneGeometry(30, 30),
            new THREE.MeshStandardMaterial({ color:0x060915, metalness:0.1, roughness:0.9 })
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -2.7;
        ground.receiveShadow = true;
        this.scene.add(ground);

        const grid = new THREE.GridHelper(24, 48, 0x00d4ff, 0x112244);
        grid.position.y = -2.7;
        grid.material.opacity = 0.35;
        grid.material.transparent = true;
        this.scene.add(grid);

        /* ── Build the PC Case (main 3D object) ── */
        this._buildPCCase();

        /* ── Pre-build component preview meshes (sidebar floating view) ── */
        this.components.forEach(comp => {
            const mesh = this._buildMesh(comp);
            mesh.userData.componentId = comp.id;
            mesh.userData.componentData = comp;
            mesh.userData.isPreview = true;

            // Position preview meshes in a cluster to the right of the case
            const idx = this.components.indexOf(comp);
            const col = idx % 3;
            const row = Math.floor(idx / 3);
            mesh.position.set(4.5 + col * 1.8, 2.5 - row * 1.4, 0);
            mesh.visible = false; // Hidden by default; shown on hover/select
            this.scene.add(mesh);
            this.componentMeshes[comp.id] = mesh;
        });

        /* ── Events ── */
        this.renderer.domElement.addEventListener('mousemove', e => this._onMouseMove(e));
        this.renderer.domElement.addEventListener('click',     e => this._onViewportClick(e));
        window.addEventListener('resize', () => this.onResize());

        this.isInitialized = true;
        this.animate();
        console.log('[PCSimulator v3] Scene built successfully');
    }

    /* ─────────────────────────────────────────────
       3D PC CASE — Full interactive model
    ───────────────────────────────────────────── */
    _buildPCCase() {
        this.caseGroup = new THREE.Group();

        const steel = this.mat(0x1a2232, { metalness:0.65, roughness:0.45 });
        const steelDark = this.mat(0x0e1520, { metalness:0.7, roughness:0.5 });
        const accentCyan = this.mat(0x00d4ff, { emissive:0x00d4ff, emissiveIntensity:0.8, metalness:0, roughness:1 });
        const accentPurple = this.mat(0x7733ff, { emissive:0x7733ff, emissiveIntensity:0.5, metalness:0, roughness:1 });
        const glassMat = new THREE.MeshPhysicalMaterial({ color:0x0a1a2a, metalness:0.1, roughness:0.05, transmission:0.6, opacity:0.55, transparent:true, side:THREE.DoubleSide, envMapIntensity:1 });

        const W=2.2, H=4.4, D=1.8; // case width, height, depth

        // -- Back wall (permanent) --
        const back = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.08), steel);
        back.position.z = -D/2;
        back.castShadow = true;
        this.caseGroup.add(back);

        // -- Top --
        const top = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, D), steel);
        top.position.y = H/2;
        top.castShadow = true;
        this.caseGroup.add(top);

        // -- Bottom --
        const bottom = new THREE.Mesh(new THREE.BoxGeometry(W, 0.08, D), steelDark);
        bottom.position.y = -H/2;
        bottom.receiveShadow = true;
        this.caseGroup.add(bottom);

        // -- Right side wall (permanent) --
        const rightSide = new THREE.Mesh(new THREE.BoxGeometry(0.08, H, D), steel);
        rightSide.position.x = W/2;
        rightSide.castShadow = true;
        this.caseGroup.add(rightSide);

        // -- Front panel --
        const front = new THREE.Mesh(new THREE.BoxGeometry(W, H, 0.08), steelDark);
        front.position.z = D/2;
        front.castShadow = true;
        this.caseGroup.add(front);

        // Front I/O strip (power button area)
        const frontStrip = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, 0.1), this.mat(0x111827, { metalness:0.5, roughness:0.3 }));
        frontStrip.position.set(0, -H/2 + 0.8, D/2 + 0.04);
        this.caseGroup.add(frontStrip);

        // Power button
        const pwrBtn = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.04, 20), this.mat(0x00d4ff, { emissive:0x00d4ff, emissiveIntensity:1.0 }));
        pwrBtn.rotation.x = Math.PI/2;
        pwrBtn.position.set(0.6, -H/2 + 0.8, D/2 + 0.09);
        this.caseGroup.add(pwrBtn);

        // USB ports on front
        for (let i=0; i<3; i++) {
            const usb = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.02), this.mat(0x0066aa, { metalness:0.8 }));
            usb.position.set(-0.3 + i*0.22, -H/2 + 0.8, D/2 + 0.05);
            this.caseGroup.add(usb);
        }

        // -- Top exhaust vent mesh --
        for (let i=0; i<6; i++) {
            const vent = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.012, 0.08), this.mat(0x0e1520, { metalness:0.6 }));
            vent.position.set(0, H/2 - 0.01, -D/2 + 0.18 + i * 0.2);
            this.caseGroup.add(vent);
        }

        // -- Cyan accent strips (glow) --
        const topAccent = new THREE.Mesh(new THREE.BoxGeometry(W * 0.85, 0.025, 0.025), accentCyan);
        topAccent.position.set(0, H/2 + 0.01, D/2 - 0.1);
        this.caseGroup.add(topAccent);

        const frontAccentL = new THREE.Mesh(new THREE.BoxGeometry(0.025, H * 0.6, 0.025), accentCyan);
        frontAccentL.position.set(-W/2 + 0.04, 0.2, D/2 + 0.01);
        this.caseGroup.add(frontAccentL);

        const frontAccentR = new THREE.Mesh(new THREE.BoxGeometry(0.025, H * 0.6, 0.025), accentPurple);
        frontAccentR.position.set(W/2 - 0.04, 0.2, D/2 + 0.01);
        this.caseGroup.add(frontAccentR);

        // -- Tempered glass side panel (LEFT side — openable) --
        this.sidePanelGroup = new THREE.Group();
        const glassPanel = new THREE.Mesh(new THREE.BoxGeometry(0.06, H - 0.16, D - 0.16), glassMat);
        this.sidePanelGroup.add(glassPanel);

        // Glass edge highlights
        const glassBorder = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(0.065, H - 0.16, D - 0.16)),
            new THREE.LineBasicMaterial({ color:0x00d4ff, transparent:true, opacity:0.7 })
        );
        this.sidePanelGroup.add(glassBorder);

        // Hinge at back-left edge of panel
        this.sidePanelGroup.position.set(-W/2, 0, 0);
        this.sidePanelGroup.userData.isPanelGroup = true;
        this.caseGroup.add(this.sidePanelGroup);
        this.sidePanelMesh = this.sidePanelGroup;

        // -- Motherboard tray (inside) --
        const mbTray = new THREE.Mesh(new THREE.BoxGeometry(1.9, 3.6, 0.05), this.mat(0x0d1a10, { metalness:0.3, roughness:0.7 }));
        mbTray.position.set(0.1, 0, -D/2 + 0.2);
        this.caseGroup.add(mbTray);

        // Standoffs on tray
        for (let r=0; r<3; r++) for (let c=0; c<3; c++) {
            const so = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.055, 6), this.mat(0xccaa44, { metalness:0.88 }));
            so.position.set(-0.7 + c*0.7, -1.4 + r*1.4, -D/2 + 0.23);
            this.caseGroup.add(so);
        }

        // -- Cable management spine (dark bar on left wall inside) --
        const cableMgmt = new THREE.Mesh(new THREE.BoxGeometry(0.05, H*0.8, 0.3), this.mat(0x0a0f1a, { metalness:0.3 }));
        cableMgmt.position.set(-W/2 + 0.15, 0, 0);
        this.caseGroup.add(cableMgmt);

        // -- PSU shroud at bottom --
        const psuShroud = new THREE.Mesh(new THREE.BoxGeometry(W - 0.2, 0.65, D * 0.55), this.mat(0x0c1525, { metalness:0.5 }));
        psuShroud.position.set(0, -H/2 + 0.38, D*0.2);
        this.caseGroup.add(psuShroud);

        // -- I/O Backplate area --
        const ioBackplate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.06), this.mat(0x1a1a2a, { metalness:0.6 }));
        ioBackplate.position.set(-0.1, H/2 - 0.8, -D/2 + 0.05);
        this.caseGroup.add(ioBackplate);

        // Inside glow (neon strip at back of case)
        const backGlow = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.02), this.mat(0xff2d95, { emissive:0xff2d95, emissiveIntensity:1.5, metalness:0 }));
        backGlow.position.set(0, -H/2 + 1.0, -D/2 + 0.05);
        this.caseGroup.add(backGlow);
        this._backGlow = backGlow;

        const backGlow2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.02, 0.02), this.mat(0x00d4ff, { emissive:0x00d4ff, emissiveIntensity:1.5, metalness:0 }));
        backGlow2.position.set(0, H/2 - 0.9, -D/2 + 0.05);
        this.caseGroup.add(backGlow2);
        this._backGlow2 = backGlow2;

        // Position the whole case
        this.caseGroup.position.set(-1.0, 0, 0);
        this.caseGroup.castShadow = true;
        this.scene.add(this.caseGroup);

        // Save case dimensions for slot positioning
        this.caseDims = { W, H, D };
    }

    /* ─────────────────────────────────────────────
       Component Mesh Builders
    ───────────────────────────────────────────── */
    _buildMesh(comp) {
        switch(comp.id) {
            case 'motherboard': return this._meshMotherboard(comp.color);
            case 'cpu':         return this._meshCPU();
            case 'ram':         return this._meshRAM(comp.color);
            case 'gpu':         return this._meshGPU(comp.color);
            case 'psu':         return this._meshPSU(comp.color);
            case 'storage':     return this._meshNVMe(comp.color);
            case 'hdd':         return this._meshDrive(comp.color);
            case 'cooler':      return this._meshCooler();
            case 'casefan':     return this._meshCaseFan(comp.color);
            default: return new THREE.Mesh(new THREE.BoxGeometry(0.5,0.5,0.5), this.mat(comp.color));
        }
    }

    _meshMotherboard(color) {
        const g = new THREE.Group();
        // PCB base
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.8, 2.1, 0.07), this.mat(0x0a3a0a, { roughness:0.7, metalness:0.2 }));
        pcb.castShadow = true;
        g.add(pcb);
        // CPU socket
        const socket = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.6, 0.04), this.mat(0x333344, { metalness:0.7 }));
        socket.position.set(-0.15, 0.55, 0.055);
        g.add(socket);
        // Socket glow
        const sockGlow = new THREE.Mesh(new THREE.BoxGeometry(0.64, 0.64, 0.015), this.mat(color, { emissive:color, emissiveIntensity:0.4, transparent:true, opacity:0.6 }));
        sockGlow.position.set(-0.15, 0.55, 0.07);
        g.add(sockGlow);
        // RAM slots x4
        for (let i=0; i<4; i++) {
            const sl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.85, 0.035), this.mat(0x1a1a44));
            sl.position.set(0.65 + i*0.1, 0.45, 0.05);
            g.add(sl);
        }
        // PCIe slots x3
        for (let i=0; i<3; i++) {
            const ps = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.06, 0.03), this.mat(color, { emissive:color, emissiveIntensity:0.3 }));
            ps.position.set(-0.15, -0.3 - i*0.4, 0.05);
            g.add(ps);
        }
        // VRM heatsinks (3 fins)
        for (let i=0; i<4; i++) {
            const h = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.2), this.mat(0x445566, { metalness:0.7 }));
            h.position.set(-0.7 + i*0.25, 0.95, 0.1);
            g.add(h);
        }
        // Chipset heatsink
        const cs = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.28, 0.15), this.mat(0x223344, { metalness:0.75 }));
        cs.position.set(0.4, -0.65, 0.1);
        g.add(cs);
        // M.2 slot
        const m2 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.045, 0.02), this.mat(0x222233));
        m2.position.set(0.2, 0.05, 0.05);
        g.add(m2);
        // IO area
        const io = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.55, 0.12), this.mat(0x1a2233, { metalness:0.5 }));
        io.position.set(-0.9, 0.75, 0);
        g.add(io);
        return g;
    }

    _meshCPU() {
        const g = new THREE.Group();
        // IHS (integrated heat spreader)
        const ihs = new THREE.Mesh(new THREE.BoxGeometry(0.44, 0.44, 0.065), this.mat(0xbbbbcc, { metalness:0.92, roughness:0.08 }));
        ihs.castShadow = true;
        g.add(ihs);
        // Contacts/pads on bottom
        const contacts = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.38, 0.01), this.mat(0xddaa44, { metalness:0.95, roughness:0.1 }));
        contacts.position.z = -0.038;
        g.add(contacts);
        // Laser-etched label glow
        const label = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.005), this.mat(0x4499ff, { emissive:0x4499ff, emissiveIntensity:0.7, transparent:true, opacity:0.8 }));
        label.position.z = 0.036;
        g.add(label);
        // Corner triangle marker
        const tri = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.005), this.mat(0xffcc00, { emissive:0xffcc00, emissiveIntensity:1 }));
        tri.position.set(-0.17, -0.17, 0.036);
        g.add(tri);
        return g;
    }

    _meshRAM(color) {
        const g = new THREE.Group();
        for (let i=0; i<2; i++) {
            // PCB stick
            const stick = new THREE.Mesh(new THREE.BoxGeometry(0.065, 0.9, 0.28), this.mat(0x1c1c3a, { metalness:0.6 }));
            stick.position.x = i * 0.18;
            stick.castShadow = true;
            g.add(stick);
            // RGB bar on top
            const rgb = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.065, 0.26), this.mat(color, { emissive:color, emissiveIntensity:0.9 }));
            rgb.position.set(i * 0.18, 0.48, 0);
            g.add(rgb);
            // Spreader fins effect
            for (let f=0; f<4; f++) {
                const fin = new THREE.Mesh(new THREE.BoxGeometry(0.085, 0.05, 0.005), this.mat(0x334466, { metalness:0.8 }));
                fin.position.set(i * 0.18, 0.3 + f*0.12, 0.14);
                g.add(fin);
            }
            // Gold contacts on bottom
            const contacts = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.15, 0.26), this.mat(0xddaa33, { metalness:0.95 }));
            contacts.position.set(i * 0.18, -0.525, 0);
            g.add(contacts);
        }
        return g;
    }

    _meshGPU(color) {
        const g = new THREE.Group();
        // PCB
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.06, 0.58), this.mat(0x080820));
        pcb.castShadow = true;
        g.add(pcb);
        // Shroud
        const shroud = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.24, 0.62), this.mat(0x16192e, { metalness:0.65 }));
        shroud.position.y = -0.14;
        g.add(shroud);
        // 3 fans
        for (let i=-1; i<=1; i++) {
            const fanRing = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.025, 8, 24), this.mat(0x2a2a4a, { metalness:0.5 }));
            fanRing.rotation.x = Math.PI/2;
            fanRing.position.set(i * 0.56, -0.09, 0);
            g.add(fanRing);
            const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.07, 12), this.mat(0x333355));
            hub.rotation.x = Math.PI/2;
            hub.position.set(i * 0.56, -0.09, 0);
            g.add(hub);
            // Fan blades group (for spinning)
            const bladeGroup = new THREE.Group();
            bladeGroup.position.set(i * 0.56, -0.09, 0);
            for (let b=0; b<7; b++) {
                const blade = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.05), this.mat(0x445577));
                const angle = (b/7) * Math.PI * 2;
                blade.position.set(Math.cos(angle)*0.11, 0, Math.sin(angle)*0.11);
                blade.rotation.y = -angle;
                bladeGroup.add(blade);
            }
            g.add(bladeGroup);
            this._spinMeshes.push(bladeGroup);
        }
        // RGB strip
        const rgb = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.018, 0.018), this.mat(color, { emissive:color, emissiveIntensity:1.1 }));
        rgb.position.set(0, 0.038, 0.31);
        g.add(rgb);
        // Backplate
        const bp = new THREE.Mesh(new THREE.BoxGeometry(1.85, 0.04, 0.58), this.mat(0x5a5a7a, { metalness:0.8 }));
        bp.position.y = 0.05;
        g.add(bp);
        // Bracket
        const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.32, 0.62), this.mat(0x555566, { metalness:0.8 }));
        bracket.position.x = 0.93;
        g.add(bracket);
        // PCIe connector on bottom
        const conn = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, 0.018), this.mat(0xddaa33, { metalness:0.9 }));
        conn.position.set(0, -0.267, 0);
        g.add(conn);
        return g;
    }

    _meshPSU(color) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 0.7, 0.88), this.mat(0x111827, { metalness:0.5 }));
        body.castShadow = true;
        g.add(body);
        // Honeycomb fan grill (approximated with ring)
        const grill = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.04, 8, 24), this.mat(0x2a2a3a, { metalness:0.5 }));
        grill.rotation.x = Math.PI/2;
        grill.position.y = -0.36;
        g.add(grill);
        const grillHub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.02, 12), this.mat(0x333344));
        grillHub.rotation.x = Math.PI/2;
        grillHub.position.y = -0.36;
        g.add(grillHub);
        // Label
        const lbl = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.02, 0.4), this.mat(color, { emissive:color, emissiveIntensity:0.6, metalness:0 }));
        lbl.position.y = 0.36;
        g.add(lbl);
        // Cable sockets
        for (let i=0; i<4; i++) {
            const sock = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.04), this.mat(0x1a1a2a, { metalness:0.3 }));
            sock.position.set(-0.55 + i * 0.38, 0, -0.45);
            g.add(sock);
        }
        // Rating label
        const rating = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.18, 0.005), this.mat(0x222244));
        rating.position.set(0.5, 0.36, 0);
        g.add(rating);
        return g;
    }

    _meshNVMe(color) {
        const g = new THREE.Group();
        const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.08, 0.325), this.mat(0x1a1a30, { metalness:0.55 }));
        pcb.castShadow = true;
        g.add(pcb);
        // NAND flash chips
        const chip1 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.12), this.mat(0x111111, { metalness:0.3 }));
        chip1.position.set(-0.15, 0.05, 0.05);
        g.add(chip1);
        const chip2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.022, 0.12), this.mat(0x111111, { metalness:0.3 }));
        chip2.position.set(0.1, 0.05, -0.05);
        g.add(chip2);
        // Controller
        const ctrl = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.022, 0.1), this.mat(0x222244, { metalness:0.4 }));
        ctrl.position.set(0.2, 0.05, 0.1);
        g.add(ctrl);
        // Color label / brand
        const lbl = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.012, 0.14), this.mat(color, { emissive:color, emissiveIntensity:0.55 }));
        lbl.position.y = 0.048;
        g.add(lbl);
        // M-key connector
        const mkey = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.01), this.mat(0xddaa33, { metalness:0.9 }));
        mkey.position.set(0.27, 0, 0);
        g.add(mkey);
        return g;
    }

    _meshDrive(color) {
        const g = new THREE.Group();
        const body = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.16, 0.68), this.mat(0x14141e, { metalness:0.45 }));
        body.castShadow = true;
        g.add(body);
        // Top label
        const lbl = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.012, 0.5), this.mat(color, { emissive:color, emissiveIntensity:0.3 }));
        lbl.position.y = 0.086;
        g.add(lbl);
        // Platters edge (silver)
        const platter = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 32), this.mat(0xaaaaaa, { metalness:0.85, roughness:0.1 }));
        platter.rotation.z = Math.PI/2;
        platter.position.set(-0.1, 0, 0);
        g.add(platter);
        // SATA port
        const sata = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.065, 0.035), this.mat(0x1a1a2a));
        sata.position.set(0.44, 0, 0.25);
        g.add(sata);
        return g;
    }

    _meshCooler() {
        const g = new THREE.Group();
        // Heatsink fins
        for (let i=0; i<11; i++) {
            const fin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.035, 0.5), this.mat(0x9999aa, { metalness:0.75, roughness:0.3 }));
            fin.position.y = i * 0.065;
            fin.castShadow = i < 2;
            g.add(fin);
        }
        // Heat pipes (6 copper pipes)
        for (let i=0; i<3; i++) {
            const hp = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.82, 8), this.mat(0xcc8833, { metalness:0.92, roughness:0.1 }));
            hp.position.set(-0.1 + i*0.1, 0.32, 0.01);
            g.add(hp);
        }
        // Base plate
        const base = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.04, 0.48), this.mat(0xbbbbcc, { metalness:0.88, roughness:0.15 }));
        base.position.y = -0.02;
        g.add(base);
        // Fan frame
        const fanFrame = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.075), this.mat(0x1a1a30, { transparent:true, opacity:0.85 }));
        fanFrame.position.set(0, 0.32, 0.29);
        g.add(fanFrame);
        // Fan blades group
        const bladeGroup = new THREE.Group();
        bladeGroup.position.set(0, 0.32, 0.3);
        for (let b=0; b<7; b++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.025, 0.065), this.mat(0x445577));
            const angle = (b/7)*Math.PI*2;
            blade.position.set(Math.cos(angle)*0.14, 0, Math.sin(angle)*0.14);
            blade.rotation.y = -angle + 0.4;
            bladeGroup.add(blade);
        }
        g.add(bladeGroup);
        this._spinMeshes.push(bladeGroup);
        return g;
    }

    _meshCaseFan(color) {
        const g = new THREE.Group();
        // Frame
        const frame = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.55, 0.065), this.mat(0x111122));
        frame.castShadow = true;
        g.add(frame);
        // Corner mounts
        for (let i=0; i<4; i++) {
            const mt = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.07, 8), this.mat(0x222233));
            mt.position.set((i%2?1:-1)*0.22, (i<2?-1:1)*0.22, 0);
            g.add(mt);
        }
        // Fan hub
        const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.07, 12), this.mat(color, { emissive:color, emissiveIntensity:0.8 }));
        hub.rotation.x = Math.PI/2;
        g.add(hub);
        // Blades
        const bladeGroup = new THREE.Group();
        for (let b=0; b<9; b++) {
            const blade = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.022, 0.06), this.mat(0x334466));
            const angle = (b/9)*Math.PI*2;
            blade.position.set(Math.cos(angle)*0.13, Math.sin(angle)*0.13, 0.03);
            blade.rotation.z = angle;
            bladeGroup.add(blade);
        }
        g.add(bladeGroup);
        this._spinMeshes.push(bladeGroup);
        // ARGB ring
        const argbRing = new THREE.Mesh(new THREE.TorusGeometry(0.245, 0.012, 8, 32), this.mat(color, { emissive:color, emissiveIntensity:1.0 }));
        argbRing.rotation.x = Math.PI/2;
        g.add(argbRing);
        return g;
    }

    /* ─────────────────────────────────────────────
       Raycasting — hover & click
    ───────────────────────────────────────────── */
    _getAllInteractable() {
        const installed = Object.values(this.installedMeshes).filter(m => m.visible);
        return installed;
    }

    _getIntersected(event) {
        if (!this.camera || !this.scene) return null;
        const rect = this.renderer.domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        this.raycaster.setFromCamera(this.mouse, this.camera);
        const targets = this._getAllInteractable();
        const hits = this.raycaster.intersectObjects(targets, true);
        if (!hits.length) return null;
        let obj = hits[0].object;
        while (obj.parent && !obj.userData.componentId) obj = obj.parent;
        return obj.userData.componentId ? obj : null;
    }

    _onMouseMove(event) {
        const hit = this._getIntersected(event);
        if (this.hoveredMesh && this.hoveredMesh !== hit) {
            this._setEmissive(this.hoveredMesh, 0x000000, 0);
            this.hoveredMesh = null;
            this._hideTooltip();
        }
        if (hit) {
            this._setEmissive(hit, 0x00d4ff, 0.65);
            this.hoveredMesh = hit;
            this.renderer.domElement.style.cursor = 'pointer';
            const comp = this.components.find(c => c.id === hit.userData.componentId);
            if (comp) this._showTooltip(comp, event.clientX, event.clientY);
        } else {
            this.renderer.domElement.style.cursor = '';
        }
    }

    _onViewportClick(event) {
        const hit = this._getIntersected(event);
        if (hit && window._simClickCallback) window._simClickCallback(hit.userData.componentId);
    }

    _setEmissive(mesh, color, intensity) {
        const apply = (obj) => {
            if (obj.material) {
                const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
                mats.forEach(m => { if (m.emissive) { m.emissive.setHex(color); m.emissiveIntensity = intensity; } });
            }
            if (obj.children) obj.children.forEach(apply);
        };
        apply(mesh);
    }

    /* ─────────────────────────────────────────────
       Install a Component with snap animation
    ───────────────────────────────────────────── */
    installComponent(componentId, callback) {
        if (this.installedComponents.has(componentId)) return;
        const comp = this.components.find(c => c.id === componentId);
        if (!comp) return;

        // Build a fresh mesh for the installed position
        const mesh = this._buildMesh(comp);
        mesh.userData.componentId = componentId;
        mesh.userData.componentData = comp;

        // World position of slot inside case
        const casePos = this.caseGroup.position;
        const slotWorld = {
            x: casePos.x + comp.slotPos.x,
            y: casePos.y + comp.slotPos.y,
            z: casePos.z + (comp.slotPos.z ?? 0)
        };

        // Start above the case
        mesh.position.set(slotWorld.x, slotWorld.y + 5, slotWorld.z);
        mesh.visible = true;
        this.scene.add(mesh);
        this.installedMeshes[componentId] = mesh;

        const startTime = performance.now();
        const dur = 900;

        const anim = (now) => {
            const t = Math.min((now - startTime) / dur, 1);
            // Ease-in-out cubic
            const ease = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2;
            mesh.position.y = slotWorld.y + 5 * (1 - ease);
            mesh.rotation.y = (1 - ease) * Math.PI * 0.5;
            mesh.scale.setScalar(0.4 + ease * 0.6);
            if (t < 1) { requestAnimationFrame(anim); }
            else {
                mesh.position.set(slotWorld.x, slotWorld.y, slotWorld.z);
                mesh.rotation.set(0, 0, 0);
                mesh.scale.setScalar(1);
                this.installedComponents.add(componentId);
                // Green flash
                this._setEmissive(mesh, 0x00ff88, 1.0);
                setTimeout(() => this._setEmissive(mesh, 0x000000, 0), 700);
                if (callback) callback();
            }
        };
        requestAnimationFrame(anim);
    }

    /* ─────────────────────────────────────────────
       Case Panel Open / Close
    ───────────────────────────────────────────── */
    toggleCasePanel() {
        this.caseOpen = !this.caseOpen;
        this.sidePanelTargetRot = this.caseOpen ? -Math.PI / 2 : 0;
        return this.caseOpen;
    }

    _animateCasePanel() {
        if (!this.sidePanelMesh) return;
        const currentRot = this.sidePanelMesh.rotation.y;
        const diff = this.sidePanelTargetRot - currentRot;
        if (Math.abs(diff) > 0.002) {
            this.sidePanelMesh.rotation.y += diff * 0.09;
        } else {
            this.sidePanelMesh.rotation.y = this.sidePanelTargetRot;
        }
    }

    /* ─────────────────────────────────────────────
       Camera Controls
    ───────────────────────────────────────────── */
    zoomIn() {
        if (!this.camera || !this.controls) return;
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        const dist = this.camera.position.distanceTo(this.controls.target);
        if (dist > this.controls.minDistance + 0.5) {
            this.camera.position.addScaledVector(dir, -dist * 0.18);
        }
    }

    zoomOut() {
        if (!this.camera || !this.controls) return;
        const dir = this.camera.position.clone().sub(this.controls.target).normalize();
        const dist = this.camera.position.distanceTo(this.controls.target);
        if (dist < this.controls.maxDistance - 0.5) {
            this.camera.position.addScaledVector(dir, dist * 0.18);
        }
    }

    toggleAutoRotate() {
        if (this.controls) {
            this.controls.autoRotate = !this.controls.autoRotate;
            this.controls.autoRotateSpeed = 1.5;
            return this.controls.autoRotate;
        }
        return false;
    }

    resetView() {
        if (!this.camera || !this.controls) return;
        const t = performance.now();
        const startPos = this.camera.position.clone();
        const endPos = new THREE.Vector3(6, 4, 7);
        const startTarget = this.controls.target.clone();
        const dur = 900;
        const anim = (now) => {
            const p = Math.min((now - t) / dur, 1);
            const e = 1 - Math.pow(1 - p, 3);
            this.camera.position.lerpVectors(startPos, endPos, e);
            this.controls.target.lerpVectors(startTarget, new THREE.Vector3(0,0,0), e);
            if (p < 1) requestAnimationFrame(anim);
        };
        requestAnimationFrame(anim);
    }

    /* ─────────────────────────────────────────────
       State management
    ───────────────────────────────────────────── */
    resetBuild() {
        this.installedComponents.clear();
        this.currentStep = 0;
        this.isGuided = false;
        this.buildStartTime = null;
        // Remove installed meshes from scene
        Object.values(this.installedMeshes).forEach(m => {
            this.scene.remove(m);
        });
        this.installedMeshes = {};
    }

    startGuidedBuild() {
        this.resetBuild();
        this.isGuided = true;
        this.currentStep = 0;
        this.buildStartTime = Date.now();
        return this.buildSteps[0];
    }

    advanceStep() {
        if (this.currentStep < this.buildSteps.length - 1) {
            this.currentStep++;
            return this.buildSteps[this.currentStep];
        }
        return null;
    }

    getCurrentStep() { return this.buildSteps[this.currentStep] || null; }
    getBuildProgress() { return this.installedComponents.size / this.components.length; }
    getBuildTime() { return this.buildStartTime ? Math.floor((Date.now() - this.buildStartTime)/1000) : 0; }
    isBuildComplete() { return this.installedComponents.size === this.components.length; }

    /* ─────────────────────────────────────────────
       Animation Loop
    ───────────────────────────────────────────── */
    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        const t = this.clock.getElapsedTime();

        // Pulse internal glows
        if (this._backGlow) {
            const intensity = 1.0 + Math.sin(t * 2.2) * 0.4;
            this._backGlow.material.emissiveIntensity = intensity;
        }
        if (this._backGlow2) {
            const intensity = 1.0 + Math.sin(t * 2.2 + Math.PI) * 0.4;
            this._backGlow2.material.emissiveIntensity = intensity;
        }

        // Case rotation (subtle) when nothing is installed
        if (this.installedComponents.size === 0 && this.caseGroup) {
            this.caseGroup.rotation.y = Math.sin(t * 0.25) * 0.12;
        }

        // Spin fans
        const installed = this.installedComponents;
        this._spinMeshes.forEach(m => {
            const id = m.parent?.userData?.componentId;
            // Spin if parent is installed
            if (!id || installed.has(id)) {
                m.rotation.z += 0.055;
            }
        });

        // Animate case panel
        this._animateCasePanel();

        if (this.controls) this.controls.update();
        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    onResize() {
        if (!this.container || !this.isInitialized) return;
        const w = this.container.clientWidth;
        const h = this.container.clientHeight;
        if (w < 10 || h < 10) return;
        this.camera.aspect = w / h;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(w, h);
    }

    dispose() {
        cancelAnimationFrame(this.animationId);
        if (this.renderer) this.renderer.dispose();
        if (this.tooltip && this.tooltip.parentNode) this.tooltip.parentNode.removeChild(this.tooltip);
    }
}

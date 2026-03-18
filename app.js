/* ============================================================
   APP.JS  —  MAIN CONTROLLER
   Navigation, loading, animations, learning, compare,
   challenges, achievements, localStorage persistence
   ============================================================ */

(function () {
    'use strict';

    /* ====================== DATA ====================== */

    const LEARNING_MODULES = [
        /* ---- NEW modules prepended ---- */
        {
            id:'thermal', icon:'fa-droplet', title:'Thermal Paste',
            subtitle:'The critical interface between CPU and cooler',
            overview:'Thermal paste fills microscopic gaps between the CPU heat spreader and cooler base, drastically improving heat transfer. Without it your CPU can thermal-throttle or shut down within seconds.',
            sections:[
                { heading:'Why It Matters', body:'Air gaps are poor thermal conductors. Paste replaces them with a compound 10–15× more conductive, reducing temperatures by 15–25°C.' },
                { heading:'Key Specifications', list:['Conductivity (W/m·K) — higher is better','Viscosity — affects spreading behavior','Cure time — some compounds improve over time','Electrically conductive — keep off PCB pads','Shelf life — typically 3–5 years'] },
                { heading:'Application Tips', list:['Clean old paste with 99% isopropyl alcohol','Apply a pea-sized dot to the CPU center','Let cooler pressure spread it evenly','Never spread manually on delicate IHS','Replace every 3–5 years or if temps rise unexpectedly'] }
            ]
        },
        {
            id:'cmos', icon:'fa-battery-full', title:'CMOS Battery',
            subtitle:'Keeps your BIOS settings alive',
            overview:'The CR2032 lithium coin cell on the motherboard powers the CMOS chip that stores BIOS settings and the real-time clock (RTC) whenever the PC is unplugged.',
            sections:[
                { heading:'What It Does', body:'Without the CMOS battery, your PC forgets the date, time, and all custom BIOS settings every time you unplug it. It also stores boot order and fan curve settings.' },
                { heading:'Key Specifications', list:['Chemistry: Lithium CR2032 (3V)','Typical lifespan: 3–10 years','Diameter: 20mm','Capacity: ~225 mAh','Self-discharge: ~1% per year'] },
                { heading:'Replacement Tips', list:['Replace if date/time resets on every boot','System will reset BIOS to defaults after swap','Re-enter all BIOS customisations after replacement','Wear anti-static strap — static can damage BIOS chip','Recycle old batteries properly'] }
            ]
        },
        {
            id:'ddr5', icon:'fa-memory', title:'DDR5 RAM',
            subtitle:'Next-generation memory standard',
            overview:'DDR5 doubles the channels per DIMM, halves the voltage consumption, and introduces on-die ECC compared to DDR4. It is the memory standard for Intel 12th gen+ and AMD Ryzen 7000 platforms.',
            sections:[
                { heading:'What Changed vs DDR4', list:['On-die ECC (error correction per DIMM)','Dual 32-bit sub-channels per module','Lower voltage: 1.1V stock (vs 1.2V DDR4)','Higher base speed: 4800 MT/s minimum','Larger per-module capacities (up to 128GB DIMM)'] },
                { heading:'Key Specifications', list:['Speed: DDR5-4800 to DDR5-8000+','Latency: CL30–CL40','Voltage: 1.1V (JEDEC) / 1.35–1.45V (XMP)','Capacity: 16–128GB per DIMM','Form factor: 288-pin (incompatible with DDR4)'] },
                { heading:'Installation Tips', list:['Enable XMP/EXPO in BIOS for advertised speed','Use matched kits for best compatibility','Check QVL list on motherboard manufacturer site','High-speed DDR5 may need good CPU IMC (memory controller)','Pair with Ryzen 7000 or Intel 12th/13th/14th gen boards'] }
            ]
        },
        {
            id:'aio', icon:'fa-water', title:'AIO Liquid Cooling',
            subtitle:'All-in-one closed loop CPU cooler',
            overview:'AIO (All-In-One) liquid coolers pre-fill a sealed loop with a pump block that sits on the CPU, flexible tubing, and a fan-cooled radiator mounted inside the case.',
            sections:[
                { heading:'What It Does', body:'Liquid transfers heat from CPU to the radiator far more efficiently than air alone. AIOs excel at sustained workloads like video rendering and overclocking.' },
                { heading:'Key Specifications', list:['Radiator size: 120/240/280/360mm','Fan count: 1–3 × 120mm or 140mm','Pump speed: 800–3000 RPM','TDP support: 200–450W','Warranty: typically 3–6 years'] },
                { heading:'Installation Tips', list:['Mount radiator fans as intake for best CPU temps','Ensure tubing routing avoids sharp bends','Bleed air by tilting case after first boot','Check case radiator support before buying','Top mount = best for heat stratification'] }
            ]
        },
        {
            id:'wifi', icon:'fa-wifi', title:'Wi-Fi Card',
            subtitle:'Adds wireless connectivity to a desktop',
            overview:'A PCIe Wi-Fi card adds Wi-Fi 6/6E and Bluetooth to a desktop that lacks integrated wireless. It plugs into any PCIe x1 or larger slot.',
            sections:[
                { heading:'What It Does', body:'Converts the PCIe bus into a wireless NIC. Modern cards support Wi-Fi 6E (6 GHz band) for low-latency multi-gigabit connections in crowded environments.' },
                { heading:'Key Specifications', list:['Standard: Wi-Fi 6E (802.11ax / HE)','Bands: 2.4 GHz / 5 GHz / 6 GHz tri-band','Bluetooth: 5.3','Max throughput: 2400 Mb/s on 6 GHz','PCIe slot: x1'] },
                { heading:'Installation Tips', list:['Place antennas in vertical orientation','Keep antennas away from GPU heat exhaust','Use PCIe x1 slot — no need for larger slot','Disable driver signing check on some Linux distros','MHF4 antenna connectors are very fragile — handle gently'] }
            ]
        },
        {
            id:'frontpanel', icon:'fa-plug', title:'Front Panel Connectors',
            subtitle:'Tiny but critical headers',
            overview:'The front-panel connector block links your case power button, reset button, power LED, and HDD activity LED to the corresponding pins on the motherboard.',
            sections:[
                { heading:'What It Does', body:'Without the power switch header connected correctly, pressing the power button does nothing. It is the most common reason a new build refuses to start.' },
                { heading:'Pin Layout', list:['PWR_SW (2-pin): powers on the PC','RESET (2-pin): triggers restart','PWR_LED (2-pin or 3-pin): power indicator','HDD_LED (2-pin): storage activity light','Speaker (4-pin): beep codes — often optional'] },
                { heading:'Installation Tips', list:['Consult motherboard manual for exact pin map','Wrong polarity only affects LEDs (they just won\'t light)','PWR_SW is not polarity-sensitive','Use magnifying glass in tight ITX builds','Asus/MSI provide extension cables — highly recommended'] }
            ]
        },
        /* ---- original modules ---- */
        {
            id: 'cpu', icon: 'fa-microchip', title: 'CPU (Processor)',
            subtitle: 'The brain of your computer',
            overview: 'The Central Processing Unit executes every instruction your computer runs — from opening a browser to rendering a game. Modern CPUs have multiple cores for parallel processing.',
            sections: [
                { heading: 'What It Does', body: 'The CPU fetches, decodes, and executes instructions from programs. It performs arithmetic calculations, logical comparisons, and controls data flow to other components.' },
                { heading: 'Key Specifications', list: ['Core count — more cores = better multitasking', 'Clock speed (GHz) — higher = faster single-thread', 'Cache size (L1/L2/L3) — larger = fewer memory delays', 'TDP — thermal design power (heat output)', 'Socket type — must match motherboard'] },
                { heading: 'Installation Tips', list: ['Handle by edges only — never touch the contacts', 'Align the golden triangle with the socket marker', 'The CPU drops in with zero force — never push', 'Apply thermal paste before mounting the cooler'] }
            ]
        },
        {
            id: 'gpu', icon: 'fa-tv', title: 'GPU (Graphics Card)',
            subtitle: 'Powers all visual processing',
            overview: 'The Graphics Processing Unit handles rendering images, videos, and 3D graphics. It\'s essential for gaming, video editing, machine learning, and any visually intensive task.',
            sections: [
                { heading: 'What It Does', body: 'GPUs contain thousands of small cores optimized for parallel processing. They offload visual computation from the CPU, dramatically improving graphics performance.' },
                { heading: 'Key Specifications', list: ['VRAM capacity (8GB-24GB)', 'GPU clock speed & boost clock', 'CUDA/Stream processors count', 'Memory bus width (128-384 bit)', 'Power connector requirements'] },
                { heading: 'Installation Tips', list: ['Use the top PCIe x16 slot for maximum bandwidth', 'Support bracket recommended for heavy cards', 'Connect ALL required PCIe power cables', 'Remove protective PCIe slot covers from case'] }
            ]
        },
        {
            id: 'ram', icon: 'fa-memory', title: 'RAM (Memory)',
            subtitle: 'Fast temporary working memory',
            overview: 'Random Access Memory provides ultra-fast temporary storage for data your CPU is actively using. More RAM lets you run more programs simultaneously without slowdown.',
            sections: [
                { heading: 'What It Does', body: 'RAM stores data that programs need to access quickly. Unlike storage drives, RAM is volatile — it loses all data when power is off. It bridges the speed gap between CPU cache and storage.' },
                { heading: 'Key Specifications', list: ['Capacity (16GB-64GB for most users)', 'Speed rating (DDR5-4800 to DDR5-8000)', 'CAS Latency (CL) — lower is faster', 'Number of sticks (dual-channel is ideal)', 'DDR generation — must match motherboard'] },
                { heading: 'Installation Tips', list: ['Check motherboard manual for optimal slot order', 'Use slots A2 + B2 for 2-stick dual-channel', 'Align the notch on the stick with the slot key', 'Press firmly until BOTH retention clips snap'] }
            ]
        },
        {
            id: 'motherboard', icon: 'fa-server', title: 'Motherboard',
            subtitle: 'The backbone connecting everything',
            overview: 'The motherboard is the main circuit board that physically and electrically connects every component in your PC. Choosing the right one determines your upgrade path.',
            sections: [
                { heading: 'What It Does', body: 'The motherboard provides data pathways (buses) between all components, delivers power, and houses the BIOS/UEFI firmware that initializes your hardware at boot.' },
                { heading: 'Key Specifications', list: ['CPU socket (LGA 1700, AM5, etc.)', 'Chipset (Z790, X670E, B650)', 'Form factor (ATX, Micro-ATX, Mini-ITX)', 'RAM slots and max supported speed', 'M.2 and PCIe slot count'] },
                { heading: 'Installation Tips', list: ['Install I/O shield before the board', 'Ensure all standoffs align with board holes', 'Connect front-panel headers carefully', 'Don\'t forget the 24-pin and EPS power cables'] }
            ]
        },
        {
            id: 'psu', icon: 'fa-plug', title: 'Power Supply (PSU)',
            subtitle: 'Provides clean, stable power',
            overview: 'The PSU converts alternating current (AC) from your wall outlet into the regulated direct current (DC) your components need. A quality PSU protects your entire system.',
            sections: [
                { heading: 'What It Does', body: 'The PSU steps down and converts voltage, provides multiple voltage rails (+3.3V, +5V, +12V), and includes protection circuits against surges, short circuits, and overloads.' },
                { heading: 'Key Specifications', list: ['Wattage (550W - 1000W for most builds)', '80 Plus efficiency rating (Bronze to Titanium)', 'Modularity (non, semi, fully modular)', 'Rail design (single vs multi-rail)', 'Fan size and noise rating'] },
                { heading: 'Installation Tips', list: ['Calculate total system draw + 20% headroom', 'Route cables behind the motherboard tray', 'Use only cables from YOUR PSU model', 'Fan faces down if case has bottom ventilation'] }
            ]
        },
        {
            id: 'storage', icon: 'fa-hard-drive', title: 'Storage (SSD / HDD)',
            subtitle: 'Stores your OS, games & files',
            overview: 'Storage drives hold your operating system, applications, games, and personal files permanently. NVMe SSDs are the fastest option; SATA SSDs and HDDs offer more capacity per dollar.',
            sections: [
                { heading: 'Types of Storage', list: ['NVMe SSD (M.2) — fastest, 3500-7300 MB/s', 'SATA SSD (2.5") — fast, 500-550 MB/s', 'HDD (3.5") — slowest, but cheapest per TB'] },
                { heading: 'Key Specifications', list: ['Capacity (500GB - 4TB per drive)', 'Sequential read/write speed', 'Random IOPS (important for OS responsiveness)', 'Interface (PCIe Gen 3/4/5, SATA III)', 'Endurance rating (TBW)'] },
                { heading: 'Installation Tips', list: ['Install OS on the fastest NVMe drive', 'M.2 SSDs screw directly into the motherboard', '2.5" SATA SSDs mount in drive bays with cables', 'Some M.2 slots may disable certain SATA ports'] }
            ]
        },
        {
            id: 'cooler', icon: 'fa-fan', title: 'CPU Cooler',
            subtitle: 'Keeps your processor cool under load',
            overview: 'CPU coolers transfer heat away from the processor to prevent thermal throttling and damage. Options range from compact stock coolers to massive tower air coolers and liquid coolers.',
            sections: [
                { heading: 'Types of Coolers', list: ['Stock cooler — bundled with some CPUs', 'Tower air cooler — heat pipes + fins + fan', 'AIO liquid cooler — pump + radiator + fans', 'Custom loop — maximum cooling, complex setup'] },
                { heading: 'Key Specifications', list: ['TDP rating (must exceed CPU TDP)', 'Fan size and noise level (dBA)', 'Cooler height (must fit in case)', 'Socket compatibility', 'Number of heat pipes'] },
                { heading: 'Installation Tips', list: ['Apply thermal paste (pea-sized dot in center)', 'Even mounting pressure on all corners', 'Connect fan header to CPU_FAN on board', 'Check RAM clearance for tower coolers'] }
            ]
        },
        {
            id: 'pccase', icon: 'fa-box', title: 'PC Case',
            subtitle: 'Houses and protects your build',
            overview: 'The PC case provides physical structure, airflow management, dust filtration, and aesthetic style. Choose a case that fits your motherboard size and has good cable routing options.',
            sections: [
                { heading: 'What to Look For', list: ['Form factor support (ATX, Micro-ATX, Mini-ITX)', 'Airflow design — mesh front panels are best', 'Cable management space behind motherboard tray', 'GPU length clearance', 'CPU cooler height clearance'] },
                { heading: 'Key Specifications', list: ['Supported motherboard sizes', 'Max GPU length', 'Max CPU cooler height', 'Fan mounting positions', 'Radiator support (240mm, 360mm)'] },
                { heading: 'Build Tips', list: ['Install case fans for intake (front) and exhaust (rear/top)', 'Remove all panels before building for easy access', 'Pre-route cables before installing the motherboard', 'Install I/O shield before mounting motherboard'] }
            ]
        }
    ];

    const COMPARE_DATA = {
        cpu: [
            {
                name: 'Core i9-14900K', brand: 'Intel', price: '$589',
                specs: [
                    { label: 'Cores / Threads', value: '24C / 32T', pct: 95 },
                    { label: 'Base Clock', value: '3.2 GHz', pct: 55 },
                    { label: 'Boost Clock', value: '6.0 GHz', pct: 98 },
                    { label: 'L3 Cache', value: '36 MB', pct: 85 },
                    { label: 'TDP', value: '125W (253W PBP)', pct: 70 }
                ]
            },
            {
                name: 'Ryzen 9 7950X', brand: 'AMD', price: '$549',
                specs: [
                    { label: 'Cores / Threads', value: '16C / 32T', pct: 85 },
                    { label: 'Base Clock', value: '4.5 GHz', pct: 75 },
                    { label: 'Boost Clock', value: '5.7 GHz', pct: 92 },
                    { label: 'L3 Cache', value: '64 MB', pct: 98 },
                    { label: 'TDP', value: '170W', pct: 65 }
                ]
            }
        ],
        gpu: [
            {
                name: 'RTX 4090', brand: 'NVIDIA', price: '$1,599',
                specs: [
                    { label: 'VRAM', value: '24 GB GDDR6X', pct: 98 },
                    { label: 'Boost Clock', value: '2.52 GHz', pct: 90 },
                    { label: 'CUDA Cores', value: '16,384', pct: 98 },
                    { label: 'Memory Bus', value: '384-bit', pct: 95 },
                    { label: 'TDP', value: '450W', pct: 45 }
                ]
            },
            {
                name: 'RX 7900 XTX', brand: 'AMD', price: '$949',
                specs: [
                    { label: 'VRAM', value: '24 GB GDDR6', pct: 95 },
                    { label: 'Boost Clock', value: '2.50 GHz', pct: 88 },
                    { label: 'Stream Processors', value: '12,288', pct: 82 },
                    { label: 'Memory Bus', value: '384-bit', pct: 95 },
                    { label: 'TDP', value: '355W', pct: 55 }
                ]
            }
        ],
        ram: [
            {
                name: 'Dominator Platinum', brand: 'Corsair', price: '$189',
                specs: [
                    { label: 'Capacity', value: '32GB (2×16)', pct: 75 },
                    { label: 'Speed', value: 'DDR5-6000', pct: 85 },
                    { label: 'Latency', value: 'CL36', pct: 72 },
                    { label: 'Voltage', value: '1.35V', pct: 80 },
                    { label: 'RGB', value: 'Capellix LED', pct: 95 }
                ]
            },
            {
                name: 'Trident Z5 RGB', brand: 'G.Skill', price: '$174',
                specs: [
                    { label: 'Capacity', value: '32GB (2×16)', pct: 75 },
                    { label: 'Speed', value: 'DDR5-6400', pct: 92 },
                    { label: 'Latency', value: 'CL32', pct: 85 },
                    { label: 'Voltage', value: '1.40V', pct: 70 },
                    { label: 'RGB', value: 'Tri-zone LED', pct: 90 }
                ]
            }
        ],
        storage: [
            {
                name: '990 PRO', brand: 'Samsung', price: '$169',
                specs: [
                    { label: 'Capacity', value: '2 TB', pct: 80 },
                    { label: 'Read Speed', value: '7,450 MB/s', pct: 95 },
                    { label: 'Write Speed', value: '6,900 MB/s', pct: 93 },
                    { label: 'Endurance', value: '1,200 TBW', pct: 88 },
                    { label: 'Interface', value: 'PCIe 4.0 x4', pct: 75 }
                ]
            },
            {
                name: 'T700', brand: 'Crucial', price: '$204',
                specs: [
                    { label: 'Capacity', value: '2 TB', pct: 80 },
                    { label: 'Read Speed', value: '12,400 MB/s', pct: 99 },
                    { label: 'Write Speed', value: '11,800 MB/s', pct: 99 },
                    { label: 'Endurance', value: '1,200 TBW', pct: 88 },
                    { label: 'Interface', value: 'PCIe 5.0 x4', pct: 98 }
                ]
            }
        ]
    };

    const CHALLENGES = [
        { id: 'speedbuild', icon: 'fa-bolt', title: 'Speed Build', desc: 'Complete a full PC assembly as fast as you can. Can you beat 3 minutes?', difficulty: 'easy', reward: '🏅 Speed Demon badge' },
        { id: 'guided', icon: 'fa-list-check', title: 'Guided Assembly', desc: 'Follow the step-by-step guide and learn proper installation order.', difficulty: 'easy', reward: '🎓 First Build badge' },
        { id: 'quiz', icon: 'fa-question', title: 'Component Quiz', desc: 'Test your knowledge — identify components and their specs.', difficulty: 'medium', reward: '🧠 Knowledge Master badge' },
        { id: 'order', icon: 'fa-sort', title: 'Correct Order', desc: 'Place all components in the correct installation order without hints.', difficulty: 'medium', reward: '📋 Order Expert badge' },
        { id: 'compatible', icon: 'fa-plug-circle-check', title: 'Compatibility Check', desc: 'Identify and fix incompatible component combinations.', difficulty: 'hard', reward: '🔧 Tech Wizard badge' },
        { id: 'blind', icon: 'fa-eye-slash', title: 'Blind Build', desc: 'Assemble a PC without any tooltips or guides. True expert mode!', difficulty: 'hard', reward: '👑 Build Master badge' }
    ];

    const ACHIEVEMENTS = [
        { id: 'first_build', icon: '🏗️', title: 'First Build', desc: 'Complete your first PC assembly' },
        { id: 'speed_demon', icon: '⚡', title: 'Speed Demon', desc: 'Complete build in under 60 seconds' },
        { id: 'knowledge', icon: '🧠', title: 'Knowledge Master', desc: 'Complete all learning modules' },
        { id: 'explorer', icon: '🔍', title: 'Explorer', desc: 'View all 3D component models' },
        { id: 'perfectionist', icon: '💎', title: 'Perfectionist', desc: 'Install every component in order' },
        { id: 'dedicated', icon: '📚', title: 'Dedicated Learner', desc: 'Complete 4+ learning modules' },
        { id: 'builder_3', icon: '🔨', title: 'Triple Builder', desc: 'Complete 3 builds' },
        { id: 'all_challenges', icon: '🏆', title: 'Champion', desc: 'Attempt all challenges' },
        { id: 'comparator', icon: '⚖️', title: 'Comparator', desc: 'View all comparison categories' },
        { id: 'master', icon: '👑', title: 'Build Master', desc: 'Earn 5 other achievements' }
    ];

    /* ================== STATE ================== */

    let state = loadState();
    let particleSystem = null;
    let heroScene = null;
    let simulator = null;
    let currentPage = 'home';

    function defaultState() {
        return {
            completedModules: [],
            unlockedAchievements: [],
            totalBuilds: 0,
            fastestBuild: null,
            viewedCompareCategories: [],
            attemptedChallenges: [],
            xp: 0
        };
    }

    function loadState() {
        try {
            const s = JSON.parse(localStorage.getItem('pcbuild_state'));
            return s ? { ...defaultState(), ...s } : defaultState();
        } catch { return defaultState(); }
    }

    function saveState() {
        localStorage.setItem('pcbuild_state', JSON.stringify(state));
    }

    function unlockAchievement(id) {
        if (state.unlockedAchievements.includes(id)) return false;
        state.unlockedAchievements.push(id);
        state.xp += 100;
        saveState();
        showAchievementToast(id);
        updateProgressUI();

        // Meta achievement
        if (state.unlockedAchievements.length >= 5 && !state.unlockedAchievements.includes('master')) {
            setTimeout(() => unlockAchievement('master'), 1500);
        }
        return true;
    }

    function showAchievementToast(id) {
        const ach = ACHIEVEMENTS.find(a => a.id === id);
        if (!ach) return;
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <span class="toast-icon">${ach.icon}</span>
            <div>
                <strong>Achievement Unlocked!</strong>
                <span>${ach.title}</span>
            </div>`;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 500);
        }, 3500);
    }

    /* ================== NAVIGATION ================== */

    function navigateTo(page) {
        if (page === currentPage) return;

        // Hide all pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        // Show target
        const target = document.getElementById('page-' + page);
        if (target) {
            target.classList.add('active');
            currentPage = page;
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        // Update nav links
        document.querySelectorAll('.nav-link').forEach(l => {
            l.classList.toggle('active', l.dataset.page === page);
        });

        // Initialize simulator scene when entering simulator (single call guaranteed by _building flag)
        if (page === 'simulator' && simulator) {
            setTimeout(() => {
                simulator.initScene();
                setTimeout(() => simulator.onResize(), 200);
            }, 120);
        }

        // Close mobile nav
        const navLinks = document.getElementById('nav-links');
        if (navLinks) navLinks.classList.remove('open');
    }

    /* ================== LOADING ================== */

    function runLoader() {
        const progress = document.getElementById('loader-progress');
        const text = document.getElementById('loader-text');
        const loader = document.getElementById('loader');

        const msgs = [
            'Loading 3D engine...',
            'Initializing components...',
            'Preparing simulator...',
            'Calibrating display...',
            'System ready.'
        ];

        let pct = 0;
        const interval = setInterval(() => {
            pct += Math.random() * 18 + 5;
            if (pct > 100) pct = 100;
            if (progress) progress.style.width = pct + '%';
            const msgIdx = Math.min(Math.floor(pct / 22), msgs.length - 1);
            if (text) text.textContent = msgs[msgIdx];

            if (pct >= 100) {
                clearInterval(interval);
                setTimeout(() => {
                    if (loader) loader.classList.add('hidden');
                    animateHero();
                }, 500);
            }
        }, 280);
    }

    /* ================== HERO ANIMATIONS ================== */

    function animateHero() {
        const items = document.querySelectorAll('#page-home .animate-in');
        items.forEach((el, i) => {
            setTimeout(() => el.classList.add('visible'), 150 * i);
        });

        // Counter animation
        document.querySelectorAll('.hero-stat-number').forEach(el => {
            const target = parseInt(el.dataset.count, 10);
            animateCounter(el, target, 1500);
        });
    }

    function animateCounter(el, target, duration) {
        const start = performance.now();
        const update = (now) => {
            const t = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = Math.round(target * eased);
            if (t < 1) requestAnimationFrame(update);
        };
        requestAnimationFrame(update);
    }

    /* ================== SCROLL ANIMATIONS ================== */

    function initScrollAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                }
            });
        }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

        document.querySelectorAll('[data-animate]').forEach(el => observer.observe(el));
    }

    /* ================== SIMULATOR UI ================== */

    /* ---- Category metadata ---- */
    const CATEGORIES = [
        { id:'all',          label:'All',         icon:'fa-th' },
        { id:'cpu',          label:'CPU',          icon:'fa-microchip' },
        { id:'motherboard',  label:'Motherboard',  icon:'fa-server' },
        { id:'memory',       label:'Memory',       icon:'fa-memory' },
        { id:'graphics',     label:'GPU',          icon:'fa-tv' },
        { id:'storage',      label:'Storage',      icon:'fa-hard-drive' },
        { id:'power',        label:'Power',        icon:'fa-plug' },
        { id:'cooling',      label:'Cooling',      icon:'fa-fan' },
        { id:'case',         label:'Case',         icon:'fa-box' },
        { id:'connectivity', label:'I/O',          icon:'fa-ethernet' },
        { id:'expansion',    label:'Expansion',    icon:'fa-puzzle-piece' },
    ];

    let activeCategory = 'all';

    function initSimulatorUI() {
        simulator = new PCSimulator('sim-canvas-container');

        /* ── Register raycasting callbacks used by simulator.js ── */
        window._simInstallCallback = (id) => handleComponentClick(id);
        window._simClickCallback   = (id) => {
            const comp = simulator.components.find(c => c.id === id);
            if (comp) showComponentInfo(comp);
        };

        // Build category filter bar
        const filterBar = document.getElementById('sim-category-filter');
        if (filterBar) {
            filterBar.innerHTML = CATEGORIES.map(cat => `
                <button class="cat-filter-btn ${cat.id === 'all' ? 'active' : ''}" data-cat="${cat.id}" title="${cat.label}">
                    <i class="fas ${cat.icon}"></i><span>${cat.label}</span>
                </button>
            `).join('');
            filterBar.addEventListener('click', e => {
                const btn = e.target.closest('.cat-filter-btn');
                if (!btn) return;
                filterBar.querySelectorAll('.cat-filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeCategory = btn.dataset.cat;
                renderComponentList();
            });
        }

        // Search
        const searchInput = document.getElementById('comp-search');
        if (searchInput) searchInput.addEventListener('input', () => renderComponentList());

        renderComponentList();

        // Sidebar click + drag
        const list = document.getElementById('component-list');
        if (list) {
            list.addEventListener('click', e => {
                const slot = e.target.closest('.comp-slot');
                if (slot) handleComponentClick(slot.dataset.id);
            });
            list.addEventListener('dragstart', e => {
                const slot = e.target.closest('.comp-slot');
                if (slot) {
                    e.dataTransfer.setData('text/plain', slot.dataset.id);
                    e.dataTransfer.effectAllowed = 'copy';
                }
            });
        }

        // Viewport controls
        document.getElementById('sim-zoom-in')?.addEventListener('click', () => simulator.zoomIn());
        document.getElementById('sim-zoom-out')?.addEventListener('click', () => simulator.zoomOut());
        document.getElementById('sim-rotate-toggle')?.addEventListener('click', () => {
            const on = simulator.toggleAutoRotate();
            document.getElementById('sim-rotate-toggle').classList.toggle('active', on);
        });
        document.getElementById('sim-reset-view')?.addEventListener('click', () => simulator.resetView());

        // Toggle PC Case panel open / close
        document.getElementById('sim-case-toggle')?.addEventListener('click', () => {
            const isOpen = simulator.toggleCasePanel();
            const btn = document.getElementById('sim-case-toggle');
            if (btn) {
                btn.classList.toggle('active', isOpen);
                btn.title = isOpen ? 'Close Case Panel' : 'Open Case Panel';
                btn.querySelector('i').className = isOpen ? 'fas fa-door-closed' : 'fas fa-door-open';
            }
        });

        // Fullscreen toggle
        document.getElementById('sim-fullscreen')?.addEventListener('click', () => {
            const container = document.getElementById('page-simulator');
            const btn = document.getElementById('sim-fullscreen');
            if (!document.fullscreenElement) {
                (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen).call(container);
                btn.querySelector('i').className = 'fas fa-compress-arrows-alt';
                btn.title = 'Exit Fullscreen';
            } else {
                (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen).call(document);
                btn.querySelector('i').className = 'fas fa-expand-arrows-alt';
                btn.title = 'Fullscreen';
            }
        });

        // Fullscreen change events (for when user presses Escape)
        document.addEventListener('fullscreenchange', () => {
            const btn = document.getElementById('sim-fullscreen');
            if (btn) {
                const isFs = !!document.fullscreenElement;
                btn.querySelector('i').className = isFs ? 'fas fa-compress-arrows-alt' : 'fas fa-expand-arrows-alt';
                btn.title = isFs ? 'Exit Fullscreen' : 'Fullscreen';
                btn.classList.toggle('active', isFs);
            }
            // Force resize after fullscreen change
            setTimeout(() => simulator && simulator.onResize(), 200);
        });

        document.getElementById('sim-start-btn')?.addEventListener('click', startGuidedBuild);
        document.getElementById('sim-reset-btn')?.addEventListener('click', resetSimulator);
        document.getElementById('modal-rebuild')?.addEventListener('click', () => {
            document.getElementById('sim-complete-modal').style.display = 'none';
            resetSimulator();
        });
    }

    function renderComponentList() {
        const list = document.getElementById('component-list');
        if (!list) return;
        const searchVal = (document.getElementById('comp-search')?.value || '').toLowerCase();
        const filtered = simulator.components.filter(c =>
            (activeCategory === 'all' || c.category === activeCategory) &&
            (!searchVal || c.name.toLowerCase().includes(searchVal))
        );

        // Group by category for 'all' view
        if (activeCategory === 'all') {
            const groups = {};
            filtered.forEach(c => { (groups[c.category] = groups[c.category] || []).push(c); });
            list.innerHTML = Object.entries(groups).map(([cat, comps]) => {
                const catInfo = CATEGORIES.find(x => x.id === cat) || { label: cat, icon: 'fa-cube' };
                return `
                    <div class="comp-category-group">
                        <div class="comp-category-label"><i class="fas ${catInfo.icon}"></i> ${catInfo.label}</div>
                        ${comps.map(c => compSlotHTML(c)).join('')}
                    </div>`;
            }).join('');
        } else {
            list.innerHTML = filtered.map(c => compSlotHTML(c)).join('');
        }
    }

    function compSlotHTML(c) {
        const installed = simulator.installedComponents.has(c.id);
        return `
            <div class="comp-slot ${installed ? 'installed' : ''}" data-id="${c.id}" id="slot-${c.id}" draggable="true"
                 title="${c.tip || c.desc}">
                <div class="comp-slot-icon"><i class="fas ${c.icon}"></i></div>
                <div class="comp-slot-info">
                    <h4>${c.name}</h4>
                    <span class="comp-cat-badge">${c.category}</span>
                    <span class="comp-status">${installed ? 'Installed ✓' : 'Click / drag to install'}</span>
                </div>
                ${installed ? '<div class="comp-installed-mark"><i class="fas fa-circle-check"></i></div>' : ''}
            </div>`;
    }

    function handleComponentClick(id) {
        const comp = simulator.components.find(c => c.id === id);
        if (!comp) return;

        // Show info
        showComponentInfo(comp);

        // Highlight sidebar slot
        document.querySelectorAll('.comp-slot').forEach(s => s.classList.remove('active'));
        document.getElementById('slot-' + id)?.classList.add('active');

        // If in guided mode, check order
        if (simulator.isGuided) {
            const step = simulator.getCurrentStep();
            if (step && step.componentId !== id) {
                updateStepInstruction('⚠️ Not the right step! Please install: ' + simulator.components.find(c => c.id === step.componentId)?.name);
                return;
            }
        }

        // Install
        if (!simulator.buildStartTime) {
            simulator.buildStartTime = Date.now();
        }

        simulator.installComponent(id, () => {
            renderComponentList();
            updateProgress();

            // Canvas flash effect on install
            const canvas = document.getElementById('sim-canvas-container');
            if (canvas) {
                canvas.classList.add('install-flash');
                setTimeout(() => canvas.classList.remove('install-flash'), 750);
            }

            // Advance guided step
            if (simulator.isGuided) {
                const next = simulator.advanceStep();
                if (next) {
                    updateStepInstruction(next.instruction);
                    document.getElementById('step-current').textContent = 'Step ' + (simulator.currentStep + 1);
                } else {
                    completeBuild();
                }
            }

            // Check free-build completion
            if (!simulator.isGuided && simulator.isBuildComplete()) {
                completeBuild();
            }
        });
    }

    function showComponentInfo(comp) {
        document.getElementById('comp-info-name').textContent = comp.name;
        document.getElementById('comp-info-desc').textContent = comp.desc;

        const specsEl = document.getElementById('comp-info-specs');
        specsEl.innerHTML = Object.entries(comp.specs).map(([k, v]) =>
            `<div class="spec-row"><span class="spec-label">${k}</span><span class="spec-value">${v}</span></div>`
        ).join('');

        const tipEl = document.getElementById('comp-info-tip');
        const tipText = document.getElementById('comp-info-tip-text');
        if (comp.tip) {
            tipEl.style.display = 'flex';
            tipText.textContent = comp.tip;
        } else {
            tipEl.style.display = 'none';
        }

        // Hide viewport hint
        const hint = document.getElementById('sim-viewport-hint');
        if (hint) hint.style.display = 'none';
    }

    function updateStepInstruction(text) {
        const el = document.getElementById('step-instruction');
        if (el) el.textContent = text;
    }

    function updateProgress() {
        const pct = Math.round(simulator.getBuildProgress() * 100);
        const fill = document.getElementById('sim-progress-fill');
        const txt = document.getElementById('sim-progress-text');
        if (fill) fill.style.width = pct + '%';
        if (txt) txt.textContent = pct + '%';
    }

    function startGuidedBuild() {
        resetSimulator();
        const step = simulator.startGuidedBuild();
        if (step) {
            updateStepInstruction(step.instruction);
            document.getElementById('step-current').textContent = 'Step 1';
            document.getElementById('sim-start-btn').innerHTML = '<i class="fas fa-play"></i> In Progress...';
            document.getElementById('sim-start-btn').disabled = true;
        }
    }

    function resetSimulator() {
        simulator.resetBuild();
        updateProgress();
        updateStepInstruction('Click "Start Guided Build" or select a component to begin.');
        document.getElementById('step-current').textContent = 'Step 0';
        renderComponentList();
        const hint = document.getElementById('sim-viewport-hint');
        if (hint) hint.style.display = '';
        const btn = document.getElementById('sim-start-btn');
        if (btn) { btn.innerHTML = '<i class="fas fa-play"></i> Start Guided Build'; btn.disabled = false; }
    }

    function completeBuild() {
        const time = simulator.getBuildTime();
        state.totalBuilds++;

        if (!state.fastestBuild || time < state.fastestBuild) {
            state.fastestBuild = time;
        }
        saveState();

        // Show modal
        const modal = document.getElementById('sim-complete-modal');
        if (modal) {
            document.getElementById('modal-stats').innerHTML = `
                <div class="modal-stat-item"><span class="stat-val">${formatTime(time)}</span><span class="stat-lbl">Build Time</span></div>
                <div class="modal-stat-item"><span class="stat-val">${state.totalBuilds}</span><span class="stat-lbl">Total Builds</span></div>
                <div class="modal-stat-item"><span class="stat-val">${formatTime(state.fastestBuild)}</span><span class="stat-lbl">Best Time</span></div>
            `;
            modal.style.display = 'flex';
        }

        // Achievements
        unlockAchievement('first_build');
        if (simulator.isGuided) unlockAchievement('perfectionist');
        if (time <= 60) unlockAchievement('speed_demon');
        if (state.totalBuilds >= 3) unlockAchievement('builder_3');

        updateProgressUI();
    }

    function formatTime(secs) {
        if (!secs) return '--:--';
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    /* ================== LEARN UI ================== */

    function initLearnUI() {
        const grid = document.getElementById('modules-grid');
        if (!grid) return;

        grid.innerHTML = LEARNING_MODULES.map(m => {
            const done = state.completedModules.includes(m.id);
            return `
                <div class="module-card glass-card ${done ? 'completed' : ''}" data-module="${m.id}" data-animate>
                    <div class="module-icon"><i class="fas ${m.icon}"></i></div>
                    <h3>${m.title}</h3>
                    <p>${m.subtitle}</p>
                    <div class="module-card-footer">
                        <span class="module-status">
                            <i class="fas ${done ? 'fa-circle-check' : 'fa-circle'}"></i>
                            ${done ? 'Completed' : 'Not started'}
                        </span>
                        <span class="module-arrow"><i class="fas fa-arrow-right"></i></span>
                    </div>
                </div>`;
        }).join('');

        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.module-card');
            if (!card) return;
            openModuleDetail(card.dataset.module);
        });

        // Close module detail
        document.getElementById('module-close')?.addEventListener('click', closeModuleDetail);
        document.getElementById('module-detail-overlay')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) closeModuleDetail();
        });

        document.getElementById('module-complete-btn')?.addEventListener('click', completeCurrentModule);

        updateLearnProgress();
    }

    let currentModuleId = null;

    function openModuleDetail(moduleId) {
        const mod = LEARNING_MODULES.find(m => m.id === moduleId);
        if (!mod) return;
        currentModuleId = moduleId;

        document.getElementById('module-detail-header').innerHTML = `
            <h2><i class="fas ${mod.icon}" style="color:var(--primary);margin-right:8px;"></i>${mod.title}</h2>
            <p>${mod.overview}</p>
        `;

        document.getElementById('module-detail-content').innerHTML = mod.sections.map(s => {
            let body = '';
            if (s.body) body += `<p>${s.body}</p>`;
            if (s.list) body += `<ul>${s.list.map(li => `<li>${li}</li>`).join('')}</ul>`;
            return `<h3>${s.heading}</h3>${body}`;
        }).join('');

        const btn = document.getElementById('module-complete-btn');
        if (state.completedModules.includes(moduleId)) {
            btn.innerHTML = '<i class="fas fa-check"></i> Completed';
            btn.className = 'btn btn-success';
        } else {
            btn.innerHTML = '<i class="fas fa-check"></i> Mark as Completed';
            btn.className = 'btn btn-primary';
        }

        document.getElementById('module-detail-overlay').style.display = 'flex';
    }

    function closeModuleDetail() {
        document.getElementById('module-detail-overlay').style.display = 'none';
        currentModuleId = null;
    }

    function completeCurrentModule() {
        if (!currentModuleId) return;
        if (!state.completedModules.includes(currentModuleId)) {
            state.completedModules.push(currentModuleId);
            saveState();

            const card = document.querySelector(`.module-card[data-module="${currentModuleId}"]`);
            if (card) {
                card.classList.add('completed');
                card.querySelector('.module-status').innerHTML = '<i class="fas fa-circle-check"></i> Completed';
            }

            updateLearnProgress();

            const btn = document.getElementById('module-complete-btn');
            btn.innerHTML = '<i class="fas fa-check"></i> Completed';
            btn.className = 'btn btn-success';

            // Achievements
            if (state.completedModules.length >= 4) unlockAchievement('dedicated');
            if (state.completedModules.length >= LEARNING_MODULES.length) unlockAchievement('knowledge');
        }
    }

    function updateLearnProgress() {
        const done = state.completedModules.length;
        const total = LEARNING_MODULES.length;
        const pct = Math.round((done / total) * 100);
        const fill = document.getElementById('learn-progress-fill');
        const count = document.getElementById('modules-completed');
        if (fill) fill.style.width = pct + '%';
        if (count) count.textContent = done;
    }

    /* ================== COMPARE UI ================== */

    function initCompareUI() {
        const tabs = document.getElementById('compare-tabs');
        const cards = document.getElementById('compare-cards');
        if (!tabs || !cards) return;

        tabs.addEventListener('click', (e) => {
            const tab = e.target.closest('.compare-tab');
            if (!tab) return;
            tabs.querySelectorAll('.compare-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderCompareCards(tab.dataset.category);

            if (!state.viewedCompareCategories.includes(tab.dataset.category)) {
                state.viewedCompareCategories.push(tab.dataset.category);
                saveState();
                if (state.viewedCompareCategories.length >= Object.keys(COMPARE_DATA).length) {
                    unlockAchievement('comparator');
                }
            }
        });

        renderCompareCards('cpu');
    }

    function renderCompareCards(category) {
        const cards = document.getElementById('compare-cards');
        const data = COMPARE_DATA[category];
        if (!cards || !data) return;

        cards.innerHTML = data.map(item => `
            <div class="compare-card glass-card">
                <div class="compare-card-header">
                    <h3>${item.name}</h3>
                    <div class="compare-brand">${item.brand}</div>
                    <div class="compare-price">${item.price}</div>
                </div>
                <div class="compare-spec-list">
                    ${item.specs.map(s => `
                        <div class="compare-spec">
                            <div class="compare-spec-header">
                                <span class="compare-spec-label">${s.label}</span>
                                <span class="compare-spec-value">${s.value}</span>
                            </div>
                            <div class="compare-spec-bar">
                                <div class="compare-spec-bar-fill ${s.pct > 80 ? 'high' : s.pct > 50 ? 'mid' : 'low'}"
                                     style="width: 0%" data-width="${s.pct}"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');

        // Animate bars
        requestAnimationFrame(() => {
            setTimeout(() => {
                cards.querySelectorAll('.compare-spec-bar-fill').forEach(bar => {
                    bar.style.width = bar.dataset.width + '%';
                });
            }, 100);
        });
    }

    /* ================== CHALLENGES & ACHIEVEMENTS ================== */

    function initChallengesUI() {
        const grid = document.getElementById('challenges-grid');
        if (grid) {
            grid.innerHTML = CHALLENGES.map(c => `
                <div class="challenge-card glass-card" data-challenge="${c.id}">
                    <span class="challenge-difficulty ${c.difficulty}">${c.difficulty}</span>
                    <div class="challenge-icon"><i class="fas ${c.icon}"></i></div>
                    <h3>${c.title}</h3>
                    <p>${c.desc}</p>
                    <div class="challenge-reward"><i class="fas fa-gift"></i> ${c.reward}</div>
                    <div class="challenge-action">
                        <button class="btn btn-sm btn-outline challenge-start-btn" data-challenge="${c.id}">
                            <i class="fas fa-play"></i> Start Challenge
                        </button>
                    </div>
                </div>
            `).join('');

            grid.addEventListener('click', (e) => {
                const btn = e.target.closest('.challenge-start-btn');
                if (!btn) return;
                const challengeId = btn.dataset.challenge;
                if (!state.attemptedChallenges.includes(challengeId)) {
                    state.attemptedChallenges.push(challengeId);
                    saveState();
                    if (state.attemptedChallenges.length >= CHALLENGES.length) {
                        unlockAchievement('all_challenges');
                    }
                }
                // Navigate to simulator for build challenges
                if (['speedbuild', 'guided', 'order', 'blind'].includes(challengeId)) {
                    navigateTo('simulator');
                    if (challengeId === 'guided') {
                        setTimeout(() => startGuidedBuild(), 500);
                    }
                }
            });
        }

        // Badges
        const badgesGrid = document.getElementById('badges-grid');
        if (badgesGrid) {
            badgesGrid.innerHTML = ACHIEVEMENTS.map(a => {
                const unlocked = state.unlockedAchievements.includes(a.id);
                return `
                    <div class="badge-item ${unlocked ? 'unlocked' : 'locked'}">
                        <span class="badge-icon">${a.icon}</span>
                        <h4>${a.title}</h4>
                        <p>${a.desc}</p>
                    </div>`;
            }).join('');
        }
    }

    /* ================== PROGRESS UI ================== */

    function updateProgressUI() {
        const totalPossible = ACHIEVEMENTS.length;
        const unlocked = state.unlockedAchievements.length;
        const pct = Math.round((unlocked / totalPossible) * 100);

        const fill = document.getElementById('nav-progress-fill');
        if (fill) fill.style.width = pct + '%';

        const label = document.getElementById('nav-progress-label');
        if (label) {
            const level = Math.floor(unlocked / 2) + 1;
            label.textContent = 'Level ' + level;
        }

        // Update badges grid if on challenges page
        initChallengesUI();
    }

    /* ================== NAVBAR ================== */

    function initNavbar() {
        // Nav link clicks
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                navigateTo(link.dataset.page);
            });
        });

        // data-navigate buttons
        document.querySelectorAll('[data-navigate]').forEach(btn => {
            btn.addEventListener('click', () => navigateTo(btn.dataset.navigate));
        });

        // Mobile toggle
        const toggle = document.getElementById('nav-toggle');
        const navLinks = document.getElementById('nav-links');
        if (toggle && navLinks) {
            toggle.addEventListener('click', () => navLinks.classList.toggle('open'));
        }

        // Scroll effect
        window.addEventListener('scroll', () => {
            document.getElementById('navbar')?.classList.toggle('scrolled', window.scrollY > 50);
        });
    }

    /* ================== ACHIEVEMENT TOAST STYLES (injected) ================== */

    function injectToastStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .achievement-toast {
                position: fixed; bottom: 2rem; right: 2rem; z-index: 9999;
                display: flex; align-items: center; gap: 12px;
                padding: 14px 24px;
                background: rgba(12, 12, 35, 0.95);
                border: 1px solid rgba(255, 170, 0, 0.4);
                border-radius: 12px;
                backdrop-filter: blur(12px);
                box-shadow: 0 0 30px rgba(255, 170, 0, 0.15);
                color: #e0e0ff;
                font-family: 'Inter', sans-serif;
                transform: translateX(120%);
                transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
            }
            .achievement-toast.show { transform: translateX(0); }
            .toast-icon { font-size: 1.8rem; }
            .achievement-toast strong {
                display: block; font-size: 0.7rem;
                color: #ffaa00; text-transform: uppercase;
                letter-spacing: 1px; margin-bottom: 2px;
            }
            .achievement-toast span { font-size: 0.85rem; }

            .sim-ctrl-btn.active {
                background: rgba(0, 212, 255, 0.15);
                color: #00d4ff;
                border-color: #00d4ff;
            }
        `;
        document.head.appendChild(style);
    }

    /* ================== INIT ================== */

    function init() {
        injectToastStyles();
        runLoader();

        // Particle background
        particleSystem = new ParticleSystem('particles');

        // Hero 3D scene
        heroScene = new HeroScene('hero-canvas-container');

        // Navigation
        initNavbar();

        // Simulator
        initSimulatorUI();

        // Learn
        initLearnUI();

        // Compare
        initCompareUI();

        // Challenges & achievements
        initChallengesUI();

        // Scroll animations
        initScrollAnimations();

        // Progress
        updateProgressUI();
    }

    // Boot
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();

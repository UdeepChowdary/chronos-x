document.addEventListener('DOMContentLoaded', () => {
    // -------------------------------------------------------------
    // UI ELEMENTS
    // -------------------------------------------------------------
    const body = document.body;
    const timelineNodes = document.querySelectorAll('.timeline-node');
    const timelineHandle = document.getElementById('timelineHandle');
    const timelineTrack = document.querySelector('.timeline-track');
    
    // Telemetry display fields
    const depthVal = document.getElementById('depthVal');
    const fluxVal = document.getElementById('fluxVal');
    const coreVal = document.getElementById('coreVal');
    const gadgetTitle = document.getElementById('gadgetTitle');
    const eraTag = document.getElementById('eraTag');
    
    // Audio controls
    const audioToggle = document.getElementById('audioToggle');
    const volumeSlider = document.getElementById('volumeSlider');
    const sfxToggle = document.getElementById('sfxToggle');
    const visualizer = document.getElementById('ambientVisualizer');
    
    // Telemetry console body
    const consoleBody = document.getElementById('consoleBody');

    // -------------------------------------------------------------
    // LOGGING UTIL
    // -------------------------------------------------------------
    function addLog(text, type = 'text-system') {
        const line = document.createElement('div');
        line.className = `console-line ${type}`;
        line.textContent = text;
        consoleBody.appendChild(line);
        consoleBody.scrollTop = consoleBody.scrollHeight;
    }

    // -------------------------------------------------------------
    // INITIALIZE ERA WIDGETS
    // -------------------------------------------------------------
    let activeGearWidget = null;
    let activeSequencerWidget = null;
    let activeDecryptorWidget = null;
    let activeStarPlotterWidget = null;

    function initWidgets() {
        // 1500 Gear Setup
        activeGearWidget = new GearWidget('gearCanvas');
        const crankSlider = document.getElementById('crankSlider');
        crankSlider.addEventListener('input', (e) => {
            activeGearWidget.setRotation(parseInt(e.target.value));
        });
        document.getElementById('resetGearsBtn').addEventListener('click', () => {
            crankSlider.value = 0;
            activeGearWidget.reset();
            addLog('[DA VINCI ENGINE]: Mechanical alignments reset to default ratios.', 'text-success');
        });

        // 1983 Sequencer Setup
        activeSequencerWidget = new SequencerWidget(
            'sequencerGrid', 
            'sequencerPlayBtn', 
            'sequencerClearBtn', 
            'tempoSlider'
        );

        // 2099 Decryptor Setup
        activeDecryptorWidget = new DecryptorWidget(
            'terminalGrid',
            'tracePercent',
            'traceBar',
            'cyberStatus',
            'bypassBtn'
        );

        // 3026 Star HUD Setup
        activeStarPlotterWidget = new StarPlotterWidget(
            'starCanvas',
            'targetStar',
            'warpBtn'
        );
    }

    // -------------------------------------------------------------
    // ERA TRANSITION LOGIC
    // -------------------------------------------------------------
    const erasConfig = {
        '1500': {
            title: "LEONARDO'S MECHANICAL DRAUGHT",
            tag: "ERA: 1500 (RENAISSANCE)",
            depth: "-526.3 Yrs",
            flux: "24.0 MPH",
            core: "MECHANICAL PEGS",
            handleLeft: "0%",
            themeClass: "theme-1500",
            narrative: [
                "[SYSTEM]: Temporal vectors aligned to Florence, Renaissance Italy (1500 AD).",
                "[TELEMETRY]: System operates on mechanical tension. Torque ratio feedback enabled.",
                "[LOG]: Galileo star charts are catalogued. Kinetic crank gears ready for rotation."
            ]
        },
        '1983': {
            title: "SYNTHWAVE FM SEQUENCER",
            tag: "ERA: 1983 (RETRO-FUTURE)",
            depth: "-43.2 Yrs",
            flux: "88.0 MPH",
            core: "FM STABLE",
            handleLeft: "33.33%",
            themeClass: "theme-1983",
            narrative: [
                "[SYSTEM]: Space-time jump completed to 1983 AD.",
                "[TELEMETRY]: Lofi matrix grid stabilized. VHS scanline density at 92%.",
                "[LOG]: Track modulation sweep aligned. Insert audio steps to sync clock cycles."
            ]
        },
        '2099': {
            title: "NEO-TOKYO SECURITY BYPASS",
            tag: "ERA: 2099 (CYBERPUNK)",
            depth: "+72.8 Yrs",
            flux: "142.5 MPH",
            core: "OVERVOLTAGE DETECTED",
            handleLeft: "66.66%",
            themeClass: "theme-2099",
            narrative: [
                "[SYSTEM]: Temporal core re-routed to 2099 AD (Neo-Tokyo).",
                "[TELEMETRY]: Warning! Firewall intrusion trace active. Decrypt glitched nodes immediately.",
                "[LOG]: Neural bridge initialized. Direct injection ready."
            ]
        },
        '3026': {
            title: "CELESTIAL NAVIGATION INTERFACE",
            tag: "ERA: 3026 (HYPERSPACE)",
            depth: "+1000.2 Yrs",
            flux: "99.9% LIGHT",
            core: "SINGULARITY ROTOR",
            handleLeft: "100%",
            themeClass: "theme-3026",
            narrative: [
                "[SYSTEM]: Coordinate leap resolved to 3026 AD (Deep Space Void).",
                "[TELEMETRY]: Singularity engine stabilized. Gravity field bending active.",
                "[LOG]: Align vector angles on stellar globe. Warp drive initialized."
            ]
        }
    };

    function transitionToEra(era, isInitialLoad = false) {
        const config = erasConfig[era];
        if (!config) return;

        // Change body class to update styling themes
        body.className = '';
        body.classList.add(config.themeClass);

        // Update Timeline visual nodes active states
        timelineNodes.forEach(node => {
            if (node.dataset.era === era) {
                node.classList.add('active');
            } else {
                node.classList.remove('active');
            }
        });

        // Set Slider Handle position
        timelineHandle.style.left = config.handleLeft;

        // Update HUD Telemetry fields
        depthVal.textContent = config.depth;
        fluxVal.textContent = config.flux;
        coreVal.textContent = config.core;
        gadgetTitle.textContent = config.title;
        eraTag.textContent = config.tag;

        // Switch Active Widget visibility in DOM
        document.querySelectorAll('.gadget-wrapper').forEach(wrapper => {
            if (wrapper.id === `gadget-${era}`) {
                wrapper.classList.add('active');
            } else {
                wrapper.classList.remove('active');
            }
        });

        // Shutdown active timers on inactive widgets
        if (era !== '1983' && activeSequencerWidget) activeSequencerWidget.stop();
        if (era !== '2099' && activeDecryptorWidget) activeDecryptorWidget.stop();

        // Start specific widget routines if needed
        if (era === '2099') {
            activeDecryptorWidget.startDecryption();
        } else if (era === '3026') {
            activeStarPlotterWidget.init();
        } else if (era === '1500') {
            activeGearWidget.init();
        }

        // Play sounds
        if (!isInitialLoad) {
            window.TimeAudio.playTransitionSFX();
        }
        window.TimeAudio.setEra(era);

        // Append era-shift logs to the terminal
        addLog('----------------------------------------------------', 'text-system');
        config.narrative.forEach(line => {
            let logType = 'text-telemetry';
            if (line.includes('Warning!') || line.includes('OVERVOLTAGE')) logType = 'text-warning';
            addLog(line, logType);
        });
    }

    // -------------------------------------------------------------
    // TIMELINE SLIDER INPUT EVENTS
    // -------------------------------------------------------------
    // Set default era (1983)
    transitionToEra('1983', true);

    // Add click listeners to timeline nodes
    timelineNodes.forEach(node => {
        node.addEventListener('click', () => {
            const era = node.dataset.era;
            transitionToEra(era);
        });
    });

    // Timeline Drag mechanics
    let isDraggingHandle = false;
    timelineHandle.addEventListener('mousedown', () => {
        isDraggingHandle = true;
    });

    window.addEventListener('mouseup', () => {
        isDraggingHandle = false;
    });

    window.addEventListener('mousemove', (e) => {
        if (!isDraggingHandle) return;
        
        const trackRect = timelineTrack.getBoundingClientRect();
        let posX = e.clientX - trackRect.left;
        posX = Math.max(0, Math.min(posX, trackRect.width));
        
        const percent = (posX / trackRect.width) * 100;
        
        // Snap to nearest node (0%, 33.3%, 66.6%, 100%)
        let targetEra = '1500';
        if (percent >= 16.6 && percent < 50) {
            targetEra = '1983';
        } else if (percent >= 50 && percent < 83.3) {
            targetEra = '2099';
        } else if (percent >= 83.3) {
            targetEra = '3026';
        }

        const activeNode = document.querySelector('.timeline-node.active');
        if (activeNode && activeNode.dataset.era !== targetEra) {
            transitionToEra(targetEra);
        }
    });

    // Mobile touch events for slider
    timelineHandle.addEventListener('touchstart', () => {
        isDraggingHandle = true;
    });
    window.addEventListener('touchend', () => {
        isDraggingHandle = false;
    });
    window.addEventListener('touchmove', (e) => {
        if (!isDraggingHandle || e.touches.length === 0) return;
        const touch = e.touches[0];
        
        const trackRect = timelineTrack.getBoundingClientRect();
        let posX = touch.clientX - trackRect.left;
        posX = Math.max(0, Math.min(posX, trackRect.width));
        
        const percent = (posX / trackRect.width) * 100;
        
        let targetEra = '1500';
        if (percent >= 16.6 && percent < 50) {
            targetEra = '1983';
        } else if (percent >= 50 && percent < 83.3) {
            targetEra = '2099';
        } else if (percent >= 83.3) {
            targetEra = '3026';
        }

        const activeNode = document.querySelector('.timeline-node.active');
        if (activeNode && activeNode.dataset.era !== targetEra) {
            transitionToEra(targetEra);
        }
    });

    // -------------------------------------------------------------
    // AUDIO CONTROL PANEL ACTIONS
    // -------------------------------------------------------------
    audioToggle.addEventListener('click', () => {
        const textSpan = audioToggle.querySelector('.btn-text');
        const iconSpan = audioToggle.querySelector('.btn-icon');
        
        if (window.TimeAudio.isPlayingAmbience) {
            window.TimeAudio.stopAmbience();
            textSpan.textContent = 'START AUDIO';
            iconSpan.textContent = '▶';
            visualizer.classList.remove('playing');
            addLog('[AUDIO]: Ambient synthesizer offline.', 'text-system');
        } else {
            window.TimeAudio.startAmbience();
            textSpan.textContent = 'STOP AUDIO';
            iconSpan.textContent = '■';
            visualizer.classList.add('playing');
            addLog('[AUDIO]: Procedural synthesizer activated. Generating ambient frequency grids.', 'text-success');
        }
    });

    volumeSlider.addEventListener('input', (e) => {
        window.TimeAudio.setVolume(parseInt(e.target.value));
    });

    sfxToggle.addEventListener('change', (e) => {
        window.TimeAudio.toggleSFX(e.target.checked);
    });

    // Simple document level click SFX feed
    document.addEventListener('click', (e) => {
        // Prevent click trigger double-firing when clicking button that has its own SFX triggers
        if (e.target.closest('.btn') || e.target.closest('.sequencer-pad') || e.target.closest('.hex-cell')) {
            return;
        }
        window.TimeAudio.playClickSFX();
    });

    // -------------------------------------------------------------
    // DYNAMIC AUDIO EQUALIZER BOUNCE VIA ANALYSER
    // -------------------------------------------------------------
    function updateVisualizer() {
        requestAnimationFrame(updateVisualizer);
        if (!window.TimeAudio.audioCtx || !window.TimeAudio.isPlayingAmbience) {
            return;
        }

        const bufferLength = window.TimeAudio.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        window.TimeAudio.analyser.getByteFrequencyData(dataArray);

        const bars = visualizer.querySelectorAll('.bar');
        bars.forEach((bar, index) => {
            // Map freq bin byte to heights
            const freqVal = dataArray[index % bufferLength] || 0;
            const heightPercent = Math.max(10, (freqVal / 255) * 100);
            bar.style.height = `${heightPercent}%`;
        });
    }

    // Start Widgets & Visualizer Animation loop
    initWidgets();
    updateVisualizer();
});

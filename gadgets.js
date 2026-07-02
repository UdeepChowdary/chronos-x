class GearWidget {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.angle = 0;
        this.lastSfxAngle = 0;
        this.isDrawing = false;
        
        // Interlock details
        this.gears = [
            { x: 130, y: 175, r: 80, teeth: 18, color: '#8b6e4e', speedMult: 1 },
            { x: 265, y: 175, r: 50, teeth: 11, color: '#a0805c', speedMult: -1.636 },
            { x: 380, y: 175, r: 60, teeth: 13, color: '#73573c', speedMult: 1.384 }
        ];

        this.init();
    }

    init() {
        this.draw();
    }

    setRotation(deg) {
        this.angle = (deg * Math.PI) / 180;
        
        // Trigger soft mechanical click sound when gear rotates significantly
        const delta = Math.abs(deg - this.lastSfxAngle);
        if (delta >= 15) {
            window.TimeAudio.playClickSFX();
            this.lastSfxAngle = deg;
        }
        
        this.draw();
    }

    reset() {
        this.angle = 0;
        this.lastSfxAngle = 0;
        this.draw();
        window.TimeAudio.playSuccessSFX();
    }

    draw() {
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Canvas styling - Renaissance Da Vinci parchment sketching style
        ctx.strokeStyle = '#5c4033';
        ctx.fillStyle = '#5c4033';
        ctx.lineWidth = 1.5;

        // Draw mechanical drawing blueprints details
        ctx.font = 'italic 10px "Special Elite"';
        ctx.fillText('Codice Atlantico - Fig. XII', 20, 30);
        ctx.fillText('Ratio: 18 : 11 : 13', 20, 45);
        ctx.fillText('Kinetic Torque Transfer', 20, 60);
        
        // Draw grid lines like layout designs
        ctx.strokeStyle = 'rgba(92, 64, 51, 0.08)';
        ctx.beginPath();
        for (let x = 0; x < this.canvas.width; x += 30) {
            ctx.moveTo(x, 0); ctx.lineTo(x, this.canvas.height);
        }
        for (let y = 0; y < this.canvas.height; y += 30) {
            ctx.moveTo(0, y); ctx.lineTo(this.canvas.width, y);
        }
        ctx.stroke();

        ctx.strokeStyle = '#5c4033';

        // Draw the interlocking gears
        this.gears.forEach((gear) => {
            const gearAngle = this.angle * gear.speedMult;
            this.drawGear(gear.x, gear.y, gear.r, gear.teeth, gearAngle, gear.color);
        });

        // Draw linkage lines (blueprints style)
        ctx.strokeStyle = 'rgba(92, 64, 51, 0.3)';
        ctx.beginPath();
        ctx.moveTo(this.gears[0].x, this.gears[0].y);
        ctx.lineTo(this.gears[2].x, this.gears[2].y);
        ctx.stroke();
    }

    drawGear(x, y, r, teeth, rotation, color) {
        const ctx = this.ctx;
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // Shadow/wood tone fill
        ctx.fillStyle = color;
        ctx.strokeStyle = '#3c2a1a';
        ctx.lineWidth = 2.5;

        // Draw teeth outer outline
        ctx.beginPath();
        const toothDepth = r * 0.16;
        const outerR = r + toothDepth;
        const step = Math.PI / teeth;

        for (let i = 0; i < teeth * 2; i++) {
            const radius = (i % 2 === 0) ? r : outerR;
            const angle = i * step;
            ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Draw main body circle
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.75, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(236, 220, 185, 0.5)';
        ctx.fill();
        ctx.stroke();

        // Draw spokes (spokes look hand-made)
        ctx.beginPath();
        for (let j = 0; j < 4; j++) {
            const angle = (j * Math.PI) / 2;
            ctx.moveTo(0, 0);
            ctx.lineTo(Math.cos(angle) * r * 0.75, Math.sin(angle) * r * 0.75);
        }
        ctx.stroke();

        // Core bolt
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = '#3c2a1a';
        ctx.fill();

        ctx.restore();
    }
}


class SequencerWidget {
    constructor(gridId, playBtnId, clearBtnId, tempoId) {
        this.grid = document.getElementById(gridId);
        this.playBtn = document.getElementById(playBtnId);
        this.clearBtn = document.getElementById(clearBtnId);
        this.tempoInput = document.getElementById(tempoId);
        
        this.cols = 8;
        this.rows = 8;
        this.isPlaying = false;
        this.currentStep = 0;
        this.stepInterval = null;
        
        // Sequencer grid matrix (0: inactive, 1: active)
        this.matrix = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
        
        // Sound frequencies for rows (Hi-Hat, Snare, Synth notes, Kick)
        this.rowSounds = [
            { type: 'hat', note: null },
            { type: 'snare', note: null },
            { type: 'synth', note: 987.77 }, // B5
            { type: 'synth', note: 880.00 }, // A5
            { type: 'synth', note: 659.25 }, // E5
            { type: 'synth', note: 587.33 }, // D5
            { type: 'synth', note: 440.00 }, // A4
            { type: 'bass', note: null }
        ];

        this.init();
    }

    init() {
        this.grid.innerHTML = '';
        
        // Generate grid elements
        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const pad = document.createElement('div');
                pad.classList.add('sequencer-pad');
                pad.dataset.row = r;
                pad.dataset.col = c;
                
                pad.addEventListener('click', () => {
                    this.togglePad(r, c);
                });
                
                this.grid.appendChild(pad);
            }
        }

        this.playBtn.addEventListener('click', () => this.togglePlayback());
        this.clearBtn.addEventListener('click', () => this.clearGrid());
    }

    togglePad(row, col) {
        const val = this.matrix[row][col];
        this.matrix[row][col] = val === 0 ? 1 : 0;
        
        const pad = this.grid.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        pad.classList.toggle('active-pad');

        // Play feedback note
        if (this.matrix[row][col] === 1) {
            const sound = this.rowSounds[row];
            window.TimeAudio.playDrumHit(sound.type, sound.note);
        }
    }

    clearGrid() {
        this.matrix = Array(this.rows).fill(0).map(() => Array(this.cols).fill(0));
        this.grid.querySelectorAll('.sequencer-pad').forEach(pad => {
            pad.classList.remove('active-pad');
        });
        window.TimeAudio.playClickSFX();
    }

    togglePlayback() {
        if (this.isPlaying) {
            this.stop();
        } else {
            this.play();
        }
    }

    play() {
        this.isPlaying = true;
        this.playBtn.textContent = 'STOP LOOP';
        this.playBtn.classList.add('active');
        this.currentStep = 0;
        
        const bpm = parseInt(this.tempoInput.value);
        const tickTime = (60 / bpm / 2) * 1000; // 8th notes

        const runTick = () => {
            this.triggerStep();
            this.currentStep = (this.currentStep + 1) % this.cols;
        };

        runTick();
        this.stepInterval = setInterval(runTick, tickTime);
    }

    stop() {
        this.isPlaying = false;
        this.playBtn.textContent = 'PLAY SEQUENCE';
        this.playBtn.classList.remove('active');
        if (this.stepInterval) {
            clearInterval(this.stepInterval);
            this.stepInterval = null;
        }
        
        // Remove step overlays
        this.grid.querySelectorAll('.sequencer-pad').forEach(pad => {
            pad.classList.remove('current-step');
        });
    }

    triggerStep() {
        // Remove highlight from previous column
        const prevCol = (this.currentStep - 1 + this.cols) % this.cols;
        this.grid.querySelectorAll(`[data-col="${prevCol}"]`).forEach(pad => {
            pad.classList.remove('current-step');
        });

        // Add highlight to current column
        this.grid.querySelectorAll(`[data-col="${this.currentStep}"]`).forEach(pad => {
            pad.classList.add('current-step');
        });

        // Trigger notes active in current column
        for (let r = 0; r < this.rows; r++) {
            if (this.matrix[r][this.currentStep] === 1) {
                const sound = this.rowSounds[r];
                window.TimeAudio.playDrumHit(sound.type, sound.note);
            }
        }
    }
}


class DecryptorWidget {
    constructor(gridId, traceTextId, traceBarId, statusId, refreshBtnId) {
        this.grid = document.getElementById(gridId);
        this.traceText = document.getElementById(traceTextId);
        this.traceBar = document.getElementById(traceBarId);
        this.statusText = document.getElementById(statusId);
        this.refreshBtn = document.getElementById(refreshBtnId);

        this.cols = 6;
        this.rows = 6;
        this.tracePercent = 0;
        this.gameActive = false;
        
        this.glitchCellTimer = null;
        this.traceTimer = null;
        this.cells = [];

        this.init();
    }

    init() {
        this.refreshBtn.addEventListener('click', () => this.startDecryption());
    }

    startDecryption() {
        this.gameActive = true;
        this.tracePercent = 0;
        this.updateTraceHUD();
        this.statusText.textContent = 'BYPASSING SECURITY...';
        this.statusText.style.color = '#39ff14';

        // Clear timers
        clearInterval(this.glitchCellTimer);
        clearInterval(this.traceTimer);

        // Populate terminal grid
        this.grid.innerHTML = '';
        this.cells = [];
        const hexWords = ['A0', '5E', 'FF', '00', 'B2', '7C', 'CD', '2E', '8B', 'A4', '0D', '11', '8E', 'F0', 'EA'];

        for (let i = 0; i < 36; i++) {
            const cell = document.createElement('div');
            cell.classList.add('hex-cell');
            cell.textContent = hexWords[Math.floor(Math.random() * hexWords.length)];
            
            cell.addEventListener('click', () => {
                this.handleCellClick(cell);
            });

            this.grid.appendChild(cell);
            this.cells.push(cell);
        }

        // Trace ticker
        this.traceTimer = setInterval(() => {
            if (!this.gameActive) return;
            this.tracePercent += 2;
            this.updateTraceHUD();

            if (this.tracePercent >= 100) {
                this.triggerGameOver();
            }
        }, 300);

        // Glitch node spawner
        const spawnGlitch = () => {
            if (!this.gameActive) return;
            
            // Re-normalize all
            this.cells.forEach(c => c.classList.remove('glitched'));
            
            // Randomly select one cell to glitch
            const randomIdx = Math.floor(Math.random() * this.cells.length);
            const targetCell = this.cells[randomIdx];
            targetCell.classList.add('glitched');
            
            // Visual text random glitch update
            targetCell.textContent = 'ERR';
            setTimeout(() => {
                if (targetCell.classList.contains('glitched')) {
                    targetCell.textContent = 'ØX';
                }
            }, 800);
            
            window.TimeAudio.playClickSFX();
        };

        spawnGlitch();
        this.glitchCellTimer = setInterval(spawnGlitch, 2000);
        window.TimeAudio.playSuccessSFX();
    }

    handleCellClick(cell) {
        if (!this.gameActive) return;

        if (cell.classList.contains('glitched')) {
            // Successfully neutralized glitched node!
            cell.classList.remove('glitched');
            cell.textContent = 'OK';
            
            // Reduce trace percent as reward
            this.tracePercent = Math.max(0, this.tracePercent - 20);
            this.updateTraceHUD();

            this.statusText.textContent = 'BYPASS NODE INJECTED!';
            this.statusText.style.color = '#39ff14';
            
            window.TimeAudio.playSuccessSFX();
            
            // Update hex content
            setTimeout(() => {
                cell.textContent = '7F';
            }, 1000);
        } else {
            // Incorrect cell clicked - penalty
            this.tracePercent = Math.min(100, this.tracePercent + 10);
            this.updateTraceHUD();
            this.statusText.textContent = 'TRACE INTRUSION ACCELERATED!';
            this.statusText.style.color = '#ff0055';
            
            window.TimeAudio.playClickSFX();
        }
    }

    updateTraceHUD() {
        this.traceText.textContent = `${this.tracePercent}%`;
        this.traceBar.style.width = `${this.tracePercent}%`;
    }

    triggerGameOver() {
        this.gameActive = false;
        this.statusText.textContent = 'FIREWALL LOCKED OUT';
        this.statusText.style.color = '#ff0055';
        
        clearInterval(this.glitchCellTimer);
        clearInterval(this.traceTimer);
        
        // Glow all cells red
        this.cells.forEach(c => {
            c.textContent = '☠';
            c.style.color = '#ff0055';
            c.style.borderColor = '#ff0055';
        });

        // Trigger heavy low warning SFX
        window.TimeAudio.playDrumHit('bass');
        setTimeout(() => window.TimeAudio.playDrumHit('bass'), 300);
    }

    stop() {
        this.gameActive = false;
        clearInterval(this.glitchCellTimer);
        clearInterval(this.traceTimer);
    }
}


class StarPlotterWidget {
    constructor(canvasId, targetStarId, warpBtnId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.targetText = document.getElementById(targetStarId);
        this.warpBtn = document.getElementById(warpBtnId);

        this.stars = [];
        this.rotationY = 0;
        this.rotationX = 0;
        this.isWarping = false;
        this.warpProgress = 0;
        this.selectedStar = null;
        this.isMouseDown = false;
        this.lastMousePos = { x: 0, y: 0 };
        
        this.constellationNames = [
            'ALPHA CENTAURI IV', 'TRAPPIST-1E', 'SIRIUS B ALPHA', 
            'KEPLER-452B', 'VEGA DOME V', 'ANTARES NEBULA'
        ];

        this.init();
    }

    init() {
        // Generate random star coordinates on a sphere
        for (let i = 0; i < 40; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            const r = 120; // Sphere radius

            this.stars.push({
                x: r * Math.sin(phi) * Math.cos(theta),
                y: r * Math.sin(phi) * Math.sin(theta),
                z: r * Math.cos(phi),
                name: this.constellationNames[i % this.constellationNames.length] + ' - Node ' + (i + 1),
                px: 0, py: 0 // Screen coordinates
            });
        }

        // Setup interaction event listeners
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        window.addEventListener('mousemove', (e) => this.onMouseMove(e));
        window.addEventListener('mouseup', () => this.onMouseUp());
        
        // Touch events
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                this.onMouseDown({ clientX: t.clientX, clientY: t.clientY });
            }
        });
        window.addEventListener('touchmove', (e) => {
            if (e.touches.length > 0) {
                const t = e.touches[0];
                this.onMouseMove({ clientX: t.clientX, clientY: t.clientY });
            }
        });
        window.addEventListener('touchend', () => this.onMouseUp());

        this.warpBtn.addEventListener('click', () => this.triggerWarpSpeed());

        // Default lock
        this.selectedStar = this.stars[0];
        this.targetText.textContent = this.selectedStar.name;

        this.animate();
    }

    onMouseDown(e) {
        this.isMouseDown = true;
        const rect = this.canvas.getBoundingClientRect();
        this.lastMousePos = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
        
        // Check click intersection
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        let clickedStar = null;
        for (let star of this.stars) {
            const dist = Math.hypot(star.px - clickX, star.py - clickY);
            if (dist < 12) {
                clickedStar = star;
                break;
            }
        }

        if (clickedStar) {
            this.selectedStar = clickedStar;
            this.targetText.textContent = clickedStar.name;
            window.TimeAudio.playSuccessSFX();
        } else {
            window.TimeAudio.playClickSFX();
        }
    }

    onMouseMove(e) {
        if (!this.isMouseDown || this.isWarping) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const curX = e.clientX - rect.left;
        const curY = e.clientY - rect.top;
        
        const dx = curX - this.lastMousePos.x;
        const dy = curY - this.lastMousePos.y;
        
        this.rotationY += dx * 0.005;
        this.rotationX += dy * 0.005;
        
        this.lastMousePos = { x: curX, y: curY };
    }

    onMouseUp() {
        this.isMouseDown = false;
    }

    triggerWarpSpeed() {
        if (this.isWarping) return;
        this.isWarping = true;
        this.warpProgress = 0;
        
        window.TimeAudio.playTransitionSFX();
        
        // Log telemetry warp event
        const consoleLog = document.getElementById('consoleBody');
        if (consoleLog) {
            const line = document.createElement('div');
            line.className = 'console-line text-warning';
            line.textContent = `[TELEMETRY]: WARP DRIVE DISCHARGE DETECTED. VECTOR FLUX TARGET: ${this.selectedStar.name}`;
            consoleLog.appendChild(line);
            consoleLog.scrollTop = consoleLog.scrollHeight;
        }
    }

    animate() {
        const render = () => {
            // Stop loop if viewport is destroyed/not on 3026
            if (!document.body.classList.contains('theme-3026')) {
                return;
            }
            this.draw();
            requestAnimationFrame(render);
        };
        render();
    }

    draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        ctx.clearRect(0, 0, w, h);

        const cx = w / 2;
        const cy = h / 2;

        if (this.isWarping) {
            // Warp speed animation - streaks of stars moving outwards from center
            this.warpProgress += 0.015;
            
            ctx.strokeStyle = `rgba(0, 210, 255, ${1 - this.warpProgress})`;
            ctx.lineWidth = 2;
            
            for (let i = 0; i < 60; i++) {
                const angle = (i * Math.PI * 2) / 60;
                const innerR = this.warpProgress * 300;
                const outerR = innerR + 100 * this.warpProgress;
                
                ctx.beginPath();
                ctx.moveTo(cx + Math.cos(angle) * innerR, cy + Math.sin(angle) * innerR);
                ctx.lineTo(cx + Math.cos(angle) * outerR, cy + Math.sin(angle) * outerR);
                ctx.stroke();
            }

            if (this.warpProgress >= 1.0) {
                this.isWarping = false;
                window.TimeAudio.playSuccessSFX();
            }
            return;
        }

        // Draw HUD alignment crosshairs
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx, cy, 140, 0, Math.PI * 2);
        ctx.arc(cx, cy, 80, 0, Math.PI * 2);
        ctx.moveTo(cx - 160, cy); ctx.lineTo(cx + 160, cy);
        ctx.moveTo(cx, cy - 140); ctx.lineTo(cx, cy + 140);
        ctx.stroke();

        // Rotate & project stars
        const cosY = Math.cos(this.rotationY);
        const sinY = Math.sin(this.rotationY);
        const cosX = Math.cos(this.rotationX);
        const sinX = Math.sin(this.rotationX);

        this.stars.forEach((star) => {
            // 3D rotation logic
            // Y rotation
            let x1 = star.x * cosY - star.z * sinY;
            let z1 = star.x * sinY + star.z * cosY;
            // X rotation
            let y1 = star.y * cosX - z1 * sinX;
            let z2 = star.y * sinX + z1 * cosX;

            // Perspective scale projection
            const fov = 200;
            const scale = fov / (fov + z2);
            
            star.px = cx + x1 * scale;
            star.py = cy + y1 * scale;
            
            // Draw star node
            ctx.fillStyle = z2 > 0 ? 'rgba(0, 210, 255, 0.3)' : '#00d2ff';
            const size = Math.max(1, 4 * scale);
            
            ctx.beginPath();
            ctx.arc(star.px, star.py, size, 0, Math.PI * 2);
            ctx.fill();

            // Reticle overlay for locked star
            if (this.selectedStar === star) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1.5;
                ctx.beginPath();
                ctx.arc(star.px, star.py, size + 8, 0, Math.PI * 2);
                ctx.stroke();
                
                ctx.font = '9px "Space Grotesk"';
                ctx.fillStyle = '#ffffff';
                ctx.fillText('TARGET LOCKED', star.px + 12, star.py - 4);
            }
        });

        // Draw soft constellation mapping lines connecting nearby star nodes
        ctx.strokeStyle = 'rgba(0, 210, 255, 0.15)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i < this.stars.length; i++) {
            for (let j = i + 1; j < this.stars.length; j++) {
                const s1 = this.stars[i];
                const s2 = this.stars[j];
                const distance = Math.hypot(s1.px - s2.px, s1.py - s2.py);
                if (distance < 55) {
                    ctx.beginPath();
                    ctx.moveTo(s1.px, s1.py);
                    ctx.lineTo(s2.px, s2.py);
                    ctx.stroke();
                }
            }
        }
    }
}

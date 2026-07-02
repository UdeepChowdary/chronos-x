class TimeAudioController {
    constructor() {
        this.audioCtx = null;
        this.masterGain = null;
        this.analyser = null;
        
        // Ambiance loop configuration
        this.currentEra = '1983';
        this.isPlayingAmbience = false;
        this.sfxEnabled = true;
        
        // Loop trackers
        this.ambientTimer = null;
        this.synthNodes = [];
        this.lfoInterval = null;
    }

    init() {
        if (this.audioCtx) return;

        // Initialize Web Audio API
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        this.audioCtx = new AudioContextClass();
        
        // Master Volume Gain
        this.masterGain = this.audioCtx.createGain();
        this.masterGain.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
        
        // Analyser for UI visualizer
        this.analyser = this.audioCtx.createAnalyser();
        this.analyser.fftSize = 64;
        
        // Routing
        this.masterGain.connect(this.analyser);
        this.analyser.connect(this.audioCtx.destination);
    }

    setVolume(value) {
        if (!this.masterGain) return;
        // Map 0-100 to exponential gain range 0-1
        const gainVal = value / 100;
        this.masterGain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
    }

    toggleSFX(enabled) {
        this.sfxEnabled = enabled;
    }

    startAmbience() {
        this.init();
        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume();
        }
        
        this.isPlayingAmbience = true;
        this.stopAmbienceEngine();
        this.startAmbienceEngine();
    }

    stopAmbience() {
        this.isPlayingAmbience = false;
        this.stopAmbienceEngine();
    }

    setEra(era) {
        this.currentEra = era;
        if (this.isPlayingAmbience) {
            this.stopAmbienceEngine();
            this.startAmbienceEngine();
        }
    }

    stopAmbienceEngine() {
        if (this.ambientTimer) {
            clearInterval(this.ambientTimer);
            this.ambientTimer = null;
        }
        if (this.lfoInterval) {
            clearInterval(this.lfoInterval);
            this.lfoInterval = null;
        }
        this.synthNodes.forEach(node => {
            try { node.stop(); } catch(e) {}
        });
        this.synthNodes = [];
    }

    startAmbienceEngine() {
        if (!this.isPlayingAmbience) return;

        if (this.currentEra === '1500') {
            this.playDaVinciAmbiance();
        } else if (this.currentEra === '1983') {
            this.playVaporwaveAmbiance();
        } else if (this.currentEra === '2099') {
            this.playCyberpunkAmbiance();
        } else if (this.currentEra === '3026') {
            this.playInterstellarAmbiance();
        }
    }

    /* ==========================================
       AMBIE-SYNTH ENGINE DEFINITIONS
       ========================================== */

    // 1500 Da Vinci: Medieval plucked strings & wind
    playDaVinciAmbiance() {
        // Slow arpeggio loop: A minor chord (A3, C4, E4, A4)
        const notes = [220.00, 261.63, 329.63, 440.00];
        let index = 0;

        const schedulePluck = () => {
            if (!this.isPlayingAmbience || this.currentEra !== '1500') return;

            const t = this.audioCtx.currentTime;
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            // Triangle wave replicates string/woodwind resonance nicely
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(notes[index], t);
            
            // Soft pluck envelope
            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.3, t + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 2.5);
            
            osc.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start(t);
            osc.stop(t + 2.6);
            this.synthNodes.push(osc);
            
            index = (index + 1) % notes.length;
        };

        schedulePluck();
        this.ambientTimer = setInterval(schedulePluck, 1500);
    }

    // 1983 Vaporwave: Floating detuned synth pads
    playVaporwaveAmbiance() {
        const chord = [130.81, 196.00, 261.63, 329.63, 392.00]; // Cmaj7/9 voicing

        const playPad = () => {
            if (!this.isPlayingAmbience || this.currentEra !== '1983') return;

            const t = this.audioCtx.currentTime;
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(400, t);
            filter.Q.setValueAtTime(4, t);
            
            // Sweep filter frequency for retro feel
            filter.frequency.exponentialRampToValueAtTime(1500, t + 4);
            filter.frequency.exponentialRampToValueAtTime(300, t + 8);
            
            filter.connect(this.masterGain);

            chord.forEach((freq, idx) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                
                // Sawtooth for classic synth grit, detuned slightly
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq + (idx * 0.8), t);
                
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.04, t + 2);
                gain.gain.linearRampToValueAtTime(0.04, t + 6);
                gain.gain.exponentialRampToValueAtTime(0.001, t + 8.5);
                
                osc.connect(gain);
                gain.connect(filter);
                
                osc.start(t);
                osc.stop(t + 9.0);
                this.synthNodes.push(osc);
            });
        };

        playPad();
        this.ambientTimer = setInterval(playPad, 8000);
    }

    // 2099 Cyberpunk: Dark mechanical industrial noise & bass
    playCyberpunkAmbiance() {
        const playDrone = () => {
            if (!this.isPlayingAmbience || this.currentEra !== '2099') return;

            const t = this.audioCtx.currentTime;
            
            // Sub Bass drone
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(55.00, t); // A1 bass drone
            
            const filter = this.audioCtx.createBiquadFilter();
            filter.type = 'lowpass';
            filter.Q.setValueAtTime(8, t);
            
            // Cyberpunk Filter sweep logic (Simulates industrial engine)
            filter.frequency.setValueAtTime(120, t);
            filter.frequency.linearRampToValueAtTime(450, t + 2.5);
            filter.frequency.linearRampToValueAtTime(120, t + 5);

            gain.gain.setValueAtTime(0, t);
            gain.gain.linearRampToValueAtTime(0.12, t + 1);
            gain.gain.linearRampToValueAtTime(0.12, t + 4);
            gain.gain.linearRampToValueAtTime(0.001, t + 5.1);

            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);

            osc.start(t);
            osc.stop(t + 5.2);
            this.synthNodes.push(osc);
        };

        playDrone();
        this.ambientTimer = setInterval(playDrone, 5000);
    }

    // 3026 Interstellar: Expansive celestial spatial reverb drone
    playInterstellarAmbiance() {
        const spaceChords = [196.00, 293.66, 392.00, 493.88]; // G major open voicing

        const playDrone = () => {
            if (!this.isPlayingAmbience || this.currentEra !== '3026') return;

            const t = this.audioCtx.currentTime;
            const delay = this.audioCtx.createDelay(5.0);
            const feedback = this.audioCtx.createGain();
            
            delay.delayTime.setValueAtTime(1.2, t);
            feedback.gain.setValueAtTime(0.4, t);
            
            // Connect delay feedback loop
            delay.connect(feedback);
            feedback.connect(delay);
            
            delay.connect(this.masterGain);

            spaceChords.forEach((freq) => {
                const osc = this.audioCtx.createOscillator();
                const gain = this.audioCtx.createGain();
                
                osc.type = 'sine'; // Ultra clean pure tone
                osc.frequency.setValueAtTime(freq, t);
                
                // Slow swell envelope
                gain.gain.setValueAtTime(0, t);
                gain.gain.linearRampToValueAtTime(0.06, t + 4);
                gain.gain.linearRampToValueAtTime(0.06, t + 8);
                gain.gain.linearRampToValueAtTime(0.001, t + 12);
                
                osc.connect(gain);
                gain.connect(this.masterGain); // Direct path
                gain.connect(delay); // Delayed spatial path
                
                osc.start(t);
                osc.stop(t + 12);
                this.synthNodes.push(osc);
            });
        };

        playDrone();
        this.ambientTimer = setInterval(playDrone, 11000);
    }

    /* ==========================================
       INTERFACE SOUND EFFECTS (SFX)
       ========================================== */

    playClickSFX() {
        if (!this.sfxEnabled) return;
        this.init();
        
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        // Era-specific click style
        if (this.currentEra === '1500') {
            // Wood click (very brief triangle click)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        } else if (this.currentEra === '1983') {
            // Analog arcade beep
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, t);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
        } else if (this.currentEra === '2099') {
            // Cyber glitch click (very high freq)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(3200, t);
            gain.gain.setValueAtTime(0.03, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
        } else {
            // Interstellar clean touch sine
            osc.type = 'sine';
            osc.frequency.setValueAtTime(1000, t);
            gain.gain.setValueAtTime(0.12, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        }
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.2);
    }

    playTransitionSFX() {
        if (!this.sfxEnabled) return;
        this.init();
        
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'sawtooth';
        osc2.type = 'sine';
        
        // Pitch sweep warps
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.exponentialRampToValueAtTime(1200, t + 0.65);
        
        osc2.frequency.setValueAtTime(300, t);
        osc2.frequency.exponentialRampToValueAtTime(2400, t + 0.65);
        
        gain.gain.setValueAtTime(0.001, t);
        gain.gain.linearRampToValueAtTime(0.15, t + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        
        osc.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc2.start(t);
        osc.stop(t + 0.7);
        osc2.stop(t + 0.7);
    }

    playSuccessSFX() {
        if (!this.sfxEnabled) return;
        this.init();
        
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        osc.type = 'sine';
        
        // Major arpeggio sweep for success
        osc.frequency.setValueAtTime(523.25, t); // C5
        osc.frequency.setValueAtTime(659.25, t + 0.1); // E5
        osc.frequency.setValueAtTime(783.99, t + 0.2); // G5
        osc.frequency.setValueAtTime(1046.50, t + 0.3); // C6
        
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.6);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.6);
    }

    playDrumHit(drumType, freq) {
        if (!this.sfxEnabled) return;
        this.init();
        
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        
        if (drumType === 'bass') {
            // Kick drum: pitch sweeps rapidly down
            osc.type = 'sine';
            osc.frequency.setValueAtTime(150, t);
            osc.frequency.exponentialRampToValueAtTime(0.01, t + 0.15);
            gain.gain.setValueAtTime(0.4, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        } else if (drumType === 'snare') {
            // Snare: noise and high sine
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(180, t);
            gain.gain.setValueAtTime(0.2, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
            
            // Add a little bit of white noise if possible using simple math
            // For snappiness in pure oscillator, we do a square sweep
            const snapOsc = this.audioCtx.createOscillator();
            snapOsc.type = 'square';
            snapOsc.frequency.setValueAtTime(1000, t);
            snapOsc.frequency.exponentialRampToValueAtTime(100, t + 0.05);
            
            const snapGain = this.audioCtx.createGain();
            snapGain.gain.setValueAtTime(0.08, t);
            snapGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
            
            snapOsc.connect(snapGain);
            snapGain.connect(this.masterGain);
            snapOsc.start(t);
            snapOsc.stop(t + 0.06);
        } else if (drumType === 'synth') {
            // High retro laser sweep
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq || 800, t);
            osc.frequency.exponentialRampToValueAtTime(freq ? freq / 3 : 200, t + 0.25);
            gain.gain.setValueAtTime(0.08, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        } else {
            // Hi-hat click
            osc.type = 'square';
            osc.frequency.setValueAtTime(8000, t);
            gain.gain.setValueAtTime(0.04, t);
            gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
        }
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start(t);
        osc.stop(t + 0.35);
    }
}
window.TimeAudio = new TimeAudioController();

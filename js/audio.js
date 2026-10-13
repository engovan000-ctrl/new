/**
 * LAB AUDIO ENGINE: Web Audio API sound synthesizer
 * Zero external audio files required! Synthesizes realistic electrical lab sounds:
 * - 50 Hz transformer / induction motor AC hum
 * - Commutator & rotor whine proportional to motor RPM
 * - Brake belt friction hiss proportional to tension and speed
 * - Mechanical knife switch & starter notch clicks
 * - Overload trip / breaker snap
 */

class LabAudioEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = false;
    this.masterGain = null;

    // AC Hum nodes
    this.humOsc = null;
    this.humGain = null;

    // Motor Whine nodes
    this.motorOsc = null;
    this.motorGain = null;

    // Friction Noise nodes
    this.noiseNode = null;
    this.noiseGain = null;

    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();

      // Master gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // --- 1. AC Supply Hum (50 Hz fundamental + 100 Hz harmonic) ---
      this.humOsc = this.ctx.createOscillator();
      this.humOsc.type = 'sawtooth';
      this.humOsc.frequency.setValueAtTime(50, this.ctx.currentTime);

      const humFilter = this.ctx.createBiquadFilter();
      humFilter.type = 'lowpass';
      humFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

      this.humGain = this.ctx.createGain();
      this.humGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.humOsc.connect(humFilter);
      humFilter.connect(this.humGain);
      this.humGain.connect(this.masterGain);
      this.humOsc.start();

      // --- 2. Motor Whine (Rotor Commutator / Slot Harmonics) ---
      this.motorOsc = this.ctx.createOscillator();
      this.motorOsc.type = 'triangle';
      this.motorOsc.frequency.setValueAtTime(60, this.ctx.currentTime);

      this.motorGain = this.ctx.createGain();
      this.motorGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.motorOsc.connect(this.motorGain);
      this.motorGain.connect(this.masterGain);
      this.motorOsc.start();

      // --- 3. Brake Friction Noise (Pink/White noise) ---
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      this.noiseNode = this.ctx.createBufferSource();
      this.noiseNode.buffer = noiseBuffer;
      this.noiseNode.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(800, this.ctx.currentTime);
      noiseFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

      this.noiseGain = this.ctx.createGain();
      this.noiseGain.gain.setValueAtTime(0, this.ctx.currentTime);

      this.noiseNode.connect(noiseFilter);
      noiseFilter.connect(this.noiseGain);
      this.noiseGain.connect(this.masterGain);
      this.noiseNode.start();

      this.initialized = true;
    } catch (e) {
      console.warn("Web Audio not available or waiting for user interaction:", e);
    }
  }

  ensureContext() {
    if (!this.initialized) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  updateMotorSound(rpm, loadKg, isPowered) {
    if (this.isMuted || !this.initialized || !this.ctx) return;

    const t = this.ctx.currentTime;

    if (!isPowered && rpm <= 10) {
      // Fade out
      this.humGain.gain.setTargetAtTime(0, t, 0.1);
      this.motorGain.gain.setTargetAtTime(0, t, 0.1);
      this.noiseGain.gain.setTargetAtTime(0, t, 0.1);
      return;
    }

    // Supply hum level
    const humLevel = isPowered ? 0.08 : 0;
    this.humGain.gain.setTargetAtTime(humLevel, t, 0.05);

    // Motor whine pitch = slots/commutator frequency (e.g. 18 commutator segments)
    const baseFreq = Math.max(30, (rpm / 60) * 16);
    this.motorOsc.frequency.setTargetAtTime(baseFreq, t, 0.05);

    const whineVol = Math.min(0.25, (rpm / 1500) * 0.15);
    this.motorGain.gain.setTargetAtTime(whineVol, t, 0.05);

    // Friction hiss
    if (rpm > 50 && loadKg > 0.1) {
      const hissVol = Math.min(0.2, (loadKg / 15) * (rpm / 1500) * 0.2);
      this.noiseGain.gain.setTargetAtTime(hissVol, t, 0.05);
    } else {
      this.noiseGain.gain.setTargetAtTime(0, t, 0.05);
    }
  }

  playSwitchClick(isOn = true) {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'square';
      osc.frequency.setValueAtTime(isOn ? 280 : 180, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.04);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.05);
    } catch (e) {}
  }

  playBreakerTrip() {
    this.ensureContext();
    if (this.isMuted || !this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, t);
      osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);

      gain.gain.setValueAtTime(0.7, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(t);
      osc.stop(t + 0.16);
    } catch (e) {}
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.3, this.ctx.currentTime);
    }
    return this.isMuted;
  }
}

window.labAudio = new LabAudioEngine();

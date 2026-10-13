/**
 * LAB APPLICATION MASTER COORDINATOR
 * Manages UI, simulation ticking, interactive components, observation logger,
 * chart plotting, audio synchronization, and report generation.
 */

class MotorLabApp {
  constructor() {
    this.currentExpId = 'exp_dc_load';
    this.isPowered = false;
    this.isTripped = false;
    this.tripReason = '';

    // Controls state
    this.starterStep = 0; // 0=OFF, 1..3=studs, 4=RUN
    this.fieldRheostat = 0; // Ohms (0 - 300)
    this.armRheostat = 0; // Ohms (0 - 20)
    this.variacPercent = 0; // 0 - 100%
    this.s1 = 0; // kg
    this.s2 = 0; // kg
    this.isBlockedRotor = false;

    // Visual Rotation & Stroboscope state
    this.rotorAngleDeg = 0;
    this.beltOffset = 0;
    this.visSpeedRatio = 1.0; // 1.0x (real), 0.25x (slow), 0.05x (ultra slow)
    this.machineryViewMode = 'side'; // 'side' or 'cutaway'
    this.strobeRevCount = 0;

    // Recorded observations
    this.observations = [];

    // Current live readings
    this.live = {
      V: 0,
      IL: 0,
      If: 0,
      Ia: 0,
      speed_rpm: 0,
      T_load: 0,
      T_dev: 0,
      P_in: 0,
      P_out: 0,
      efficiency: 0,
      W1: 0,
      W2: 0,
      pf: 0,
      slip: 0
    };

    this.init();
  }

  init() {
    // Initialize components
    this.wiring = new LabWiringSystem('wiringCanvas');
    window.labWiring = this.wiring;

    this.chart = new LabChartEngine('performanceChart');
    window.labChart = this.chart;

    this.bindDOM();
    this.populateExperimentDropdown();
    this.loadExperiment(this.currentExpId);

    // Start simulation loop (30 FPS)
    this.simInterval = setInterval(() => this.tick(), 33);
  }

  bindDOM() {
    // Experiment dropdown
    const expSelect = document.getElementById('experimentSelect');
    if (expSelect) {
      expSelect.addEventListener('change', (e) => {
        this.loadExperiment(e.target.value);
      });
    }

    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const tabId = btn.getAttribute('data-tab');
        this.switchTab(tabId);
      });
    });

    // Main Power Switch
    const pwrBtn = document.getElementById('powerSwitchBtn');
    if (pwrBtn) {
      pwrBtn.addEventListener('click', () => this.togglePower());
    }

    // Starter Handle
    const starterSlider = document.getElementById('starterSlider');
    if (starterSlider) {
      starterSlider.addEventListener('input', (e) => {
        this.starterStep = parseInt(e.target.value);
        this.updateStarterVisuals();
      });
    }

    // Field Rheostat Slider
    const fldSlider = document.getElementById('fieldRheoSlider');
    if (fldSlider) {
      fldSlider.addEventListener('input', (e) => {
        this.fieldRheostat = parseFloat(e.target.value);
        document.getElementById('fieldRheoVal').innerText = `${this.fieldRheostat.toFixed(0)} Ω`;
      });
    }

    // Armature Rheostat Slider
    const armSlider = document.getElementById('armRheoSlider');
    if (armSlider) {
      armSlider.addEventListener('input', (e) => {
        this.armRheostat = parseFloat(e.target.value);
        document.getElementById('armRheoVal').innerText = `${this.armRheostat.toFixed(1)} Ω`;
      });
    }

    // Variac Dial Slider
    const variacSlider = document.getElementById('variacSlider');
    if (variacSlider) {
      variacSlider.addEventListener('input', (e) => {
        this.variacPercent = parseFloat(e.target.value);
        document.getElementById('variacVal').innerText = `${this.variacPercent.toFixed(0)} %`;
      });
    }

    // Brake Handwheels
    const s1Slider = document.getElementById('s1Slider');
    if (s1Slider) {
      s1Slider.addEventListener('input', (e) => {
        this.s1 = parseFloat(e.target.value);
        document.getElementById('s1Val').innerText = `${this.s1.toFixed(1)} kg`;
      });
    }

    const s2Slider = document.getElementById('s2Slider');
    if (s2Slider) {
      s2Slider.addEventListener('input', (e) => {
        this.s2 = parseFloat(e.target.value);
        document.getElementById('s2Val').innerText = `${this.s2.toFixed(1)} kg`;
      });
    }

    // Wiring Toolbar buttons
    document.getElementById('btnAutoWire')?.addEventListener('click', () => {
      this.wiring.autoWire();
      this.showToast("Circuit Auto-Wired with color-coded leads!");
    });

    document.getElementById('btnClearWire')?.addEventListener('click', () => {
      this.wiring.clearWires();
      this.showToast("All wires removed from bench.");
    });

    document.getElementById('btnVerifyCircuit')?.addEventListener('click', () => {
      const res = this.wiring.verifyCircuit();
      this.showToast(res.msg, res.ok ? 'success' : 'error');
    });

    // Wire Color Dots
    document.querySelectorAll('.color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        document.querySelectorAll('.color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this.wiring.currentColor = dot.getAttribute('data-color');
      });
    });

    // Sound Toggle
    document.getElementById('btnSoundToggle')?.addEventListener('click', (e) => {
      const isMuted = window.labAudio.toggleMute();
      e.currentTarget.innerHTML = isMuted ? '🔇 Audio: OFF' : '🔊 Audio: ON';
    });

    // Observation Table actions
    document.getElementById('btnRecordObs')?.addEventListener('click', () => this.recordObservation());
    document.getElementById('btnCalcObs')?.addEventListener('click', () => this.calculateObservations());
    document.getElementById('btnClearTable')?.addEventListener('click', () => this.clearObservations());
    document.getElementById('btnExportCSV')?.addEventListener('click', () => this.exportTableCSV());

    // Graph Preset selector
    document.getElementById('graphPresetSelect')?.addEventListener('change', (e) => {
      this.applyGraphPreset(parseInt(e.target.value));
    });

    document.getElementById('btnExportGraph')?.addEventListener('click', () => {
      this.chart.exportPNG();
    });

    // Print Report
    document.getElementById('btnPrintReport')?.addEventListener('click', () => {
      this.prepareReport();
      window.print();
    });

    // Quick presets
    document.getElementById('btnPresetNoLoad')?.addEventListener('click', () => this.applyPreset('noload'));
    document.getElementById('btnPresetHalfLoad')?.addEventListener('click', () => this.applyPreset('halfload'));
    document.getElementById('btnPresetFullLoad')?.addEventListener('click', () => this.applyPreset('fullload'));

    // Machinery View Mode Toggles
    const btnSide = document.getElementById('btnViewSide');
    const btnCut = document.getElementById('btnViewCutaway');
    const viewSide = document.getElementById('sideAssemblyView');
    const viewCut = document.getElementById('cutawayView');

    btnSide?.addEventListener('click', () => {
      btnSide.classList.add('active');
      btnCut?.classList.remove('active');
      if (viewSide) viewSide.style.display = 'flex';
      if (viewCut) viewCut.style.display = 'none';
      this.machineryViewMode = 'side';
    });

    btnCut?.addEventListener('click', () => {
      btnCut.classList.add('active');
      btnSide?.classList.remove('active');
      if (viewSide) viewSide.style.display = 'none';
      if (viewCut) viewCut.style.display = 'flex';
      this.machineryViewMode = 'cutaway';
    });

    // Visual Speed Ratio Toggles (1x, 0.25x, 0.05x)
    const btnSpd1 = document.getElementById('btnSpeed1x');
    const btnSpd025 = document.getElementById('btnSpeed025x');
    const btnSpd005 = document.getElementById('btnSpeed005x');

    btnSpd1?.addEventListener('click', () => {
      btnSpd1.classList.add('active');
      btnSpd025?.classList.remove('active');
      btnSpd005?.classList.remove('active');
      this.visSpeedRatio = 1.0;
      this.showToast("Visual Rotation Speed: 1.0x (Real-time)");
    });

    btnSpd025?.addEventListener('click', () => {
      btnSpd025.classList.add('active');
      btnSpd1?.classList.remove('active');
      btnSpd005?.classList.remove('active');
      this.visSpeedRatio = 0.25;
      this.showToast("Visual Rotation Speed: 0.25x (Slow-Motion)");
    });

    btnSpd005?.addEventListener('click', () => {
      btnSpd005.classList.add('active');
      btnSpd1?.classList.remove('active');
      btnSpd025?.classList.remove('active');
      this.visSpeedRatio = 0.05;
      this.showToast("Visual Rotation Speed: 0.05x (Ultra Slow-Motion)");
    });
  }

  populateExperimentDropdown() {
    const expSelect = document.getElementById('experimentSelect');
    if (!expSelect) return;
    expSelect.innerHTML = '';

    LAB_EXPERIMENTS.forEach(exp => {
      const opt = document.createElement('option');
      opt.value = exp.id;
      opt.textContent = `[${exp.category}] ${exp.title}`;
      expSelect.appendChild(opt);
    });
  }

  loadExperiment(expId) {
    this.currentExpId = expId;
    const exp = LAB_EXPERIMENTS.find(e => e.id === expId);
    if (!exp) return;

    // Reset bench state
    if (this.isPowered) this.togglePower();
    this.observations = [];
    this.chart.clear();

    // Setup wiring
    this.wiring.setExperiment(expId);

    // Update Manual & Theory Tab
    this.renderManual(exp);

    // Update Table Headers
    this.renderTableHeaders(exp);

    // Update Graph Preset options
    this.renderGraphPresets(exp);

    // Update Nameplate Plate on Bench
    const npPlate = document.getElementById('motorNameplate');
    if (npPlate) {
      npPlate.innerHTML = `<strong>${exp.nameplate["Machine"] || "Electrical Machine"}</strong><br>${exp.nameplate["Power Rating"] || ""} | ${exp.nameplate["Rated Voltage"] || ""}`;
    }

    // Configure controls visibility based on motor type
    this.configureControlsForExp(exp);

    this.showToast(`Loaded: ${exp.title}`);
  }

  configureControlsForExp(exp) {
    const isInduction = exp.motorType.includes('INDUCTION');
    const isSync = exp.motorType.includes('SYNCHRONOUS');
    const isTrans = exp.motorType === 'TRANSFORMER';

    // Toggle Variac vs Starter
    const starterBlock = document.getElementById('starterBlock');
    const variacBlock = document.getElementById('variacBlock');
    const armRheoBlock = document.getElementById('armRheoBlock');

    if (starterBlock) starterBlock.style.display = isInduction || isTrans ? 'none' : 'flex';
    if (variacBlock) variacBlock.style.display = isInduction || isTrans ? 'flex' : 'none';
    if (armRheoBlock) armRheoBlock.style.display = isInduction || isTrans ? 'none' : 'flex';

    // Reset inputs
    this.starterStep = 0;
    this.variacPercent = 0;
    this.s1 = 0;
    this.s2 = 0;
    const starterSlider = document.getElementById('starterSlider');
    if (starterSlider) starterSlider.value = 0;
    const variacSlider = document.getElementById('variacSlider');
    if (variacSlider) variacSlider.value = 0;
    const s1Slider = document.getElementById('s1Slider');
    if (s1Slider) s1Slider.value = 0;
    const s2Slider = document.getElementById('s2Slider');
    if (s2Slider) s2Slider.value = 0;

    this.updateStarterVisuals();
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });

    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === tabId);
    });

    if (tabId === 'benchTab') {
      setTimeout(() => this.wiring.resize(), 50);
    } else if (tabId === 'curvesTab') {
      setTimeout(() => this.chart.resize(), 50);
    } else if (tabId === 'reportTab') {
      this.prepareReport();
    }
  }

  togglePower() {
    window.labAudio.ensureContext();

    if (!this.isPowered) {
      // Check circuit verification
      const verify = this.wiring.verifyCircuit();
      if (!verify.ok) {
        this.showToast(verify.msg, 'error');
        return;
      }

      this.isPowered = true;
      this.isTripped = false;
      window.labAudio.playSwitchClick(true);
      this.showToast("Mains Supply Energized!", "success");
    } else {
      this.isPowered = false;
      window.labAudio.playSwitchClick(false);
      this.showToast("Mains Supply Disconnected.");
    }
    this.updatePowerUI();
  }

  tripBreaker(reason) {
    this.isPowered = false;
    this.isTripped = true;
    this.tripReason = reason;
    window.labAudio.playBreakerTrip();
    this.updatePowerUI();
    this.showToast(`⚡ BREAKER TRIPPED: ${reason}`, 'error');
  }

  updatePowerUI() {
    const pwrBtn = document.getElementById('powerSwitchBtn');
    const statusPill = document.getElementById('powerStatusPill');

    if (this.isTripped) {
      if (pwrBtn) {
        pwrBtn.innerText = '⚡ RESET BREAKER';
        pwrBtn.className = 'btn btn-danger switch-control-btn';
      }
      if (statusPill) {
        statusPill.innerText = 'TRIPPED';
        statusPill.className = 'status-pill tripped';
      }
    } else if (this.isPowered) {
      if (pwrBtn) {
        pwrBtn.innerText = 'POWER OFF';
        pwrBtn.className = 'btn btn-danger switch-control-btn';
      }
      if (statusPill) {
        statusPill.innerText = 'LIVE (220V/415V)';
        statusPill.className = 'status-pill live';
      }
    } else {
      if (pwrBtn) {
        pwrBtn.innerText = 'ENERGIZE MAINS';
        pwrBtn.className = 'btn btn-success switch-control-btn';
      }
      if (statusPill) {
        statusPill.innerText = 'DE-ENERGIZED';
        statusPill.className = 'status-pill off';
      }
    }
  }

  updateStarterVisuals() {
    const studs = document.querySelectorAll('.starter-stud');
    studs.forEach((stud, idx) => {
      stud.classList.toggle('active', idx <= this.starterStep);
    });
    const label = document.getElementById('starterStatusLabel');
    const names = ['OFF', 'Stud 1 (15Ω)', 'Stud 2 (8Ω)', 'Stud 3 (3Ω)', 'RUN (0Ω)'];
    if (label) label.innerText = names[this.starterStep] || 'OFF';
  }

  // Master simulation step
  tick() {
    const dt = 0.033;
    const exp = LAB_EXPERIMENTS.find(e => e.id === this.currentExpId);
    if (!exp) return;

    if (exp.motorType === 'DC_SHUNT') {
      const controls = {
        supplyV: 220,
        starterStep: this.starterStep,
        fieldRheostat: this.fieldRheostat,
        armRheostat: this.armRheostat,
        s1: this.s1,
        s2: this.s2,
        isConnected: this.isPowered
      };
      this.live = MotorPhysicsEngine.dcShuntModel.step(dt, controls);
    } else if (exp.motorType === 'INDUCTION_3PH') {
      const appliedV = (this.variacPercent / 100) * 415;
      const controls = {
        supplyV_LL: appliedV,
        isConnected: this.isPowered,
        s1: this.s1,
        s2: this.s2,
        isBlockedRotor: exp.id === 'exp_ind_noload_blocked' && this.isBlockedRotor
      };
      this.live = MotorPhysicsEngine.inductionMotorModel.step(dt, controls);
    } else if (exp.motorType === 'SYNCHRONOUS_3PH') {
      if (exp.id === 'exp_sync_occ_scc') {
        const If = (this.fieldRheostat / 300) * 2.0;
        const Eo = MotorPhysicsEngine.syncMachineModel.getEo_LL(If);
        const Isc = MotorPhysicsEngine.syncMachineModel.getIsc(If);
        this.live = {
          V: this.isPowered ? Eo : 0,
          If: this.isPowered ? If : 0,
          Isc: this.isPowered ? Isc : 0,
          speed_rpm: this.isPowered ? 1500 : 0
        };
      } else {
        // V-curves
        const If = 0.3 + (this.fieldRheostat / 300) * 1.8;
        const vData = MotorPhysicsEngine.syncMachineModel.getVCurveData(If, 0.5);
        this.live = {
          V: this.isPowered ? 415 : 0,
          If: this.isPowered ? If : 0,
          Ia: this.isPowered ? vData.Ia : 0,
          pf: this.isPowered ? vData.powerFactor : 1.0,
          speed_rpm: this.isPowered ? 1500 : 0
        };
      }
    } else if (exp.motorType === 'TRANSFORMER') {
      const appliedV = (this.variacPercent / 100) * 230;
      const oc = MotorPhysicsEngine.transformerModel.getOCTest(appliedV);
      this.live = {
        V: this.isPowered ? appliedV : 0,
        IL: this.isPowered ? oc.I0 : 0,
        P_in: this.isPowered ? oc.W0 : 0,
        speed_rpm: 0
      };
    }

    // Overcurrent protection check
    if (this.isPowered && this.live.IL > 28.0) {
      this.tripBreaker("Overcurrent limit (28A) exceeded! Motor windings protected.");
      return;
    }

    // Update Visuals
    this.updateMeterReadouts();
    this.updateMachineryAnimation();

    // Update Audio
    window.labAudio.updateMotorSound(this.live.speed_rpm || 0, Math.max(0, this.s1 - this.s2), this.isPowered);

    // Update Wiring Canvas current particles
    this.wiring.render(this.isPowered, this.live.IL || this.live.Ia || 0);
  }

  updateMeterReadouts() {
    const V = this.live.V || this.live.V_LL || 0;
    const IL = this.live.IL || this.live.Ia || 0;
    const If = this.live.If !== undefined ? this.live.If : 0;
    const N = this.live.speed_rpm || 0;
    const T = this.live.T_load || this.live.T_dev || 0;
    const W1 = this.live.W1 || 0;
    const W2 = this.live.W2 || 0;

    // Digital readouts
    const elV = document.getElementById('meterVoltVal');
    const elIL = document.getElementById('meterLineCurrVal');
    const elIf = document.getElementById('meterFieldCurrVal');
    const elSpeed = document.getElementById('meterSpeedVal');
    const elTorque = document.getElementById('meterTorqueVal');
    const elW1 = document.getElementById('meterW1Val');
    const elW2 = document.getElementById('meterW2Val');

    if (elV) elV.innerText = V.toFixed(1);
    if (elIL) elIL.innerText = IL.toFixed(2);
    if (elIf) elIf.innerText = If.toFixed(2);
    if (elSpeed) elSpeed.innerText = Math.round(N);
    if (elTorque) elTorque.innerText = T.toFixed(2);
    if (elW1) elW1.innerText = W1.toFixed(0);
    if (elW2) elW2.innerText = W2.toFixed(0);

    // Update Analog needles
    this.updateAnalogNeedle('needleVolt', V, 300);
    this.updateAnalogNeedle('needleCurr', IL, 25);
    this.updateAnalogNeedle('needleField', If, 2.5);
  }

  updateAnalogNeedle(needleId, val, maxVal) {
    const needle = document.getElementById(needleId);
    if (!needle) return;
    const fraction = Math.max(0, Math.min(1, val / maxVal));
    const angle = -50 + fraction * 100; // -50 deg to +50 deg
    needle.setAttribute('transform', `rotate(${angle} 50 50)`);
  }

  updateMachineryAnimation() {
    const rpm = this.live.speed_rpm || 0;
    const rps = rpm / 60;
    const dt = 0.033;

    // Angular increment with visual speed ratio
    const deltaDeg = (rps * 360 * dt * this.visSpeedRatio);
    const prevAngle = this.rotorAngleDeg;
    this.rotorAngleDeg = (this.rotorAngleDeg + deltaDeg) % 360;

    // Strobe count (completed revolutions)
    if (rpm > 10 && this.rotorAngleDeg < prevAngle) {
      this.strobeRevCount++;
    }

    // Moving belt offset
    this.beltOffset = (this.beltOffset + (rps * 25 * dt * this.visSpeedRatio)) % 24;

    // 1. Rotate Cooling Fan (Left)
    const fanBlades = document.getElementById('coolingFanBlades');
    if (fanBlades) {
      fanBlades.style.transform = `rotate(${this.rotorAngleDeg.toFixed(1)}deg)`;
    }

    // 2. Rotate Brake Pulley Spokes & Stroboscopic Disc (Right)
    const pulleySpokes = document.getElementById('brakePulleySpokes');
    if (pulleySpokes) {
      pulleySpokes.style.transform = `rotate(${this.rotorAngleDeg.toFixed(1)}deg)`;
    }

    // 3. Rotate Cutaway Stator-Rotor Armature Core (View B)
    const cutawayRotor = document.getElementById('cutawayRotorDisc');
    if (cutawayRotor) {
      cutawayRotor.style.transform = `rotate(${this.rotorAngleDeg.toFixed(1)}deg)`;
    }

    // 4. Cylindrical 3D Keyway translation & surface striped pattern on Shaft
    const rad = (this.rotorAngleDeg * Math.PI) / 180;
    const keywayX = Math.sin(rad) * 26; // oscillates left and right across cylinder face
    const keywayScale = Math.max(0.1, Math.abs(Math.cos(rad))); // foreshortening
    const shaftKeyway = document.getElementById('shaftKeywayStrip');
    if (shaftKeyway) {
      shaftKeyway.style.transform = `translateX(${keywayX.toFixed(1)}px) scaleX(${keywayScale.toFixed(2)})`;
      shaftKeyway.style.opacity = Math.cos(rad) > 0 ? '1' : '0.25'; // hidden on back side
    }

    const shaftPattern = document.getElementById('shaftPattern');
    if (shaftPattern) {
      shaftPattern.style.backgroundPositionX = `${(-this.rotorAngleDeg * 0.4).toFixed(1)}px`;
    }

    const shaftReflector = document.getElementById('shaftReflector');
    if (shaftReflector) {
      const reflX = Math.cos(rad) * 26;
      shaftReflector.style.transform = `translateX(${reflX.toFixed(1)}px)`;
      shaftReflector.style.opacity = Math.sin(rad) > 0 ? '1' : '0';
    }

    // 5. Moving Belt Texture
    const beltStripes = document.getElementById('beltStripes');
    if (beltStripes) {
      beltStripes.style.backgroundPositionY = `${this.beltOffset.toFixed(1)}px`;
    }

    // 6. Friction Heating Glow on Drum Rim (proportional to tension and RPM)
    const frictionGlow = document.getElementById('frictionGlowRing');
    if (frictionGlow) {
      const netTension = Math.max(0, this.s1 - this.s2);
      const glowOpacity = Math.min(0.9, (netTension / 12) * Math.min(1.0, rpm / 1200));
      frictionGlow.setAttribute('opacity', glowOpacity.toFixed(2));
    }

    // 7. Optical Tachometer Strobe LED & Direction Arrow
    const strobeLed = document.getElementById('strobeLed');
    if (strobeLed) {
      const isTopCrossing = (this.rotorAngleDeg >= 335 || this.rotorAngleDeg <= 35) && rpm > 10;
      strobeLed.classList.toggle('active', isTopCrossing);
    }

    const rotArrow = document.getElementById('hudRotArrow');
    const rotStatus = document.getElementById('hudRotStatus');
    if (rotArrow) {
      rotArrow.style.transform = `rotate(${this.rotorAngleDeg.toFixed(1)}deg)`;
    }
    if (rotStatus) {
      rotStatus.innerText = rpm > 10 ? 'RUNNING (↻ CW)' : 'STOPPED';
      rotStatus.style.color = rpm > 10 ? '#4ade80' : '#94a3b8';
    }

    // 8. Machinery HUD live metrics
    const omega = (2 * Math.PI * rpm) / 60;
    const elOmega = document.getElementById('hudOmegaVal');
    const elRpm = document.getElementById('hudRpmVal');
    const elRevs = document.getElementById('hudRevsVal');
    const elSDiff = document.getElementById('sDiffVal');

    if (elOmega) elOmega.innerText = `${omega.toFixed(1)} rad/s`;
    if (elRpm) elRpm.innerText = `${Math.round(rpm)} RPM`;
    if (elRevs) elRevs.innerText = `${this.strobeRevCount} revs`;
    if (elSDiff) elSDiff.innerText = `${Math.max(0, this.s1 - this.s2).toFixed(1)} kg`;
  }

  onWiringChanged() {
    if (this.isPowered) {
      const v = this.wiring.verifyCircuit();
      if (!v.ok) {
        this.tripBreaker("Wiring disconnected while system was energized!");
      }
    }
  }

  recordObservation() {
    const exp = LAB_EXPERIMENTS.find(e => e.id === this.currentExpId);
    if (!exp) return;

    const row = {
      obsNo: this.observations.length + 1,
      V: (this.live.V || this.live.V_LL || 0).toFixed(1),
      V_LL: (this.live.V_LL || this.live.V || 0).toFixed(1),
      IL: (this.live.IL || 0).toFixed(2),
      If: (this.live.If || 0).toFixed(2),
      Ia: (this.live.Ia || 0).toFixed(2),
      N: Math.round(this.live.speed_rpm || 0),
      S1: this.s1.toFixed(1),
      S2: this.s2.toFixed(1),
      W1: (this.live.W1 || 0).toFixed(0),
      W2: (this.live.W2 || 0).toFixed(0),
      Pin: (this.live.P_in || 0).toFixed(1),
      Pout: (this.live.P_out || 0).toFixed(1),
      T: (this.live.T_load || 0).toFixed(2),
      eff: (this.live.efficiency || 0).toFixed(2),
      slip: (this.live.slip || 0).toFixed(3),
      pf: (this.live.powerFactor || this.live.pf || 0.85).toFixed(3),
      Eo_LL: (this.live.V || 0).toFixed(1),
      Isc: (this.live.Isc || 0).toFixed(2)
    };

    // Calculate row derived values
    const calculated = exp.calculateRow(row);
    const fullRow = { ...row, ...calculated };

    this.observations.push(fullRow);
    this.renderTableRows(exp);
    this.updateChartData(exp);

    window.labAudio.playSwitchClick(true);
    this.showToast(`Observation #${fullRow.obsNo} recorded successfully!`, 'success');
  }

  calculateObservations() {
    const exp = LAB_EXPERIMENTS.find(e => e.id === this.currentExpId);
    if (!exp) return;

    this.observations = this.observations.map(row => {
      const calc = exp.calculateRow(row);
      return { ...row, ...calc };
    });

    this.renderTableRows(exp);
    this.updateChartData(exp);
    this.showToast("All formulas evaluated & table calculated!", "success");
  }

  clearObservations() {
    this.observations = [];
    const exp = LAB_EXPERIMENTS.find(e => e.id === this.currentExpId);
    this.renderTableRows(exp);
    this.chart.clear();
    this.showToast("Observation table cleared.");
  }

  renderTableHeaders(exp) {
    const tr = document.getElementById('tableHeadRow');
    if (!tr) return;
    tr.innerHTML = '';

    exp.tableColumns.forEach(col => {
      const th = document.createElement('th');
      th.innerText = col.label;
      tr.appendChild(th);
    });
  }

  renderTableRows(exp) {
    const tbody = document.getElementById('tableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    this.observations.forEach((row, idx) => {
      const tr = document.createElement('tr');
      exp.tableColumns.forEach(col => {
        const td = document.createElement('td');
        td.innerText = row[col.key] !== undefined ? row[col.key] : '-';
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
  }

  renderGraphPresets(exp) {
    const select = document.getElementById('graphPresetSelect');
    if (!select) return;
    select.innerHTML = '';

    exp.graphPresets.forEach((preset, idx) => {
      const opt = document.createElement('option');
      opt.value = idx;
      opt.innerText = preset.name;
      select.appendChild(opt);
    });

    this.applyGraphPreset(0);
  }

  applyGraphPreset(idx) {
    const exp = LAB_EXPERIMENTS.find(e => e.id === this.currentExpId);
    if (!exp || !exp.graphPresets[idx]) return;

    const preset = exp.graphPresets[idx];
    this.chart.setAxes(preset.name, preset.xName, preset.xUnit, preset.yName, preset.yUnit);
    this.activePresetIdx = idx;
    this.updateChartData(exp);
  }

  updateChartData(exp) {
    if (!exp) exp = LAB_EXPERIMENTS.find(e => e.id === this.currentExpId);
    const preset = exp.graphPresets[this.activePresetIdx || 0];
    if (!preset) return;

    const points = this.observations.map(row => ({
      x: parseFloat(row[preset.xKey]) || 0,
      y: parseFloat(row[preset.yKey]) || 0
    }));

    this.chart.clear();
    this.chart.addSeries(preset.yName, preset.color, preset.yUnit, points);
  }

  exportTableCSV() {
    const exp = LAB_EXPERIMENTS.find(e => e.id === this.currentExpId);
    if (!exp || this.observations.length === 0) {
      this.showToast("No data to export!", "error");
      return;
    }

    const headers = exp.tableColumns.map(c => c.label).join(',');
    const rows = this.observations.map(row => {
      return exp.tableColumns.map(c => `"${row[c.key] || ''}"`).join(',');
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${exp.id}_observations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  renderManual(exp) {
    // Aim
    document.getElementById('manualAim').innerText = exp.aim;

    // Apparatus
    const appList = document.getElementById('manualApparatus');
    if (appList) {
      appList.innerHTML = '';
      exp.apparatus.forEach(app => {
        const li = document.createElement('li');
        li.innerHTML = `<strong>${app.name}</strong> (${app.type}): ${app.range} — Qty: ${app.qty}`;
        appList.appendChild(li);
      });
    }

    // Procedure
    const procList = document.getElementById('manualProcedure');
    if (procList) {
      procList.innerHTML = '';
      exp.procedure.forEach(step => {
        const li = document.createElement('li');
        li.innerText = step;
        procList.appendChild(li);
      });
    }

    // Formulae
    const formBox = document.getElementById('manualFormulae');
    if (formBox) {
      formBox.innerHTML = '';
      exp.formulae.forEach(f => {
        const div = document.createElement('div');
        div.className = 'formula-card';
        div.innerHTML = `<div class="label">${f.label}</div><div class="math">${f.eq}</div>`;
        formBox.appendChild(div);
      });
    }

    // Viva Questions
    const vivaBox = document.getElementById('manualViva');
    if (vivaBox) {
      vivaBox.innerHTML = '';
      exp.vivaQuestions.forEach((vq, i) => {
        const div = document.createElement('div');
        div.className = 'viva-item';
        div.innerHTML = `
          <div class="viva-q" onclick="this.nextElementSibling.style.display = this.nextElementSibling.style.display === 'none' ? 'block' : 'none'">
            <span>Q${i+1}: ${vq.q}</span>
            <span style="color:#38bdf8;font-size:0.8rem">▼ Reveal Answer</span>
          </div>
          <div class="viva-a" style="display:none">${vq.a}</div>
        `;
        vivaBox.appendChild(div);
      });
    }
  }

  applyPreset(type) {
    if (type === 'noload') {
      this.s1 = 0;
      this.s2 = 0;
      document.getElementById('s1Slider').value = 0;
      document.getElementById('s2Slider').value = 0;
      document.getElementById('s1Val').innerText = '0.0 kg';
      document.getElementById('s2Val').innerText = '0.0 kg';
      this.showToast("Preset Applied: Zero Mechanical Load (No-Load)");
    } else if (type === 'halfload') {
      this.s1 = 6.0;
      this.s2 = 1.5;
      document.getElementById('s1Slider').value = 6.0;
      document.getElementById('s2Slider').value = 1.5;
      document.getElementById('s1Val').innerText = '6.0 kg';
      document.getElementById('s2Val').innerText = '1.5 kg';
      this.showToast("Preset Applied: 50% Rated Load");
    } else if (type === 'fullload') {
      this.s1 = 12.0;
      this.s2 = 2.0;
      document.getElementById('s1Slider').value = 12.0;
      document.getElementById('s2Slider').value = 2.0;
      document.getElementById('s1Val').innerText = '12.0 kg';
      document.getElementById('s2Val').innerText = '2.0 kg';
      this.showToast("Preset Applied: 100% Rated Full Load");
    }
  }

  prepareReport() {
    const exp = LAB_EXPERIMENTS.find(e => e.id === this.currentExpId);
    if (!exp) return;

    document.getElementById('repTitle').innerText = exp.title;
    document.getElementById('repAim').innerText = exp.aim;
    document.getElementById('repDate').innerText = new Date().toLocaleDateString('en-US', {
      year: 'numeric', month: 'long', day: 'numeric'
    });

    // Populate Report Table
    const rHead = document.getElementById('repTableHead');
    const rBody = document.getElementById('repTableBody');
    if (rHead && rBody) {
      rHead.innerHTML = '';
      rBody.innerHTML = '';

      exp.tableColumns.forEach(c => {
        const th = document.createElement('th');
        th.innerText = c.label;
        rHead.appendChild(th);
      });

      this.observations.forEach(row => {
        const tr = document.createElement('tr');
        exp.tableColumns.forEach(c => {
          const td = document.createElement('td');
          td.innerText = row[c.key] || '-';
          tr.appendChild(td);
        });
        rBody.appendChild(tr);
      });
    }
  }

  showToast(msg, type = 'info') {
    const toast = document.getElementById('labToast');
    if (!toast) return;
    toast.innerText = msg;
    toast.style.display = 'block';
    toast.style.background = type === 'error' ? '#ef4444' : (type === 'success' ? '#10b981' : '#1e293b');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      toast.style.display = 'none';
    }, 3200);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.labApp = new MotorLabApp();
});

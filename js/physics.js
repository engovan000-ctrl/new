/**
 * PHYSICS ENGINE: Electrical Machines & Drive Systems
 * Implements standard analytical & differential equations for:
 * 1. DC Shunt / Series Motors
 * 2. 3-Phase Squirrel Cage Induction Motor (Steinmetz Equivalent Circuit)
 * 3. 3-Phase Synchronous Machine (OCC/SCC, Synchronous Impedance, V-Curves)
 * 4. Single-Phase Transformer (OC / SC Parameters)
 */

class MotorPhysicsEngine {
  constructor() {
    this.time = 0;
    this.dt = 0.05; // 50ms simulation step
  }

  // ==========================================
  // 1. DC SHUNT MOTOR MODEL
  // ==========================================
  static dcShuntModel = {
    // Machine Specifications (5 HP, 220V, 1500 RPM DC Shunt Motor)
    V_rated: 220, // Volts
    P_rated: 3730, // Watts (5 HP)
    N_rated: 1500, // RPM
    I_rated: 20.0, // Amperes
    Ra: 0.6, // Armature resistance (Ohms)
    Rf0: 220.0, // Field winding resistance (Ohms)
    J: 0.08, // Moment of inertia (kg*m^2)
    B: 0.003, // Viscous friction coefficient (N*m*s/rad)
    T_fric0: 1.2, // Static/coulomb friction torque (N*m)
    P_core_rated: 140, // Core loss at rated speed & flux (Watts)
    r_pulley: 0.12, // Brake drum radius (meters) = 12 cm

    // State Variables
    speed_rpm: 0,
    speed_rads: 0,
    Ia: 0,
    If: 0,
    Eb: 0,
    T_dev: 0,
    T_shaft: 0,
    P_in: 0,
    P_out: 0,
    losses: 0,
    efficiency: 0,
    starter_res: 0, // resistance in series with armature from starter

    // Magnetization curve non-linearity: phi_pu vs If
    getFluxPU(If) {
      if (If <= 0) return 0.03; // residual flux
      // Froelich's equation normalized so If=1.0A gives phi=1.0
      const a = 1.65;
      const b = 0.65;
      const phi = (a * If) / (1 + b * If);
      return Math.max(0.03, phi);
    },

    step(dt, controls) {
      // controls: { supplyV, starterStep, fieldRheostat, armRheostat, s1, s2, isConnected }
      const V_sup = controls.isConnected ? controls.supplyV : 0;
      const R_arm_rheo = controls.armRheostat || 0;
      const R_field_rheo = controls.fieldRheostat || 0;
      const S1 = controls.s1 || 0; // kg
      const S2 = controls.s2 || 0; // kg

      // Starter resistance mapping: 0=OFF, 1=15 ohm, 2=8 ohm, 3=3 ohm, 4=RUN (0 ohm)
      const starterResMap = [Infinity, 15.0, 8.0, 3.0, 0.0];
      const R_starter = starterResMap[controls.starterStep] !== undefined ? starterResMap[controls.starterStep] : Infinity;

      // Field circuit calculation
      const Rf_total = this.Rf0 + R_field_rheo;
      let If = 0;
      if (controls.isConnected && controls.starterStep > 0 && Rf_total > 0) {
        If = V_sup / Rf_total;
      }
      this.If = If;
      const phi = this.getFluxPU(If);

      // Back-EMF constant: at rated speed (1500 RPM = 157.08 rad/s) & phi=1.0, Eb_rated = 220 - (20-1)*0.6 = 208.6V
      const omega_rated = (2 * Math.PI * this.N_rated) / 60;
      const ke = 208.6 / (1.0 * omega_rated); // ~1.328 V/(rad/s)
      const kt = ke; // in SI units, kt = ke = 1.328 N*m/A

      // Back EMF
      const Eb = ke * phi * this.speed_rads;
      this.Eb = Eb;

      // Total Armature resistance
      const Ra_total = this.Ra + R_arm_rheo + R_starter;

      let Ia = 0;
      if (controls.isConnected && controls.starterStep > 0 && Number.isFinite(Ra_total)) {
        Ia = (V_sup - Eb) / Ra_total;
        if (Ia < 0) Ia = 0; // Motoring only
      }
      this.Ia = Ia;

      // Electromagnetic torque developed
      const T_dev = kt * phi * Ia;
      this.T_dev = T_dev;

      // Load torque from brake drum: T = 9.81 * (S1 - S2) * r
      const netTensionKg = Math.max(0, S1 - S2);
      const T_load = netTensionKg * 9.81 * this.r_pulley;

      // Friction & core loss torque
      const T_loss = (this.T_fric0 + this.B * this.speed_rads) + (this.speed_rads > 0 ? (this.P_core_rated * phi * (this.speed_rads / omega_rated)) / Math.max(1, this.speed_rads) : 0);

      // Rotational dynamics: J * d(omega)/dt = T_dev - T_load - T_loss
      let T_accel = T_dev - T_load - T_loss;
      if (this.speed_rads <= 0 && T_accel < 0) {
        T_accel = 0;
        this.speed_rads = 0;
      }

      // Integrate speed
      this.speed_rads += (T_accel / this.J) * dt;
      if (this.speed_rads < 0) this.speed_rads = 0;
      this.speed_rpm = (this.speed_rads * 60) / (2 * Math.PI);

      // Shaft output torque (delivered to the brake)
      this.T_shaft = T_load;

      // Powers
      const IL = Ia + If;
      this.IL = IL;
      this.P_in = V_sup * IL;
      this.P_out = (2 * Math.PI * this.speed_rpm * this.T_shaft) / 60;
      this.losses = this.P_in - this.P_out;
      this.efficiency = this.P_in > 50 && this.P_out > 0 ? (this.P_out / this.P_in) * 100 : 0;
      if (this.efficiency > 98) this.efficiency = 98; // Realistic ceiling

      return {
        V: V_sup,
        IL: this.IL,
        Ia: this.Ia,
        If: this.If,
        Eb: this.Eb,
        speed_rpm: this.speed_rpm,
        T_dev: this.T_dev,
        T_load: this.T_shaft,
        P_in: this.P_in,
        P_out: this.P_out,
        efficiency: this.efficiency,
        netTensionKg: netTensionKg
      };
    }
  };

  // ==========================================
  // 2. DC SERIES MOTOR MODEL
  // ==========================================
  static dcSeriesModel = {
    V_rated: 220,
    P_rated: 3730,
    N_rated: 1500,
    I_rated: 20.0,
    Ra: 0.5,
    Rse: 0.3,
    J: 0.08,
    B: 0.003,
    T_fric0: 1.2,
    r_pulley: 0.12,

    speed_rpm: 0,
    speed_rads: 0,
    Ia: 0,
    Eb: 0,

    step(dt, controls) {
      const V_sup = controls.isConnected ? controls.supplyV : 0;
      const R_div = controls.diverterRes || 0; // diverter across series field
      const S1 = controls.s1 || 0;
      const S2 = controls.s2 || 0;
      const starterResMap = [Infinity, 12.0, 6.0, 2.0, 0.0];
      const R_starter = starterResMap[controls.starterStep] !== undefined ? starterResMap[controls.starterStep] : Infinity;

      const R_series_eff = R_div > 0 ? (this.Rse * R_div) / (this.Rse + R_div) : this.Rse;
      const Ra_total = this.Ra + R_series_eff + (controls.armRheostat || 0) + R_starter;

      // Estimate current and back EMF
      // Series flux is proportional to I_se
      const omega_rated = (2 * Math.PI * this.N_rated) / 60;
      const k_series = 0.065; // V / (A * rad/s)

      // Steady approximation with dynamic inertia
      let Ia = 0;
      if (controls.isConnected && controls.starterStep > 0 && Number.isFinite(Ra_total)) {
        // Back EMF Eb = k_series * Ia * omega
        // V = Ia * Ra_total + Eb = Ia * (Ra_total + k_series * omega)
        Ia = V_sup / (Ra_total + k_series * this.speed_rads);
        if (Ia < 0) Ia = 0;
      }
      this.Ia = Ia;
      this.Eb = k_series * Ia * this.speed_rads;

      // Torque T = k_series * Ia^2
      const T_dev = k_series * (Ia * Ia);
      const netTensionKg = Math.max(0, S1 - S2);
      const T_load = netTensionKg * 9.81 * this.r_pulley;
      const T_loss = this.T_fric0 + this.B * this.speed_rads;

      let T_accel = T_dev - T_load - T_loss;
      if (this.speed_rads <= 0 && T_accel < 0) {
        T_accel = 0;
        this.speed_rads = 0;
      }

      this.speed_rads += (T_accel / this.J) * dt;
      if (this.speed_rads < 0) this.speed_rads = 0;
      this.speed_rpm = (this.speed_rads * 60) / (2 * Math.PI);

      // Warning flag if speed shoots above 3500 RPM (DC Series runaway condition!)
      const runawayRisk = this.speed_rpm > 3000;

      const P_in = V_sup * Ia;
      const P_out = (2 * Math.PI * this.speed_rpm * T_load) / 60;
      const efficiency = P_in > 50 && P_out > 0 ? Math.min(95, (P_out / P_in) * 100) : 0;

      return {
        V: V_sup,
        IL: Ia,
        Ia: Ia,
        speed_rpm: this.speed_rpm,
        T_dev: T_dev,
        T_load: T_load,
        P_in: P_in,
        P_out: P_out,
        efficiency: efficiency,
        runawayRisk: runawayRisk,
        netTensionKg: netTensionKg
      };
    }
  };

  // ==========================================
  // 3. THREE-PHASE INDUCTION MOTOR (STEINMETZ EQUIVALENT)
  // ==========================================
  static inductionMotorModel = {
    // 5 HP, 415V L-L, 50 Hz, 4-Pole Squirrel Cage Motor
    V_LL_rated: 415,
    freq: 50,
    poles: 4,
    Ns: 1500, // Synchronous speed
    omega_s: (2 * Math.PI * 1500) / 60, // 157.08 rad/s
    P_rated: 3730,
    r_pulley: 0.12,

    // Steinmetz per-phase equivalent circuit parameters (referred to stator)
    R1: 1.25, // Stator resistance (Ohms)
    X1: 2.10, // Stator leakage reactance (Ohms)
    R2_prime: 1.15, // Rotor resistance referred to stator (Ohms)
    X2_prime: 2.10, // Rotor leakage reactance referred to stator (Ohms)
    Rc: 520.0, // Core loss resistance (Ohms)
    Xm: 42.0, // Magnetizing reactance (Ohms)
    P_fric_windage: 110, // Watts (3-phase)

    speed_rpm: 0,
    speed_rads: 0,
    slip: 1.0,
    J: 0.12,

    step(dt, controls) {
      // controls: { supplyV_LL, isConnected, s1, s2, isBlockedRotor, isNoLoad }
      const V_LL = controls.isConnected ? controls.supplyV_LL : 0;
      const V_ph = V_LL / Math.sqrt(3);

      const S1 = controls.s1 || 0;
      const S2 = controls.s2 || 0;
      const netTensionKg = Math.max(0, S1 - S2);
      const T_load = controls.isBlockedRotor ? 999 : netTensionKg * 9.81 * this.r_pulley;

      if (V_LL < 10 || !controls.isConnected) {
        // Motor decelerates to rest
        this.speed_rads = Math.max(0, this.speed_rads - 5 * dt);
        this.speed_rpm = (this.speed_rads * 60) / (2 * Math.PI);
        this.slip = 1.0;
        return {
          V_LL: 0,
          V_ph: 0,
          IL: 0,
          W1: 0,
          W2: 0,
          P_in: 0,
          P_out: 0,
          speed_rpm: this.speed_rpm,
          slip: 1.0,
          T_dev: 0,
          T_load: 0,
          powerFactor: 0,
          efficiency: 0,
          netTensionKg: 0
        };
      }

      // If blocked rotor experiment is active, slip is strictly 1.0, rotor stationary
      let s = 1.0;
      if (controls.isBlockedRotor) {
        s = 1.0;
        this.speed_rpm = 0;
        this.speed_rads = 0;
      } else {
        // Calculate operating slip from dynamic balance
        // Solve slip using Steinmetz impedance
        s = (this.Ns - this.speed_rpm) / this.Ns;
        if (s <= 0.001) s = 0.001; // small residual
        if (s > 1.0) s = 1.0;
      }
      this.slip = s;

      // Complex impedance calculation
      // Rotor branch: Z2 = R2'/s + j X2'
      const R2_eff = this.R2_prime / s;
      const X2_eff = this.X2_prime;

      // Parallel magnetizing branch: Zm = (Rc * j Xm) / (Rc + j Xm)
      const Zm_den_mag2 = this.Rc * this.Rc + this.Xm * this.Xm;
      const Rm_par = (this.Rc * this.Xm * this.Xm) / Zm_den_mag2;
      const Xm_par = (this.Rc * this.Rc * this.Xm) / Zm_den_mag2;

      // Parallel combination Z_parallel = (Zm * Z2) / (Zm + Z2)
      // Z2 = R2_eff + j X2_eff
      // Zm = Rm_par + j Xm_par
      const Zp_num_R = Rm_par * R2_eff - Xm_par * X2_eff;
      const Zp_num_X = Rm_par * X2_eff + Xm_par * R2_eff;
      const Zp_den_R = Rm_par + R2_eff;
      const Zp_den_X = Xm_par + X2_eff;
      const Zp_den_mag2 = Zp_den_R * Zp_den_R + Zp_den_X * Zp_den_X;

      const Zp_R = (Zp_num_R * Zp_den_R + Zp_num_X * Zp_den_X) / Zp_den_mag2;
      const Zp_X = (Zp_num_X * Zp_den_R - Zp_num_R * Zp_den_X) / Zp_den_mag2;

      // Total impedance Z_total = R1 + Zp_R + j (X1 + Zp_X)
      const Z_tot_R = this.R1 + Zp_R;
      const Z_tot_X = this.X1 + Zp_X;
      const Z_tot_mag = Math.sqrt(Z_tot_R * Z_tot_R + Z_tot_X * Z_tot_X);

      // Stator current per phase
      const I_ph = V_ph / Z_tot_mag;
      const IL = I_ph; // For star-connected stator

      // Power factor cos(phi)
      const powerFactor = Z_tot_R / Z_tot_mag;
      const phi_rad = Math.acos(Math.max(-1, Math.min(1, powerFactor)));

      // 3-Phase Input Power
      const P_in = Math.sqrt(3) * V_LL * IL * powerFactor;

      // 2-Wattmeter Method readings:
      // W1 = V_LL * I_L * cos(30° - phi)
      // W2 = V_LL * I_L * cos(30° + phi)
      const deg30 = (30 * Math.PI) / 180;
      const W1 = V_LL * IL * Math.cos(deg30 - phi_rad);
      const W2 = V_LL * IL * Math.cos(deg30 + phi_rad);

      // Developed torque via Thevenin / Air gap power
      // V_th per phase
      const Vth_mag = V_ph * (this.Xm / Math.sqrt(this.R1 * this.R1 + (this.X1 + this.Xm) * (this.X1 + this.Xm)));
      const Rth = this.R1 * Math.pow(this.Xm / (this.X1 + this.Xm), 2);
      const Xth = this.X1;

      const denom_T = Math.pow(Rth + this.R2_prime / s, 2) + Math.pow(Xth + this.X2_prime, 2);
      const T_dev = (3 * Math.pow(Vth_mag, 2) * (this.R2_prime / s)) / (this.omega_s * denom_T);

      if (!controls.isBlockedRotor) {
        // Accelerate or decelerate rotor
        const T_fric = (this.P_fric_windage / this.omega_s) * (this.speed_rads / this.omega_s);
        const T_net = T_dev - T_load - T_fric;
        this.speed_rads += (T_net / this.J) * dt;
        if (this.speed_rads < 0) this.speed_rads = 0;
        if (this.speed_rads > this.omega_s) this.speed_rads = this.omega_s - 0.05;
        this.speed_rpm = (this.speed_rads * 60) / (2 * Math.PI);
      }

      // Output power & Efficiency
      const P_out = controls.isBlockedRotor ? 0 : Math.max(0, (2 * Math.PI * this.speed_rpm * T_load) / 60);
      const efficiency = P_in > 50 && P_out > 0 ? Math.min(94, (P_out / P_in) * 100) : 0;

      return {
        V_LL: V_LL,
        V_ph: V_ph,
        IL: IL,
        W1: W1,
        W2: W2,
        P_in: P_in,
        P_out: P_out,
        speed_rpm: this.speed_rpm,
        slip: (this.Ns - this.speed_rpm) / this.Ns,
        T_dev: T_dev,
        T_load: T_load,
        powerFactor: powerFactor,
        efficiency: efficiency,
        netTensionKg: netTensionKg
      };
    }
  };

  // ==========================================
  // 4. THREE-PHASE SYNCHRONOUS MACHINE (ALTERNATOR / MOTOR)
  // ==========================================
  static syncMachineModel = {
    // 3 kVA, 415V, 50 Hz, 4-Pole Alternator
    S_rated: 3000,
    V_LL_rated: 415,
    V_ph_rated: 415 / Math.sqrt(3), // 239.6 V
    I_rated: 3000 / (Math.sqrt(3) * 415), // 4.17 A
    freq: 50,
    Ns: 1500,
    Ra: 0.95, // Armature resistance per phase (Ohms)
    If_rated_oc: 1.20, // Field current to generate rated terminal voltage on open circuit

    // Open Circuit Characteristics (OCC): Eo vs If
    getEo_LL(If) {
      if (If <= 0) return 12.0; // residual magnetism
      // Non-linear saturation curve: linear up to ~1.0A, bends over above 1.2A
      const E_max = 580;
      const k = 0.45;
      const Eo = (E_max * If) / (k + If);
      return Eo;
    },

    // Short Circuit Characteristics (SCC): Isc vs If
    getIsc(If) {
      if (If <= 0) return 0;
      // Strictly linear due to demagnetizing armature reaction
      const slope = 3.85; // A of Isc per Ampere of field current
      return slope * If;
    },

    // Voltage Regulation Calculation using EMF (Synchronous Impedance) Method
    calcVoltageRegulation(If_test, loadFraction, pf, pfType = 'lag') {
      const Eo_LL = this.getEo_LL(If_test);
      const Eo_ph = Eo_LL / Math.sqrt(3);

      const Isc = this.getIsc(If_test);
      const Zs = Isc > 0.05 ? Eo_ph / Isc : 0;
      const Xs = Math.sqrt(Math.max(0, Zs * Zs - this.Ra * this.Ra));

      const Ia = loadFraction * this.I_rated;
      const V_ph = this.V_ph_rated;

      const phi = Math.acos(pf);
      const sin_phi = Math.sin(phi);

      // EMF formula: E0^2 = (V*cos_phi + Ia*Ra)^2 + (V*sin_phi +/- Ia*Xs)^2
      // '+' for lagging, '-' for leading
      const sign = pfType === 'lead' ? -1 : 1;
      const term1 = V_ph * pf + Ia * this.Ra;
      const term2 = V_ph * sin_phi + sign * Ia * Xs;
      const E_calc_ph = Math.sqrt(term1 * term1 + term2 * term2);

      const percentReg = ((E_calc_ph - V_ph) / V_ph) * 100;

      return {
        Zs: Zs,
        Xs: Xs,
        Eo_ph: Eo_ph,
        Isc: Isc,
        Ia: Ia,
        E_calc_ph: E_calc_ph,
        E_calc_LL: E_calc_ph * Math.sqrt(3),
        percentReg: percentReg
      };
    },

    // V-Curves & Inverted V-Curves (Synchronous Motor Mode)
    getVCurveData(If, mechanicalLoadFraction) {
      // mechanicalLoadFraction: 0 (No load), 0.5 (Half load), 1.0 (Full load)
      const P_mech = mechanicalLoadFraction * 2200; // Watts
      const V_ph = this.V_ph_rated;
      const Xs = 18.5; // typical synchronous reactance per phase

      // Internal induced EMF Ef is proportional to If
      const Ef_ph = (this.getEo_LL(If) / Math.sqrt(3)) * 0.95;

      // Power angle delta from P = (3 * V_ph * Ef / Xs) * sin(delta)
      const P_max = (3 * V_ph * Ef_ph) / Xs;
      let sin_delta = P_mech / Math.max(1, P_max);
      if (sin_delta > 0.98) sin_delta = 0.98; // stability limit
      const delta = Math.asin(sin_delta);

      // Armature current vector: Ia = (V_ph - Ef_ph * /_ -delta) / (j Xs)
      // Real and imag components
      const Ef_real = Ef_ph * Math.cos(-delta);
      const Ef_imag = Ef_ph * Math.sin(-delta);

      const num_real = V_ph - Ef_real;
      const num_imag = -Ef_imag;

      // Divided by j Xs: (num_real + j num_imag) / (j Xs) = num_imag / Xs - j (num_real / Xs)
      const Ia_real = num_imag / Xs;
      const Ia_imag = -num_real / Xs;

      const Ia_mag = Math.sqrt(Ia_real * Ia_real + Ia_imag * Ia_imag);
      const pf = Ia_mag > 0.05 ? Math.max(0.1, Math.min(1.0, Ia_real / Ia_mag)) : 1.0;
      const isLeading = Ia_imag > 0;

      return {
        If: If,
        Ia: Ia_mag,
        powerFactor: pf,
        isLeading: isLeading,
        delta_deg: (delta * 180) / Math.PI
      };
    }
  };

  // ==========================================
  // 5. SINGLE-PHASE TRANSFORMER MODEL (OC / SC)
  // ==========================================
  static transformerModel = {
    rating_VA: 2000,
    V1_rated: 230,
    V2_rated: 115,
    freq: 50,
    I1_rated: 2000 / 230, // 8.7 A
    I2_rated: 2000 / 115, // 17.4 A

    // Core equivalent branch (LV side 115V)
    Rc_lv: 280.0,
    Xm_lv: 95.0,

    // Series leakage branch (HV side 230V)
    R01: 1.45, // Ohms
    X01: 2.30, // Ohms

    // Open Circuit Test (energized from LV side at 115V, HV open)
    getOCTest(V_applied) {
      const V0 = V_applied;
      const Iw = V0 / this.Rc_lv;
      const Im = V0 / this.Xm_lv;
      const I0 = Math.sqrt(Iw * Iw + Im * Im);
      const W0 = (V0 * V0) / this.Rc_lv; // Iron core loss
      const cos_phi0 = Iw / I0;

      return {
        V0: V0,
        I0: I0,
        W0: W0,
        cos_phi0: cos_phi0,
        Rc: this.Rc_lv,
        Xm: this.Xm_lv
      };
    },

    // Short Circuit Test (energized from HV side at reduced voltage, LV shorted)
    getSCTest(V_applied) {
      const Vsc = V_applied;
      const Z01 = Math.sqrt(this.R01 * this.R01 + this.X01 * this.X01);
      const Isc = Vsc / Z01;
      const Wsc = Isc * Isc * this.R01; // Full copper loss at this current
      const cos_phisc = this.R01 / Z01;

      return {
        Vsc: Vsc,
        Isc: Isc,
        Wsc: Wsc,
        cos_phisc: cos_phisc,
        R01: this.R01,
        X01: this.X01,
        Z01: Z01
      };
    },

    // Performance predetermination
    calcEfficiency(loadFraction, pf) {
      const W_iron = (this.V2_rated * this.V2_rated) / this.Rc_lv; // ~47 W
      const W_cu_full = Math.pow(this.I1_rated, 2) * this.R01; // ~110 W
      const W_cu = loadFraction * loadFraction * W_cu_full;

      const P_out = loadFraction * this.rating_VA * pf;
      const total_losses = W_iron + W_cu;
      const P_in = P_out + total_losses;
      const efficiency = P_in > 0 ? (P_out / P_in) * 100 : 0;

      // Regulation at specified load & PF
      // % Reg = (I1 * R01 * cos_phi +/- I1 * X01 * sin_phi) / V1 * 100
      const sin_phi = Math.sqrt(1 - pf * pf);
      const V_drop = (loadFraction * this.I1_rated) * (this.R01 * pf + this.X01 * sin_phi);
      const reg_percent = (V_drop / this.V1_rated) * 100;

      return {
        loadFraction: loadFraction,
        P_out: P_out,
        W_iron: W_iron,
        W_cu: W_cu,
        efficiency: efficiency,
        reg_percent: reg_percent
      };
    }
  };
}

// Expose globally
window.MotorPhysicsEngine = MotorPhysicsEngine;

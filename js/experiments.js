/**
 * LAB EXPERIMENTS DATABASE
 * 10 Comprehensive Electrical Machines & Drives Experiments:
 * 1. Brake Test (Direct Load Test) on DC Shunt Motor
 * 2. Speed Control of DC Shunt Motor (Armature & Field Control)
 * 3. Swinburne's Test on DC Shunt Machine (Pre-determination of Efficiency)
 * 4. Hopkinson's Regenerative Test on DC Shunt Machines
 * 5. Direct Load Test on 3-Phase Squirrel Cage Induction Motor
 * 6. No-Load and Blocked Rotor Test on 3-Phase Induction Motor
 * 7. Open Circuit (OCC) and Short Circuit (SCC) Test on Alternator (Regulation)
 * 8. V and Inverted V-Curves of 3-Phase Synchronous Motor
 * 9. Load Test on Single-Phase Induction Motor
 * 10. Open Circuit and Short Circuit Test on Single-Phase Transformer
 */

const LAB_EXPERIMENTS = [
  {
    id: "exp_dc_load",
    title: "1. Load Test on DC Shunt Motor (Brake Test)",
    category: "DC Machines",
    motorType: "DC_SHUNT",
    aim: "To conduct a direct brake load test on the given DC shunt motor and determine its performance characteristics: Torque, Output Power, Input Power, and Efficiency, and to plot Speed vs Ia, Torque vs Ia, Speed vs Torque, and Efficiency vs Output Power.",
    nameplate: {
      "Machine": "DC Shunt Motor",
      "Power Rating": "3.73 kW (5.0 HP)",
      "Rated Voltage": "220 V DC",
      "Rated Current": "20.0 A",
      "Rated Speed": "1500 RPM",
      "Armature Resistance (Ra)": "0.6 Ω",
      "Field Resistance (Rf)": "220 Ω",
      "Brake Pulley Radius (r)": "0.12 m (12 cm)"
    },
    apparatus: [
      { name: "DC Voltmeter", type: "MC (Moving Coil)", range: "0 - 300 V", qty: 1 },
      { name: "DC Ammeter (Line)", type: "MC", range: "0 - 25 A", qty: 1 },
      { name: "DC Ammeter (Field)", type: "MC", range: "0 - 2.5 A", qty: 1 },
      { name: "Field Rheostat", type: "Wire-wound", range: "300 Ω, 1.5 A", qty: 1 },
      { name: "3-Point Starter", type: "Face-plate", range: "220 V, 20 A", qty: 1 },
      { name: "Digital Tachometer", type: "Non-contact / Optical", range: "0 - 9999 RPM", qty: 1 },
      { name: "Mechanical Brake Drum", type: "Belt friction with dual spring balances", range: "0 - 25 kg", qty: 1 }
    ],
    procedure: [
      "Ensure the DPST main supply switch is in OFF position.",
      "Check that the 3-point starter handle is in the OFF position and the field rheostat slider is set to minimum resistance position (maximum field excitation for safe starting).",
      "Ensure both spring balance belts on the brake drum are loose with zero tension (No-load condition).",
      "Switch ON the 220V DC supply DPST switch.",
      "Gradually move the 3-point starter handle from OFF stud through Intermediate studs to the RUN stud. The motor starts and accelerates smoothly to rated speed (~1500 RPM).",
      "Record the no-load values of Line Voltage (V), Line Current (IL), Field Current (If), Speed (N), and Spring Balances (S1=0, S2=0).",
      "Tighten the brake drum handwheel gradually to apply mechanical load in steps (e.g. net tension 2 kg, 4 kg, 6 kg, 8 kg, 10 kg, 12 kg).",
      "At each load step, note down: Voltmeter (V), Line Ammeter (IL), Field Ammeter (If), Tachometer Speed (N), and Spring Balances S1 and S2 in kg.",
      "Do not exceed the rated current of 20.0 A.",
      "After completing readings, release the brake tension completely to no-load before switching OFF."
    ],
    formulae: [
      { label: "Spring Balance Difference", eq: "S = |S1 - S2| (kg)" },
      { label: "Shaft Torque Developed", eq: "T = 9.81 × (S1 - S2) × r (N·m), where r = 0.12 m" },
      { label: "Motor Input Power", eq: "Pin = V × IL (Watts)" },
      { label: "Motor Output Power", eq: "Pout = (2π × N × T) / 60 (Watts)" },
      { label: "Percentage Efficiency", eq: "η = (Pout / Pin) × 100 %" },
      { label: "Armature Current", eq: "Ia = IL - If (Amperes)" }
    ],
    tableColumns: [
      { key: "obsNo", label: "S.No" },
      { key: "V", label: "V (Volts)", unit: "V" },
      { key: "IL", label: "IL (A)", unit: "A" },
      { key: "If", label: "If (A)", unit: "A" },
      { key: "Ia", label: "Ia (A)", unit: "A" },
      { key: "N", label: "Speed (RPM)", unit: "RPM" },
      { key: "S1", label: "S1 (kg)", unit: "kg" },
      { key: "S2", label: "S2 (kg)", unit: "kg" },
      { key: "T", label: "Torque (N·m)", unit: "N·m" },
      { key: "Pin", label: "Pin (W)", unit: "W" },
      { key: "Pout", label: "Pout (W)", unit: "W" },
      { key: "eff", label: "Efficiency (%)", unit: "%" }
    ],
    calculateRow: (data) => {
      const V = parseFloat(data.V) || 0;
      const IL = parseFloat(data.IL) || 0;
      const If = parseFloat(data.If) || 0;
      const N = parseFloat(data.N) || 0;
      const S1 = parseFloat(data.S1) || 0;
      const S2 = parseFloat(data.S2) || 0;
      const r = 0.12;

      const Ia = Math.max(0, IL - If);
      const diffS = Math.max(0, Math.abs(S1 - S2));
      const T = 9.81 * diffS * r;
      const Pin = V * IL;
      const Pout = (2 * Math.PI * N * T) / 60;
      const eff = Pin > 30 ? (Pout / Pin) * 100 : 0;

      return {
        Ia: Ia.toFixed(2),
        T: T.toFixed(2),
        Pin: Pin.toFixed(1),
        Pout: Pout.toFixed(1),
        eff: Math.min(96, eff).toFixed(2)
      };
    },
    graphPresets: [
      { name: "Efficiency vs Output Power", xKey: "Pout", xName: "Pout", xUnit: "W", yKey: "eff", yName: "Efficiency", yUnit: "%", color: "#10b981" },
      { name: "Speed vs Armature Current", xKey: "Ia", xName: "Ia", xUnit: "A", yKey: "N", yName: "Speed", yUnit: "RPM", color: "#38bdf8" },
      { name: "Torque vs Armature Current", xKey: "Ia", xName: "Ia", xUnit: "A", yKey: "T", yName: "Torque", yUnit: "N·m", color: "#f59e0b" },
      { name: "Speed vs Torque", xKey: "T", xName: "Torque", xUnit: "N·m", yKey: "N", yName: "Speed", yUnit: "RPM", color: "#ec4899" }
    ],
    vivaQuestions: [
      {
        q: "Why should a DC shunt motor be started with maximum field resistance or minimum field resistance?",
        a: "It must be started with MINIMUM field rheostat resistance (maximum field current If). This ensures maximum magnetic flux Φ at startup. Since torque T = kΦIa, maximum flux produces higher starting torque and keeps the starting armature current low. It also prevents dangerous over-speeding since speed N ∝ 1/Φ."
      },
      {
        q: "What is the function of the No-Volt Release (NVR) coil in a 3-point starter?",
        a: "The NVR coil is connected in series with the field winding. It holds the soft-iron keeper on the starter handle against a return spring during normal operation. If supply fails or field circuit breaks, the electromagnet de-energizes, releasing the handle back to the OFF position, protecting the motor."
      },
      {
        q: "Why does the speed of a DC shunt motor drop slightly as load increases?",
        a: "As load increases, Ia increases, causing an armature resistance drop (Ia*Ra). Since Eb = V - Ia*Ra, back-EMF decreases slightly. Because speed N ∝ Eb/Φ, speed droops by about 5-8% from no load to full load."
      }
    ]
  },

  {
    id: "exp_dc_speed",
    title: "2. Speed Control of DC Shunt Motor",
    category: "DC Machines",
    motorType: "DC_SHUNT",
    aim: "To control the speed of a DC shunt motor by (a) Armature Voltage / Resistance Control Method (below rated speed) and (b) Field Flux Control Method (above rated speed), and plot Speed vs Armature Resistance and Speed vs Field Current.",
    nameplate: {
      "Machine": "DC Shunt Motor",
      "Power Rating": "3.73 kW (5.0 HP)",
      "Rated Voltage": "220 V DC",
      "Rated Current": "20.0 A",
      "Rated Speed": "1500 RPM"
    },
    apparatus: [
      { name: "DC Voltmeter", type: "MC", range: "0 - 300 V", qty: 1 },
      { name: "Armature Ammeter", type: "MC", range: "0 - 25 A", qty: 1 },
      { name: "Field Ammeter", type: "MC", range: "0 - 2.5 A", qty: 1 },
      { name: "Armature Rheostat", type: "Wire-wound", range: "20 Ω, 15 A", qty: 1 },
      { name: "Field Rheostat", type: "Wire-wound", range: "300 Ω, 1.5 A", qty: 1 },
      { name: "3-Point Starter", type: "Face-plate", range: "220 V, 20 A", qty: 1 },
      { name: "Digital Tachometer", type: "Optical", range: "0 - 9999 RPM", qty: 1 }
    ],
    procedure: [
      "Connect the circuit with field rheostat in field circuit and armature rheostat in series with armature.",
      "Method A (Field Flux Control): Keep armature rheostat at 0 Ω. Start motor and run at rated speed. Gradually increase field rheostat resistance (decreasing If) from 1.0 A down to 0.5 A in steps. Note Speed N and If. Speed increases above 1500 RPM.",
      "CAUTION: Never open the field circuit while motor is running, or speed will dangerously shoot up towards runaway!",
      "Method B (Armature Resistance Control): Keep field rheostat at minimum (rated flux). Introduce resistance in the armature circuit using the armature rheostat. Note Speed N and Va. Speed decreases below rated 1500 RPM."
    ],
    formulae: [
      { label: "Back EMF", eq: "Eb = V - Ia × (Ra + Rext_a)" },
      { label: "Speed Equation", eq: "N = (Eb / kΦ) ∝ (V - Ia·Ra) / If" },
      { label: "Field Control Range", eq: "N > N_rated (Constant Power Drive)" },
      { label: "Armature Control Range", eq: "N < N_rated (Constant Torque Drive)" }
    ],
    tableColumns: [
      { key: "obsNo", label: "S.No" },
      { key: "method", label: "Method" },
      { key: "Va", label: "Va (V)", unit: "V" },
      { key: "If", label: "If (A)", unit: "A" },
      { key: "Ia", label: "Ia (A)", unit: "A" },
      { key: "N", label: "Speed (RPM)", unit: "RPM" }
    ],
    calculateRow: (data) => data,
    graphPresets: [
      { name: "Speed vs Field Current (Flux Control)", xKey: "If", xName: "If", xUnit: "A", yKey: "N", yName: "Speed", yUnit: "RPM", color: "#38bdf8" },
      { name: "Speed vs Armature Voltage (Armature Control)", xKey: "Va", xName: "Va", xUnit: "V", yKey: "N", yName: "Speed", yUnit: "RPM", color: "#10b981" }
    ],
    vivaQuestions: [
      {
        q: "Why is field flux control called a constant-power control method?",
        a: "In field control, as field current If is decreased, flux Φ drops and speed N increases proportionally. However, allowable continuous armature current is limited by heating to rated value. Since torque T ∝ Φ·Ia decreases at the same rate that speed N increases, power P = T·ω remains approximately constant."
      },
      {
        q: "Why is armature control called a constant-torque drive?",
        a: "In armature control, flux Φ is maintained at rated maximum. The motor can deliver rated full torque (T = kΦIa) at any speed up to rated speed without exceeding rated current. Output power scales linearly with speed."
      }
    ]
  },

  {
    id: "exp_dc_swinburne",
    title: "3. Swinburne's Test on DC Shunt Machine",
    category: "DC Machines",
    motorType: "DC_SHUNT",
    aim: "To perform Swinburne's indirect test on a DC shunt machine to determine constant losses and pre-determine the efficiency of the machine running both as a Motor and as a Generator at various load currents.",
    nameplate: {
      "Machine": "DC Shunt Machine",
      "Power Rating": "3.73 kW (5.0 HP)",
      "Rated Voltage": "220 V DC",
      "Rated Current": "20.0 A",
      "Rated Speed": "1500 RPM",
      "Armature Resistance (Ra at 75°C)": "0.75 Ω"
    },
    apparatus: [
      { name: "DC Voltmeter", type: "MC", range: "0 - 300 V", qty: 1 },
      { name: "DC Ammeter (No-load)", type: "MC", range: "0 - 5 A", qty: 1 },
      { name: "Field Ammeter", type: "MC", range: "0 - 2 A", qty: 1 },
      { name: "Field Rheostat", type: "Wire-wound", range: "300 Ω, 1.5 A", qty: 1 },
      { name: "3-Point Starter", type: "Face-plate", range: "220 V, 20 A", qty: 1 }
    ],
    procedure: [
      "Run the DC shunt machine as a motor on NO LOAD at rated voltage and rated speed.",
      "Measure no-load supply voltage V0, no-load input current I0, and shunt field current If.",
      "Calculate no-load armature current: Ia0 = I0 - If.",
      "Measure armature resistance Ra using drop method and correct for operating temperature (Ra_hot = 1.25 * Ra_cold).",
      "Calculate constant losses: Wc = V0 * I0 - (Ia0)^2 * Ra.",
      "Pre-determine efficiency as Motor and Generator for loads of 25%, 50%, 75%, 100%, 125% of rated current."
    ],
    formulae: [
      { label: "Constant Losses (Core + Friction)", eq: "Wc = V0 × I0 - (Ia0)² × Ra (Watts)" },
      { label: "Motor Armature Current", eq: "Ia_m = IL - If (A)" },
      { label: "Motor Total Losses", eq: "Losses_m = Wc + (Ia_m)² × Ra (W)" },
      { label: "Motor Efficiency", eq: "η_m = [(V×IL - Losses_m) / (V×IL)] × 100 %" },
      { label: "Generator Armature Current", eq: "Ia_g = IL + If (A)" },
      { label: "Generator Efficiency", eq: "η_g = [(V×IL) / (V×IL + Wc + (Ia_g)² × Ra)] × 100 %" }
    ],
    tableColumns: [
      { key: "obsNo", label: "S.No" },
      { key: "loadFraction", label: "Load Fraction" },
      { key: "IL", label: "Load Current IL (A)", unit: "A" },
      { key: "Ia_m", label: "Ia Motor (A)", unit: "A" },
      { key: "eff_m", label: "Motor η (%)", unit: "%" },
      { key: "Ia_g", label: "Ia Gen (A)", unit: "A" },
      { key: "eff_g", label: "Gen η (%)", unit: "%" }
    ],
    calculateRow: (data) => {
      const IL = parseFloat(data.IL) || 0;
      const V = 220;
      const Ra = 0.75;
      const If = 1.0;
      const Wc = 265; // typical constant losses for 5HP machine

      const Ia_m = Math.max(0, IL - If);
      const Pin_m = V * IL;
      const loss_m = Wc + Ia_m * Ia_m * Ra;
      const eff_m = Pin_m > loss_m && Pin_m > 0 ? ((Pin_m - loss_m) / Pin_m) * 100 : 0;

      const Ia_g = IL + If;
      const Pout_g = V * IL;
      const loss_g = Wc + Ia_g * Ia_g * Ra;
      const eff_g = Pout_g > 0 ? (Pout_g / (Pout_g + loss_g)) * 100 : 0;

      return {
        Ia_m: Ia_m.toFixed(2),
        eff_m: Math.min(95, eff_m).toFixed(2),
        Ia_g: Ia_g.toFixed(2),
        eff_g: Math.min(95, eff_g).toFixed(2)
      };
    },
    graphPresets: [
      { name: "Motor Efficiency vs Load Current", xKey: "IL", xName: "IL", xUnit: "A", yKey: "eff_m", yName: "Motor η", yUnit: "%", color: "#38bdf8" },
      { name: "Generator Efficiency vs Load Current", xKey: "IL", xName: "IL", xUnit: "A", yKey: "eff_g", yName: "Gen η", yUnit: "%", color: "#10b981" }
    ],
    vivaQuestions: [
      {
        q: "What is the primary advantage of Swinburne's test over direct brake test?",
        a: "Swinburne's test is an indirect test conducted entirely at NO LOAD. It requires only very little power (just enough to cover no-load losses), does not require heavy mechanical loading apparatus, and can test large machines without wasting huge electrical energy."
      },
      {
        q: "Why CANNOT Swinburne's test be performed on a DC series motor?",
        a: "A DC series motor can NEVER be run on no-load! On no-load, series field current is nearly zero, flux drops to residual values, and the motor accelerates dangerously to destructive runaway speed ($N \\to \\infty$)."
      }
    ]
  },

  {
    id: "exp_dc_hopkinson",
    title: "4. Hopkinson's Regenerative Test on DC Shunt Machines",
    category: "DC Machines",
    motorType: "DC_SHUNT",
    aim: "To perform the back-to-back regenerative test on two identical mechanically coupled DC shunt machines to determine their individual efficiencies at full load.",
    nameplate: {
      "Machine 1 & 2": "Coupled DC Shunt Machines",
      "Power Rating": "3.73 kW each",
      "Rated Voltage": "220 V DC",
      "Rated Current": "20.0 A",
      "Armature Resistance": "0.6 Ω each"
    },
    apparatus: [
      { name: "DC Voltmeters", type: "MC", range: "0 - 300 V", qty: 2 },
      { name: "DC Ammeter (Mains)", type: "MC", range: "0 - 15 A", qty: 1 },
      { name: "DC Ammeter (Armature circulating)", type: "MC", range: "0 - 30 A", qty: 1 },
      { name: "Field Ammeters", type: "MC", range: "0 - 2.5 A", qty: 2 },
      { name: "Paralleling SPST Switch", type: "Knife switch", range: "250 V, 30 A", qty: 1 }
    ],
    procedure: [
      "Couple Machine 1 (Motor) and Machine 2 (Generator) mechanically via shaft coupling.",
      "Start Machine 1 as a shunt motor from mains supply using starter.",
      "Machine 1 drives Machine 2 as a generator.",
      "Adjust Machine 2 field excitation until voltage across the open paralleling switch is virtually zero (0V) with matching polarities.",
      "Close the paralleling switch. The generator is now in parallel with the mains supply.",
      "Adjust field rheostats: decrease Machine 1 field (to speed up) or increase Machine 2 field (to generate higher back-EMF) so full load current circulates.",
      "Record mains current I1, circulating generator current I2, field currents If1, If2, and terminal voltage V."
    ],
    formulae: [
      { label: "Mains Power Supplied", eq: "P_mains = V × I1 (Watts) = Total Losses" },
      { label: "Armature Stray Losses", eq: "W_stray = V·I1 - (I_f1 + I_f2)·V - Ia1²·Ra1 - Ia2²·Ra2" },
      { label: "Efficiency Calculation", eq: "Equal stray losses assigned to each machine to determine η_motor and η_generator" }
    ],
    tableColumns: [
      { key: "obsNo", label: "S.No" },
      { key: "V", label: "Voltage (V)", unit: "V" },
      { key: "I1", label: "Mains I1 (A)", unit: "A" },
      { key: "I2", label: "Gen I2 (A)", unit: "A" },
      { key: "If1", label: "Motor If1 (A)", unit: "A" },
      { key: "If2", label: "Gen If2 (A)", unit: "A" },
      { key: "eff_m", label: "Motor η (%)", unit: "%" },
      { key: "eff_g", label: "Gen η (%)", unit: "%" }
    ],
    calculateRow: (data) => data,
    graphPresets: [
      { name: "Efficiencies vs Circulating Current", xKey: "I2", xName: "Gen I2", xUnit: "A", yKey: "eff_m", yName: "Motor η", yUnit: "%", color: "#38bdf8" }
    ],
    vivaQuestions: [
      {
        q: "Why is Hopkinson's test called a regenerative test?",
        a: "Because the generator feeds electrical power directly back into the motor armature! The mains power supply only needs to furnish the total electrical and mechanical losses of both machines, rather than the full power rating."
      }
    ]
  },

  {
    id: "exp_ind_load",
    title: "5. Load Test on 3-Phase Squirrel Cage Induction Motor",
    category: "AC Induction Motors",
    motorType: "INDUCTION_3PH",
    aim: "To conduct a direct brake load test on a 3-phase squirrel cage induction motor and determine: Torque, Output Power, Input Power, Power Factor, Slip, and Efficiency, and to plot performance curves.",
    nameplate: {
      "Machine": "3-Phase Squirrel Cage Induction Motor",
      "Power Rating": "3.73 kW (5.0 HP)",
      "Rated Voltage": "415 V Line-to-Line AC",
      "Rated Current": "7.5 A",
      "Frequency": "50 Hz",
      "Poles": "4 Poles",
      "Synchronous Speed (Ns)": "1500 RPM",
      "Brake Pulley Radius (r)": "0.12 m"
    },
    apparatus: [
      { name: "AC Voltmeter", type: "MI (Moving Iron)", range: "0 - 500 V", qty: 1 },
      { name: "AC Ammeter", type: "MI", range: "0 - 15 A", qty: 1 },
      { name: "Wattmeters (2-element)", type: "Dynamometer", range: "500 V, 10 A, UPF", qty: 2 },
      { name: "3-Phase Auto-transformer (Variac)", type: "Toroidal", range: "415 V, 15 A", qty: 1 },
      { name: "Digital Tachometer", type: "Optical", range: "0 - 9999 RPM", qty: 1 },
      { name: "Brake Drum with Spring Balances", type: "Belt friction", range: "0 - 25 kg", qty: 1 }
    ],
    procedure: [
      "Ensure the 3-phase auto-transformer is at zero output position and brake belt is completely slack.",
      "Switch ON the 3-phase AC supply TPST switch.",
      "Gradually increase the 3-phase variac to rated 415 V line-to-line. The motor accelerates smoothly to near synchronous speed (~1485 RPM).",
      "Record no-load readings of V_LL, IL, W1, W2, Speed N, and S1=0, S2=0.",
      "Apply mechanical load gradually by tightening brake handwheels in increments (e.g. 2 kg, 4 kg, 6 kg, 8 kg, 10 kg).",
      "At each load step, note down: V_LL, IL, W1, W2, Speed N, and S1, S2.",
      "Observe if W2 reverses (becomes negative at light loads with PF < 0.5); if so, reverse potential coil connections.",
      "Do not exceed rated current of 7.5 A.",
      "Remove load completely before switching OFF."
    ],
    formulae: [
      { label: "Total Input Power", eq: "Pin = W1 + W2 (Watts)" },
      { label: "Power Factor", eq: "cos φ = cos(arctan(√3 · (W1 - W2) / (W1 + W2)))" },
      { label: "Brake Torque", eq: "T = 9.81 × (S1 - S2) × r (N·m)" },
      { label: "Synchronous Speed", eq: "Ns = 120 × f / P = 1500 RPM" },
      { label: "Slip", eq: "s = (Ns - N) / Ns" },
      { label: "Output Power", eq: "Pout = (2π × N × T) / 60 (Watts)" },
      { label: "Efficiency", eq: "η = (Pout / Pin) × 100 %" }
    ],
    tableColumns: [
      { key: "obsNo", label: "S.No" },
      { key: "V_LL", label: "V_LL (V)", unit: "V" },
      { key: "IL", label: "IL (A)", unit: "A" },
      { key: "W1", label: "W1 (W)", unit: "W" },
      { key: "W2", label: "W2 (W)", unit: "W" },
      { key: "Pin", label: "Pin (W)", unit: "W" },
      { key: "N", label: "Speed (RPM)", unit: "RPM" },
      { key: "slip", label: "Slip s" },
      { key: "S1", label: "S1 (kg)", unit: "kg" },
      { key: "S2", label: "S2 (kg)", unit: "kg" },
      { key: "T", label: "Torque (N·m)", unit: "N·m" },
      { key: "Pout", label: "Pout (W)", unit: "W" },
      { key: "pf", label: "Power Factor" },
      { key: "eff", label: "Efficiency (%)", unit: "%" }
    ],
    calculateRow: (data) => {
      const V_LL = parseFloat(data.V_LL) || 0;
      const IL = parseFloat(data.IL) || 0;
      const W1 = parseFloat(data.W1) || 0;
      const W2 = parseFloat(data.W2) || 0;
      const N = parseFloat(data.N) || 0;
      const S1 = parseFloat(data.S1) || 0;
      const S2 = parseFloat(data.S2) || 0;
      const r = 0.12;

      const Pin = W1 + W2;
      const diffS = Math.max(0, Math.abs(S1 - S2));
      const T = 9.81 * diffS * r;
      const Pout = (2 * Math.PI * N * T) / 60;
      const slip = Math.max(0, (1500 - N) / 1500);

      let pf = 0;
      if (Pin > 0 && V_LL > 0 && IL > 0) {
        pf = Pin / (Math.sqrt(3) * V_LL * IL);
        pf = Math.max(0, Math.min(1.0, pf));
      }
      const eff = Pin > 50 ? (Pout / Pin) * 100 : 0;

      return {
        Pin: Pin.toFixed(1),
        T: T.toFixed(2),
        Pout: Pout.toFixed(1),
        slip: slip.toFixed(3),
        pf: pf.toFixed(3),
        eff: Math.min(94, eff).toFixed(2)
      };
    },
    graphPresets: [
      { name: "Efficiency vs Output Power", xKey: "Pout", xName: "Pout", xUnit: "W", yKey: "eff", yName: "Efficiency", yUnit: "%", color: "#10b981" },
      { name: "Torque vs Slip", xKey: "slip", xName: "Slip", xUnit: "", yKey: "T", yName: "Torque", yUnit: "N·m", color: "#f59e0b" },
      { name: "Power Factor vs Output Power", xKey: "Pout", xName: "Pout", xUnit: "W", yKey: "pf", yName: "Power Factor", yUnit: "", color: "#38bdf8" },
      { name: "Speed vs Output Power", xKey: "Pout", xName: "Pout", xUnit: "W", yKey: "N", yName: "Speed", yUnit: "RPM", color: "#a855f7" }
    ],
    vivaQuestions: [
      {
        q: "Why does one wattmeter read negative or reverse at no-load in a 3-phase induction motor test?",
        a: "At no-load, an induction motor draws predominantly magnetizing current, operating at an extremely low power factor (cos φ < 0.5, i.e., phase angle φ > 60°). In the 2-wattmeter method, W2 = V·I·cos(30° + φ). When φ > 60°, (30° + φ) > 90°, so cos(30° + φ) becomes negative. Hence W2 deflects backwards."
      },
      {
        q: "Why can an induction motor never run at synchronous speed?",
        a: "If the rotor were to reach synchronous speed, relative speed between the rotating magnetic field and the rotor conductors would become zero. By Faraday's Law, zero EMF is induced in rotor bars, zero rotor current flows, and zero electromagnetic torque is produced to overcome friction. Hence slip s > 0 is mandatory."
      }
    ]
  },

  {
    id: "exp_ind_noload_blocked",
    title: "6. No-Load and Blocked Rotor Test on 3-Phase Induction Motor",
    category: "AC Induction Motors",
    motorType: "INDUCTION_3PH",
    aim: "To conduct No-Load and Blocked Rotor tests on a 3-phase induction motor to determine its equivalent circuit parameters (R1, R2', X1, X2', Rc, Xm) and construct the circle diagram to pre-determine its performance.",
    nameplate: {
      "Machine": "3-Phase Induction Motor",
      "Power Rating": "3.73 kW (5.0 HP)",
      "Rated Voltage": "415 V AC",
      "Rated Current": "7.5 A",
      "Frequency": "50 Hz",
      "Stator Resistance R1": "1.25 Ω per phase"
    },
    apparatus: [
      { name: "AC Voltmeter", type: "MI", range: "0 - 500 V / 0 - 150 V", qty: 1 },
      { name: "AC Ammeter", type: "MI", range: "0 - 10 A", qty: 1 },
      { name: "Wattmeters (LPF & UPF)", type: "Dynamometer", range: "500V/5A LPF, 150V/10A UPF", qty: 2 },
      { name: "3-Phase Variac", type: "Auto-transformer", range: "0 - 470 V", qty: 1 },
      { name: "Rotor Locking Clamp", type: "Mechanical lock", range: "Rigid", qty: 1 }
    ],
    procedure: [
      "PART A (No-Load Test): Keep rotor uncoupled and free to rotate with zero load.",
      "Apply rated line voltage (415 V) via the 3-phase variac.",
      "Record no-load line voltage V0, no-load current I0, and no-load wattmeters W01, W02. Total W0 = W01 + W02.",
      "PART B (Blocked Rotor Test): Lock the rotor rigidly so it cannot turn (slip s = 1.0).",
      "CAUTION: Start variac at 0 V and slowly increase voltage until rated current (7.5 A) flows in the stator ammeter. The applied voltage Vsc will be small (~70-90 V).",
      "Record short-circuit line voltage Vsc, short-circuit current Isc, and wattmeter readings Wsc1, Wsc2. Total Wsc = Wsc1 + Wsc2.",
      "Quickly reduce variac to zero to avoid rotor winding overheating."
    ],
    formulae: [
      { label: "No-Load Equivalent Parameters", eq: "cos φ0 = W0 / (√3·V0·I0),  Iw = I0·cos φ0,  Im = I0·sin φ0,  Rc = V0_ph / Iw,  Xm = V0_ph / Im" },
      { label: "Blocked Rotor Equivalent Parameters", eq: "Zeq = Vsc_ph / Isc_ph,  Req = Wsc / (3·Isc_ph²),  Xeq = √(Zeq² - Req²)" },
      { label: "Rotor Parameters", eq: "R2' = Req - R1,  X1 = X2' = 0.5 × Xeq" }
    ],
    tableColumns: [
      { key: "testType", label: "Test" },
      { key: "V_LL", label: "V_LL (V)", unit: "V" },
      { key: "IL", label: "IL (A)", unit: "A" },
      { key: "W_total", label: "W_total (W)", unit: "W" },
      { key: "cos_phi", label: "Power Factor" },
      { key: "param1", label: "Key Param 1" },
      { key: "param2", label: "Key Param 2" }
    ],
    calculateRow: (data) => data,
    graphPresets: [
      { name: "No Load / Blocked Characteristic", xKey: "IL", xName: "Current", xUnit: "A", yKey: "W_total", yName: "Power", yUnit: "W", color: "#38bdf8" }
    ],
    vivaQuestions: [
      {
        q: "Why is the blocked rotor test performed at reduced voltage rather than rated voltage?",
        a: "At standstill (s = 1), the rotor acts like a short-circuited transformer secondary. If full rated voltage (415 V) were applied, a dangerously high inrush current (5 to 8 times rated) would flow, quickly burning out the motor windings and tripping breakers."
      }
    ]
  },

  {
    id: "exp_sync_occ_scc",
    title: "7. OCC & SCC Test on 3-Phase Alternator (Voltage Regulation)",
    category: "Synchronous Machines",
    motorType: "SYNCHRONOUS_3PH",
    aim: "To obtain the Open Circuit Characteristic (OCC) and Short Circuit Characteristic (SCC) of a 3-phase alternator, determine synchronous impedance Zs and synchronous reactance Xs, and calculate percentage voltage regulation at 0.8 lagging, 1.0, and 0.8 leading power factor using the EMF method.",
    nameplate: {
      "Machine": "3-Phase Synchronous Generator / Alternator",
      "Rating": "3.0 kVA, 415 V, 50 Hz",
      "Rated Current": "4.17 A per phase",
      "Rated Speed": "1500 RPM (4-Pole)",
      "Armature Stator Resistance Ra": "0.95 Ω per phase",
      "Field Winding": "220 V DC Excitation"
    },
    apparatus: [
      { name: "AC Voltmeter (Open Circuit)", type: "MI", range: "0 - 600 V", qty: 1 },
      { name: "AC Ammeter (Short Circuit)", type: "MI", range: "0 - 10 A", qty: 1 },
      { name: "DC Ammeter (Field Current If)", type: "MC", range: "0 - 2.5 A", qty: 1 },
      { name: "DC Field Rheostat", type: "Wire-wound", range: "300 Ω, 1.5 A", qty: 1 },
      { name: "Digital Tachometer", type: "Optical", range: "0 - 9999 RPM", qty: 1 },
      { name: "Prime Mover (DC Shunt Motor)", type: "Coupled drive", range: "1500 RPM", qty: 1 }
    ],
    procedure: [
      "Run the alternator using the prime mover (DC motor) strictly at synchronous speed Ns = 1500 RPM throughout the experiment.",
      "PART A (Open Circuit Test - OCC): Keep alternator armature terminals open-circuited. Connect voltmeter across line terminals.",
      "Vary DC field excitation current If from 0 A up to 1.8 A in steps. Record Open Circuit Line Voltage Eo at each step. Speed must be constant at 1500 RPM.",
      "PART B (Short Circuit Test - SCC): Connect ammeters directly across alternator armature terminals (short circuit).",
      "CAUTION: Start with field current If = 0 A. Very gradually increase If until rated armature short circuit current (4.17 A) is reached.",
      "Record If and Isc. Note that SCC curve is a straight line through the origin.",
      "Compute Synchronous Impedance Zs = (Eo_ph / Isc_ph) at a chosen field current."
    ],
    formulae: [
      { label: "Synchronous Impedance", eq: "Zs = (Open Circuit Phase Voltage Eo_ph) / (Short Circuit Phase Current Isc_ph) at same If" },
      { label: "Synchronous Reactance", eq: "Xs = √(Zs² - Ra²) (Ohms/phase)" },
      { label: "EMF Equation for Regulation", eq: "Eo = √[(V·cos φ + Ia·Ra)² + (V·sin φ ± Ia·Xs)²] (+ for lag, - for lead)" },
      { label: "Percentage Voltage Regulation", eq: "% Reg = [(Eo - V_rated) / V_rated] × 100 %" }
    ],
    tableColumns: [
      { key: "obsNo", label: "S.No" },
      { key: "If", label: "Field Current If (A)", unit: "A" },
      { key: "Eo_LL", label: "OCC Eo (Line Volts)", unit: "V" },
      { key: "Eo_ph", label: "Eo (Phase Volts)", unit: "V" },
      { key: "Isc", label: "SCC Isc (A)", unit: "A" },
      { key: "Zs", label: "Zs (Ω/ph)", unit: "Ω" },
      { key: "Xs", label: "Xs (Ω/ph)", unit: "Ω" }
    ],
    calculateRow: (data) => {
      const If = parseFloat(data.If) || 0;
      const Eo_LL = parseFloat(data.Eo_LL) || 0;
      const Isc = parseFloat(data.Isc) || 0;
      const Ra = 0.95;

      const Eo_ph = Eo_LL / Math.sqrt(3);
      const Zs = Isc > 0.05 ? Eo_ph / Isc : 0;
      const Xs = Math.sqrt(Math.max(0, Zs * Zs - Ra * Ra));

      return {
        Eo_ph: Eo_ph.toFixed(1),
        Zs: Zs.toFixed(2),
        Xs: Xs.toFixed(2)
      };
    },
    graphPresets: [
      { name: "OCC & SCC Curves", xKey: "If", xName: "Field Current If", xUnit: "A", yKey: "Eo_LL", yName: "Open Circuit Voltage Eo", yUnit: "V", color: "#38bdf8" },
      { name: "Short Circuit Current SCC", xKey: "If", xName: "Field Current If", xUnit: "A", yKey: "Isc", yName: "SCC Current Isc", yUnit: "A", color: "#f59e0b" }
    ],
    vivaQuestions: [
      {
        q: "Why is the Short Circuit Characteristic (SCC) of an alternator a straight line while OCC is curved?",
        a: "Under short-circuit conditions, the power factor is near zero lagging. The armature reaction is purely demagnetizing, which drastically reduces the net resultant flux in the magnetic core. Because the iron core remains deeply unsaturated, flux is directly proportional to field current, making SCC perfectly linear."
      },
      {
        q: "Why is the EMF method called a 'Pessimistic Method'?",
        a: "Because the synchronous reactance Xs determined from unsaturated OCC values is higher than the actual saturated value under load. Consequently, the calculated voltage regulation is higher than actual tested regulation, giving a pessimistic prediction."
      }
    ]
  },

  {
    id: "exp_sync_v_curves",
    title: "8. V and Inverted V-Curves of Synchronous Motor",
    category: "Synchronous Machines",
    motorType: "SYNCHRONOUS_3PH",
    aim: "To plot the V-curves (Armature Current Ia vs Field Current If) and Inverted V-curves (Power Factor cos φ vs Field Current If) of a 3-phase synchronous motor at constant mechanical load.",
    nameplate: {
      "Machine": "3-Phase Synchronous Motor",
      "Rating": "3.0 kVA / 415 V / 50 Hz",
      "Rated Current": "4.17 A",
      "Rated Speed": "1500 RPM (Synchronous)"
    },
    apparatus: [
      { name: "AC Voltmeter", type: "MI", range: "0 - 500 V", qty: 1 },
      { name: "AC Ammeter (Armature Ia)", type: "MI", range: "0 - 10 A", qty: 1 },
      { name: "DC Ammeter (Field If)", type: "MC", range: "0 - 2.5 A", qty: 1 },
      { name: "Power Factor Meter", type: "Electrodynamic", range: "0.2 Lag - 1 - 0.2 Lead", qty: 1 },
      { name: "DC Field Rheostat", type: "Wire-wound", range: "300 Ω, 1.5 A", qty: 1 }
    ],
    procedure: [
      "Connect the synchronous motor to the 415V 3-phase AC bus bar and synchronize.",
      "Keep mechanical shaft load fixed (e.g. No-load or Half-load).",
      "Vary DC field excitation current If from under-excitation (~0.4 A) through normal excitation (~1.0 A) to over-excitation (~1.8 A).",
      "At each step, note Field Current If, Armature Current Ia, and Power Factor cos φ (noting whether Lagging or Leading).",
      "Observe that at normal excitation, Ia reaches a minimum and Power Factor is Unity (1.0).",
      "Under-excitation draws lagging current; over-excitation draws leading current (acts as a Synchronous Condenser)."
    ],
    formulae: [
      { label: "Armature Current Minimum", eq: "Ia_min occurs when cos φ = 1.0 (Unity PF)" },
      { label: "Under-Excitation Region", eq: "If < If_normal : Draws Lagging Reactive Power (Q > 0)" },
      { label: "Over-Excitation Region", eq: "If > If_normal : Supplies Reactive Power (Leading PF, Q < 0)" }
    ],
    tableColumns: [
      { key: "obsNo", label: "S.No" },
      { key: "loadCondition", label: "Load State" },
      { key: "If", label: "Field If (A)", unit: "A" },
      { key: "Ia", label: "Armature Ia (A)", unit: "A" },
      { key: "pf", label: "Power Factor" },
      { key: "nature", label: "PF Nature (Lag/Lead)" }
    ],
    calculateRow: (data) => data,
    graphPresets: [
      { name: "V-Curve (Ia vs If)", xKey: "If", xName: "Field Current If", xUnit: "A", yKey: "Ia", yName: "Armature Current Ia", yUnit: "A", color: "#38bdf8" },
      { name: "Inverted V-Curve (PF vs If)", xKey: "If", xName: "Field Current If", xUnit: "A", yKey: "pf", yName: "Power Factor", yUnit: "", color: "#10b981" }
    ],
    vivaQuestions: [
      {
        q: "What is a Synchronous Condenser?",
        a: "An over-excited synchronous motor running without mechanical load on its shaft. It draws leading reactive current from the power system, thereby compensating for lagging reactive power drawn by inductive loads and improving overall plant power factor."
      }
    ]
  },

  {
    id: "exp_1ph_ind",
    title: "9. Load Test on Single-Phase Induction Motor",
    category: "AC Induction Motors",
    motorType: "INDUCTION_1PH",
    aim: "To determine the speed, torque, output power, efficiency, and power factor of a single-phase capacitor-start capacitor-run induction motor under direct brake loading.",
    nameplate: {
      "Machine": "1-Phase Capacitor Run Induction Motor",
      "Rating": "1.0 HP (746 W), 230 V, 50 Hz",
      "Rated Current": "5.2 A",
      "Rated Speed": "1440 RPM",
      "Brake Pulley Radius": "0.10 m"
    },
    apparatus: [
      { name: "AC Voltmeter", type: "MI", range: "0 - 300 V", qty: 1 },
      { name: "AC Ammeter", type: "MI", range: "0 - 10 A", qty: 1 },
      { name: "AC Wattmeter", type: "UPF", range: "300 V, 10 A", qty: 1 },
      { name: "Digital Tachometer", type: "Optical", range: "0 - 9999 RPM", qty: 1 },
      { name: "Spring Balances", type: "Dual belt", range: "0 - 15 kg", qty: 1 }
    ],
    procedure: [
      "Connect 1-phase AC supply 230V through variac and wattmeter to motor terminals.",
      "Ensure brake belt is loose. Switch ON 230V AC supply.",
      "Gradually apply mechanical load in steps (1 kg to 6 kg).",
      "Record V, I, W, N, S1, S2 at each step."
    ],
    formulae: [
      { label: "Torque", eq: "T = 9.81 × (S1 - S2) × r (N·m)" },
      { label: "Output Power", eq: "Pout = (2π × N × T) / 60 (Watts)" },
      { label: "Efficiency", eq: "η = (Pout / W) × 100 %" },
      { label: "Power Factor", eq: "cos φ = W / (V × I)" }
    ],
    tableColumns: [
      { key: "obsNo", label: "S.No" },
      { key: "V", label: "Voltage (V)", unit: "V" },
      { key: "I", label: "Current (A)", unit: "A" },
      { key: "W", label: "Power (W)", unit: "W" },
      { key: "N", label: "Speed (RPM)", unit: "RPM" },
      { key: "S1", label: "S1 (kg)", unit: "kg" },
      { key: "S2", label: "S2 (kg)", unit: "kg" },
      { key: "T", label: "Torque (N·m)", unit: "N·m" },
      { key: "Pout", label: "Pout (W)", unit: "W" },
      { key: "eff", label: "Efficiency (%)", unit: "%" },
      { key: "pf", label: "Power Factor" }
    ],
    calculateRow: (data) => {
      const V = parseFloat(data.V) || 0;
      const I = parseFloat(data.I) || 0;
      const W = parseFloat(data.W) || 0;
      const N = parseFloat(data.N) || 0;
      const S1 = parseFloat(data.S1) || 0;
      const S2 = parseFloat(data.S2) || 0;
      const r = 0.10;

      const T = 9.81 * Math.max(0, Math.abs(S1 - S2)) * r;
      const Pout = (2 * Math.PI * N * T) / 60;
      const eff = W > 20 ? (Pout / W) * 100 : 0;
      const pf = (V * I) > 0 ? Math.min(1.0, W / (V * I)) : 0;

      return {
        T: T.toFixed(2),
        Pout: Pout.toFixed(1),
        eff: Math.min(88, eff).toFixed(2),
        pf: pf.toFixed(3)
      };
    },
    graphPresets: [
      { name: "Efficiency vs Output Power", xKey: "Pout", xName: "Pout", xUnit: "W", yKey: "eff", yName: "Efficiency", yUnit: "%", color: "#10b981" }
    ],
    vivaQuestions: [
      {
        q: "Why is a single-phase induction motor not self-starting?",
        a: "According to Double Revolving Field Theory, a pulsating 1-phase stator field resolves into two equal and opposite rotating magnetic fields traveling at synchronous speed in opposite directions. At standstill (slip s = 1 for both), forward and backward torques are identical in magnitude and cancel out, yielding zero net starting torque."
      }
    ]
  },

  {
    id: "exp_transformer",
    title: "10. OC & SC Test on Single-Phase Transformer",
    category: "Transformers",
    motorType: "TRANSFORMER",
    aim: "To conduct Open Circuit (OC) and Short Circuit (SC) tests on a single-phase transformer to determine its core losses, full-load copper losses, and equivalent circuit parameters, and pre-determine efficiency and regulation.",
    nameplate: {
      "Machine": "1-Phase Step-Down Transformer",
      "Rating": "2.0 kVA, 50 Hz",
      "HV Voltage (V1)": "230 V",
      "LV Voltage (V2)": "115 V",
      "Rated HV Current": "8.70 A",
      "Rated LV Current": "17.4 A"
    },
    apparatus: [
      { name: "AC Voltmeter", type: "MI", range: "0 - 300 V / 0 - 30 V", qty: 2 },
      { name: "AC Ammeter", type: "MI", range: "0 - 2 A / 0 - 10 A", qty: 2 },
      { name: "AC Wattmeters", type: "LPF & UPF", range: "150V/2A LPF, 75V/10A UPF", qty: 2 },
      { name: "Single Phase Variac", type: "Toroidal auto-transformer", range: "0 - 270 V, 10 A", qty: 1 }
    ],
    procedure: [
      "PART A (Open Circuit Test): Conducted on Low Voltage (LV) side with High Voltage (HV) side open-circuited.",
      "Apply rated voltage (115 V) to LV winding. Measure no-load voltage V0, no-load current I0, and no-load core power W0.",
      "PART B (Short Circuit Test): Conducted on High Voltage (HV) side with Low Voltage (LV) side solidly shorted.",
      "Apply reduced voltage using variac until rated current (8.7 A) flows in the HV winding.",
      "Measure short-circuit voltage Vsc, short-circuit current Isc, and short-circuit copper loss Wsc.",
      "Calculate Rc, Xm, R01, X01, Z01 and pre-determine efficiency at 25%, 50%, 75%, 100%, 125% full load."
    ],
    formulae: [
      { label: "Core Loss Parameters (LV)", eq: "cos φ0 = W0 / (V0·I0),  Iw = I0·cos φ0,  Im = I0·sin φ0,  Rc = V0 / Iw,  Xm = V0 / Im" },
      { label: "Series Leakage Parameters (HV)", eq: "Z01 = Vsc / Isc,  R01 = Wsc / (Isc²),  X01 = √(Z01² - R01²)" },
      { label: "Efficiency Predetermination", eq: "η = (x·S·cos φ) / (x·S·cos φ + W0 + x²·Wsc) × 100 %" },
      { label: "Voltage Regulation", eq: "% Reg = [I1·(R01·cos φ ± X01·sin φ) / V1] × 100 %" }
    ],
    tableColumns: [
      { key: "testType", label: "Test" },
      { key: "V", label: "Voltage (V)", unit: "V" },
      { key: "I", label: "Current (A)", unit: "A" },
      { key: "W", label: "Power (W)", unit: "W" },
      { key: "cos_phi", label: "Power Factor" },
      { key: "param1", label: "Param 1" },
      { key: "param2", label: "Param 2" }
    ],
    calculateRow: (data) => data,
    graphPresets: [
      { name: "Efficiency vs Load Fraction", xKey: "load", xName: "Load Fraction", xUnit: "pu", yKey: "eff", yName: "Efficiency", yUnit: "%", color: "#10b981" }
    ],
    vivaQuestions: [
      {
        q: "Why is the OC test conducted on the LV side and SC test on the HV side?",
        a: "In OC test, rated voltage is applied; rated LV voltage is lower (e.g. 115V) and no-load current is small (2-5% of rated), so standard meters are easily available and safe. In SC test, rated current is passed; rated HV current is lower (8.7A compared to 17.4A on LV), so meters of normal rating can be used and variac current capacity is not exceeded."
      }
    ]
  }
];

window.LAB_EXPERIMENTS = LAB_EXPERIMENTS;

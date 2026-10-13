# Electrical Machines & Drives Virtual Laboratory Simulator

A comprehensive, high-fidelity virtual electrical machines testing laboratory environment designed for undergraduate and graduate electrical engineering students, instructors, and practicing motor drive engineers.

---

## ⚡ Overview & Features

This simulator reproduces the physical experience of a university or industrial electrical machinery lab:
1. **Interactive Virtual Rigging & Bench**:
   - Realistic patch cord wiring with color-coded leads (Red `+`, Black `-`, Blue, Yellow, Green Earth).
   - Interactive binding posts: Mains Supply, DPST/TPST Knife Switches, 3-Point Starter studs (L, F, A), Field Rheostats, Armature Rheostats, and Motor terminal box.
   - **One-Click Auto-Wiring** or manual terminal-to-terminal patching.
   - **Circuit Topology Validator**: Checks for open circuits, missing return paths, or field open hazards prior to energization.
   - **Animated Electron Flow**: Real-time current indicators pulsing along connected wires.

2. **Electromechanical Machinery Simulation**:
   - Dynamic 3D/2.5D animated motor housing with cooling fins and spinning shaft.
   - Shaft speed visualizer with dynamic stroboscopic blur matching instantaneous RPM.
   - Mechanical dual spring balance brake drum with adjustable handwheels ($S_1, S_2$) and friction heat dissipation.
   - **Audio Engine (Web Audio API)**: Synthesizes 50 Hz AC transformer hum, commutator slot whine proportional to RPM, brake friction hiss, and breaker trip snaps without external audio files.

3. **10 Comprehensive Laboratory Experiments Included**:
   - **Experiment 1**: Load Test on DC Shunt Motor (Brake Test)
   - **Experiment 2**: Speed Control of DC Shunt Motor (Armature & Field Flux Control)
   - **Experiment 3**: Swinburne's Test on DC Shunt Machine (Pre-determination of Efficiency)
   - **Experiment 4**: Hopkinson's Regenerative Test on DC Shunt Machines
   - **Experiment 5**: Direct Load Test on 3-Phase Squirrel Cage Induction Motor
   - **Experiment 6**: No-Load and Blocked Rotor Test on 3-Phase Induction Motor (Equivalent Circuit)
   - **Experiment 7**: Open Circuit (OCC) and Short Circuit (SCC) Test on 3-Phase Alternator (Voltage Regulation)
   - **Experiment 8**: V and Inverted V-Curves of 3-Phase Synchronous Motor
   - **Experiment 9**: Direct Load Test on Single-Phase Induction Motor
   - **Experiment 10**: Open Circuit and Short Circuit Test on Single-Phase Transformer

4. **Complete Academic Toolkit**:
   - **Lab Manual**: Aim, apparatus list, nameplate ratings, procedures, and mathematical equations.
   - **Viva-Voce Interactive Prep**: Standard oral exam questions with click-to-reveal answers.
   - **Live Observation Table**: Add rows, auto-calculate derived parameters, and export to CSV.
   - **High-Resolution Performance Curves**: Plot Speed vs Torque, Efficiency vs Power, OCC & SCC, or V-curves; export to PNG.
   - **Printable Formal Lab Report**: Formatted university test sheet ready for PDF export or printing.

---

## 🚀 How to Launch the Simulator

### Option 1: Double-Click
Double-click `launch_simulator.bat` in Windows Explorer or open `index.html` in any web browser (Google Chrome, Microsoft Edge, Mozilla Firefox, Brave, Safari).

### Option 2: PowerShell
```powershell
.\launch_simulator.ps1
```

Zero external dependencies or server installations (Node.js/Python) are required. Everything runs locally in client-side HTML5, CSS3, and JavaScript!

---

## 📐 Mathematical Models & Formulae

### 1. DC Shunt Motor (Brake Test)
- **Torque**:
  $$T = 9.81 \times (S_1 - S_2) \times r \quad (\text{N}\cdot\text{m})$$
- **Input Power**:
  $$P_{\text{in}} = V \times I_L \quad (\text{W})$$
- **Output Power**:
  $$P_{\text{out}} = \frac{2\pi \times N \times T}{60} \quad (\text{W})$$
- **Efficiency**:
  $$\eta = \frac{P_{\text{out}}}{P_{\text{in}}} \times 100\%$$

### 2. 3-Phase Induction Motor
- **Synchronous Speed**:
  $$N_s = \frac{120 \times f}{P} = 1500\text{ RPM}$$
- **Operating Slip**:
  $$s = \frac{N_s - N}{N_s}$$
- **Total Input Power (2-Wattmeter Method)**:
  $$P_{\text{in}} = W_1 + W_2$$
- **Power Factor**:
  $$\cos\phi = \cos\left(\arctan\left(\sqrt{3} \frac{W_1 - W_2}{W_1 + W_2}\right)\right)$$

### 3. Synchronous Alternator (Voltage Regulation)
- **Synchronous Impedance**:
  $$Z_s = \frac{E_{0,\text{ph}}}{I_{sc,\text{ph}}} \quad (\Omega/\text{phase})$$
- **Synchronous Reactance**:
  $$X_s = \sqrt{Z_s^2 - R_a^2}$$
- **Voltage Regulation (EMF Method)**:
  $$E_0 = \sqrt{(V\cos\phi + I_a R_a)^2 + (V\sin\phi \pm I_a X_s)^2}$$
  $$\%\,\text{Reg} = \frac{E_0 - V}{V} \times 100\%$$

---

## 🛡️ Safety Systems & Interlocks
- **Starting Current Protection**: Starter handle must be stepped from OFF through intermediate resistance studs to RUN to prevent tripping.
- **Overcurrent Breaker**: Trips automatically if line current exceeds 140% of rated value.
- **Field Open Protection**: Tripping alert if field excitation circuit is disconnected while running.
- **Runaway Warning**: Speed protection on series motors to prevent destructive runaway under zero load.

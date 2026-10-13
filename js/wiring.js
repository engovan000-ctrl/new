/**
 * INTERACTIVE WIRING & SCHEMATIC SYSTEM
 * Manages:
 * - Interactive terminal patch cords (Click-to-wire or drag)
 * - Color selector (Red, Black, Blue, Yellow, Green)
 * - Auto-wire & reset functionality
 * - Circuit topology checker (verifies correct lab wiring before energizing)
 * - Animated current flow along wires when circuit is active
 */

class LabWiringSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.wires = []; // [{ fromId, toId, color, pathPoints }]
    this.terminals = {}; // { id: { x, y, label, type, componentId } }
    this.selectedTerminal = null;
    this.currentColor = '#ef4444'; // Red default
    this.isAutoWired = false;
    this.isVerified = false;

    this.activeExperimentId = 'exp_dc_load';
    this.currentParticles = []; // For animated electron flow

    this.initEvents();
    this.resize();
  }

  initEvents() {
    window.addEventListener('resize', () => this.resize());

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      // Check if user clicked a terminal
      const termId = this.findTerminalAt(clickX, clickY);

      if (termId) {
        if (!this.selectedTerminal) {
          // Select starting terminal
          this.selectedTerminal = termId;
          this.render();
        } else if (this.selectedTerminal === termId) {
          // Deselect
          this.selectedTerminal = null;
          this.render();
        } else {
          // Connect wire between selected and clicked terminal
          this.connectTerminals(this.selectedTerminal, termId, this.currentColor);
          this.selectedTerminal = null;
          this.isVerified = false;
          this.render();
        }
        return;
      }

      // Check if user clicked on an existing wire to delete it
      const wireIdx = this.findWireAt(clickX, clickY);
      if (wireIdx !== -1) {
        this.wires.splice(wireIdx, 1);
        this.isAutoWired = false;
        this.isVerified = false;
        this.render();
        if (window.labApp) window.labApp.onWiringChanged();
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
      if (this.selectedTerminal) {
        this.render();
      }
    });
  }

  resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = rect.width > 200 ? rect.width : 900;
    const height = 480;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';

    this.ctx.scale(dpr, dpr);
    this.logicalWidth = width;
    this.logicalHeight = height;

    this.updateTerminalPositions();
    this.render();
  }

  setExperiment(expId) {
    this.activeExperimentId = expId;
    this.wires = [];
    this.selectedTerminal = null;
    this.isAutoWired = false;
    this.isVerified = false;
    this.updateTerminalPositions();
    this.autoWire(); // By default, provide a fully wired operational bench, with option to re-wire manually!
  }

  updateTerminalPositions() {
    const W = this.logicalWidth || 900;
    const H = this.logicalHeight || 480;

    this.terminals = {};

    // Standard Lab Layout Nodes:
    // Top Left: DC/AC Mains Supply Terminals
    this.addTerminal('SUP_POS', W * 0.08, 90, 'Supply (+)', 'supply', 'SUPPLY');
    this.addTerminal('SUP_NEG', W * 0.08, 140, 'Supply (-)', 'supply', 'SUPPLY');

    // DPST / TPST Switch
    this.addTerminal('SW_IN_POS', W * 0.16, 90, 'Switch In (+)', 'switch', 'SWITCH');
    this.addTerminal('SW_IN_NEG', W * 0.16, 140, 'Switch In (-)', 'switch', 'SWITCH');
    this.addTerminal('SW_OUT_POS', W * 0.24, 90, 'Switch Out (+)', 'switch', 'SWITCH');
    this.addTerminal('SW_OUT_NEG', W * 0.24, 140, 'Switch Out (-)', 'switch', 'SWITCH');

    // Voltmeter Terminals (Center-top)
    this.addTerminal('VM_POS', W * 0.35, 75, 'VM (+)', 'meter', 'VOLTMETER');
    this.addTerminal('VM_NEG', W * 0.35, 125, 'VM (-)', 'meter', 'VOLTMETER');

    // Line Ammeter (Top middle-right)
    this.addTerminal('AM_LINE_IN', W * 0.44, 90, 'Line AM (+)', 'meter', 'AM_LINE');
    this.addTerminal('AM_LINE_OUT', W * 0.51, 90, 'Line AM (-)', 'meter', 'AM_LINE');

    // 3-Point Starter (L, F, A)
    this.addTerminal('ST_L', W * 0.60, 85, 'Starter (L)', 'starter', 'STARTER');
    this.addTerminal('ST_F', W * 0.66, 85, 'Starter (F)', 'starter', 'STARTER');
    this.addTerminal('ST_A', W * 0.72, 85, 'Starter (A)', 'starter', 'STARTER');

    // Field Ammeter & Field Rheostat (Right top)
    this.addTerminal('AM_FLD_IN', W * 0.81, 75, 'Field AM (+)', 'meter', 'AM_FIELD');
    this.addTerminal('AM_FLD_OUT', W * 0.87, 75, 'Field AM (-)', 'meter', 'AM_FIELD');
    this.addTerminal('RHEO_F_IN', W * 0.81, 145, 'Field Rheo In', 'rheo', 'RHEO_FIELD');
    this.addTerminal('RHEO_F_OUT', W * 0.90, 145, 'Field Rheo Out', 'rheo', 'RHEO_FIELD');

    // Motor Terminal Box (Bottom right): A1, A2, F1, F2
    this.addTerminal('MOT_A1', W * 0.68, 350, 'Armature A1', 'motor', 'MOTOR');
    this.addTerminal('MOT_A2', W * 0.74, 350, 'Armature A2', 'motor', 'MOTOR');
    this.addTerminal('MOT_F1', W * 0.82, 350, 'Field F1', 'motor', 'MOTOR');
    this.addTerminal('MOT_F2', W * 0.88, 350, 'Field F2', 'motor', 'MOTOR');

    // Common Return Bus (Bottom middle)
    this.addTerminal('BUS_RETURN', W * 0.40, 390, 'Return Bus (-)', 'bus', 'RETURN_BUS');
  }

  autoWire() {
    this.wires = [];

    // Auto-rig standard standard DC Shunt motor circuit:
    // 1. Supply -> Switch
    this.connectTerminals('SUP_POS', 'SW_IN_POS', '#ef4444');
    this.connectTerminals('SUP_NEG', 'SW_IN_NEG', '#0f172a');

    // 2. Switch Out -> Voltmeter
    this.connectTerminals('SW_OUT_POS', 'VM_POS', '#ef4444');
    this.connectTerminals('SW_OUT_NEG', 'VM_NEG', '#0f172a');

    // 3. Switch Out (+) -> Line Ammeter (+)
    this.connectTerminals('SW_OUT_POS', 'AM_LINE_IN', '#ef4444');

    // 4. Line Ammeter (-) -> Starter (L)
    this.connectTerminals('AM_LINE_OUT', 'ST_L', '#ef4444');

    // 5. Starter (A) -> Motor A1
    this.connectTerminals('ST_A', 'MOT_A1', '#ef4444');

    // 6. Starter (F) -> Field Ammeter (+)
    this.connectTerminals('ST_F', 'AM_FLD_IN', '#38bdf8');

    // 7. Field Ammeter (-) -> Field Rheostat In
    this.connectTerminals('AM_FLD_OUT', 'RHEO_F_IN', '#38bdf8');

    // 8. Field Rheostat Out -> Motor F1
    this.connectTerminals('RHEO_F_OUT', 'MOT_F1', '#38bdf8');

    // 9. Motor A2 & F2 to Return Bus
    this.connectTerminals('MOT_A2', 'BUS_RETURN', '#0f172a');
    this.connectTerminals('MOT_F2', 'BUS_RETURN', '#0f172a');

    // 10. Return Bus to Switch Out (-)
    this.connectTerminals('BUS_RETURN', 'SW_OUT_NEG', '#0f172a');

    this.isAutoWired = true;
    this.isVerified = true;
    this.render();
    if (window.labApp) window.labApp.onWiringChanged();
  }

  verifyCircuit() {
    // Check if mandatory paths are connected
    const hasPath = (start, end) => {
      const visited = new Set();
      const queue = [start];
      while (queue.length > 0) {
        const curr = queue.shift();
        if (curr === end) return true;
        visited.add(curr);

        this.wires.forEach(w => {
          let neighbor = null;
          if (w.fromId === curr) neighbor = w.toId;
          else if (w.toId === curr) neighbor = w.fromId;

          if (neighbor && !visited.has(neighbor)) {
            queue.push(neighbor);
          }
        });
      }
      return false;
    };

    const hasMains = hasPath('SUP_POS', 'SW_IN_POS') && hasPath('SUP_NEG', 'SW_IN_NEG');
    const hasStarter = hasPath('SW_OUT_POS', 'ST_L');
    const hasArmature = hasPath('ST_A', 'MOT_A1') && (hasPath('MOT_A2', 'SW_OUT_NEG') || hasPath('MOT_A2', 'BUS_RETURN'));
    const hasField = hasPath('ST_F', 'MOT_F1') || (hasPath('ST_F', 'AM_FLD_IN') && hasPath('RHEO_F_OUT', 'MOT_F1'));

    if (!hasMains) {
      return { ok: false, msg: "Mains DC Supply is not connected to the DPST Knife Switch terminals." };
    }
    if (!hasStarter) {
      return { ok: false, msg: "Starter terminal (L) is not connected to the supply line ammeter." };
    }
    if (!hasArmature) {
      return { ok: false, msg: "Armature circuit is open: Verify Starter (A) -> Motor A1 and Motor A2 return connection." };
    }
    if (!hasField) {
      return { ok: false, msg: "DANGER: Field circuit is open! Motor cannot start without field flux or will runaway. Connect Starter (F) through Field Rheostat to F1." };
    }

    this.isVerified = true;
    return { ok: true, msg: "✓ Circuit verification successful! All terminals properly rigged. Ready to power ON." };
  }

  render(isPowered = false, currentAmps = 0) {
    if (!this.ctx || !this.logicalWidth) return;
    const ctx = this.ctx;
    const W = this.logicalWidth;
    const H = this.logicalHeight;

    // Clear canvas
    ctx.clearRect(0, 0, W, H);

    // Subtle bench grid pattern
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridStep = 30;
    for (let x = 0; x < W; x += gridStep) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += gridStep) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // Draw Installed Wires
    this.wires.forEach((w) => {
      const t1 = this.terminals[w.fromId];
      const t2 = this.terminals[w.toId];
      if (!t1 || !t2) return;

      const cpX = (t1.x + t2.x) / 2;
      const cpY = (t1.y + t2.y) / 2 + Math.min(50, Math.abs(t1.x - t2.x) * 0.15 + 15);

      // Wire shadow
      ctx.beginPath();
      ctx.moveTo(t1.x, t1.y + 4);
      ctx.quadraticCurveTo(cpX, cpY + 4, t2.x, t2.y + 4);
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 4.5;
      ctx.stroke();

      // Wire body
      ctx.beginPath();
      ctx.moveTo(t1.x, t1.y);
      ctx.quadraticCurveTo(cpX, cpY, t2.x, t2.y);
      ctx.strokeStyle = w.color;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Highlight stripe
      ctx.beginPath();
      ctx.moveTo(t1.x, t1.y);
      ctx.quadraticCurveTo(cpX, cpY, t2.x, t2.y);
      ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Current flow animation if powered
      if (isPowered && currentAmps > 0.1) {
        ctx.setLineDash([4, 8]);
        ctx.lineDashOffset = -Date.now() / (50 / Math.max(1, currentAmps));
        ctx.strokeStyle = '#fef08a'; // Glowing yellow electrons
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });

    // Draw in-progress wire if dragging/selected
    if (this.selectedTerminal && this.mousePos) {
      const t1 = this.terminals[this.selectedTerminal];
      if (t1) {
        ctx.beginPath();
        ctx.moveTo(t1.x, t1.y);
        ctx.lineTo(this.mousePos.x, this.mousePos.y);
        ctx.strokeStyle = this.currentColor;
        ctx.lineWidth = 3;
        ctx.setLineDash([6, 6]);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }

    // Draw Terminals
    Object.values(this.terminals).forEach(t => {
      const isSelected = this.selectedTerminal === t.id;

      // Outer brass/chrome ring
      ctx.beginPath();
      ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
      ctx.fill();
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Center binding post
      ctx.beginPath();
      ctx.arc(t.x, t.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = t.id.includes('POS') || t.id.includes('ST_L') ? '#ef4444' : (t.id.includes('NEG') || t.id.includes('RETURN') ? '#0f172a' : '#0284c7');
      ctx.fill();

      // Terminal Label
      ctx.font = 'bold 10px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(t.label, t.x, t.y + 18);
    });
  }
}

window.LabWiringSystem = LabWiringSystem;

import { useState, useEffect } from "react";

// ─── ACI 211.1 Lookup Tables ────────────────────────────────────────────────

// Table 6.3.3: Mixing water (kg/m³) — rows = slump range, cols = max agg size
const WATER_TABLE = {
  rows: [37.5, 87.5],        // slump midpoints: 25–50mm, 75–100mm
  cols: [10, 20, 40],        // max aggregate size mm
  data: [
    [215, 190, 175],
    [225, 205, 185],
  ],
};

// Table 6.3.4(a): W/C ratio from target strength (MPa)
const WC_TABLE = {
  strengths: [25, 35, 45],
  ratios:    [0.65, 0.52, 0.42],
};

// Table 6.3.6: Volume of coarse agg per m³ — rows = max agg size, cols = FM
const CA_TABLE = {
  rows: [10, 20, 40],      // max aggregate size mm
  cols: [2.4, 2.6, 2.8],  // FM of sand
  data: [
    [0.50, 0.48, 0.46],
    [0.66, 0.64, 0.62],
    [0.75, 0.73, 0.71],
  ],
};

// ─── Math helpers ────────────────────────────────────────────────────────────

function lerp(x, x0, x1, y0, y1) {
  if (x1 === x0) return y0;
  return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
}

function interp1D(xArr, yArr, x) {
  if (x <= xArr[0]) return yArr[0];
  if (x >= xArr[xArr.length - 1]) return yArr[yArr.length - 1];
  for (let i = 0; i < xArr.length - 1; i++) {
    if (x >= xArr[i] && x <= xArr[i + 1]) {
      return lerp(x, xArr[i], xArr[i + 1], yArr[i], yArr[i + 1]);
    }
  }
  return yArr[yArr.length - 1];
}

function interp2D(rowArr, colArr, data, r, c) {
  const clampR = Math.min(Math.max(r, rowArr[0]), rowArr[rowArr.length - 1]);
  const clampC = Math.min(Math.max(c, colArr[0]), colArr[colArr.length - 1]);

  let ri = rowArr.length - 2;
  for (let i = 0; i < rowArr.length - 1; i++) {
    if (clampR <= rowArr[i + 1]) { ri = i; break; }
  }
  let ci = colArr.length - 2;
  for (let i = 0; i < colArr.length - 1; i++) {
    if (clampC <= colArr[i + 1]) { ci = i; break; }
  }

  const r0 = rowArr[ri], r1 = rowArr[ri + 1];
  const c0 = colArr[ci], c1 = colArr[ci + 1];
  const q00 = data[ri][ci], q01 = data[ri][ci + 1];
  const q10 = data[ri + 1][ci], q11 = data[ri + 1][ci + 1];

  const fr = r1 === r0 ? 0 : (clampR - r0) / (r1 - r0);
  const fc = c1 === c0 ? 0 : (clampC - c0) / (c1 - c0);
  return q00 * (1 - fr) * (1 - fc) + q01 * (1 - fr) * fc + q10 * fr * (1 - fc) + q11 * fr * fc;
}

function computeMix(p) {
  const slumpMid = p.slump <= 50 ? 37.5 : 87.5;
  const waterContent = interp2D(WATER_TABLE.rows, WATER_TABLE.cols, WATER_TABLE.data, slumpMid, p.maxAggSize);
  const wcRatio = interp1D(WC_TABLE.strengths, WC_TABLE.ratios, p.targetStrength);
  const cementContent = waterContent / wcRatio;
  const caVolFrac = interp2D(CA_TABLE.rows, CA_TABLE.cols, CA_TABLE.data, p.maxAggSize, p.fmSand);
  const coarseAggMass = caVolFrac * p.unitWeightCA;
  const airFrac = p.airPercent / 100;
  const volWater = waterContent / 1000;
  const volCement = cementContent / (p.sgCement * 1000);
  const volCA = coarseAggMass / (p.sgCoarseAgg * 1000);
  const volFA_calc = 1 - volWater - volCement - volCA - airFrac;
  const fineAggMass = volFA_calc * p.sgFineAgg * 1000;
  return {
    waterContent: +waterContent.toFixed(1),
    wcRatio: +wcRatio.toFixed(3),
    cementContent: +cementContent.toFixed(1),
    coarseAggMass: +coarseAggMass.toFixed(1),
    fineAggMass: +fineAggMass.toFixed(1),
    totalMass: +(waterContent + cementContent + coarseAggMass + fineAggMass).toFixed(1),
    volWater: +(volWater * 1000).toFixed(1),
    volCement: +(volCement * 1000).toFixed(1),
    volCA: +(volCA * 1000).toFixed(1),
    volFA: +(volFA_calc * 1000).toFixed(1),
    volAir: +(airFrac * 1000).toFixed(1),
  };
}

// ─── Preset Scenarios ────────────────────────────────────────────────────────

const SCENARIOS = {
  standard: {
    label: "Standard Structural",
    targetStrength: 30, slump: 75, maxAggSize: 20, fmSand: 2.6,
    sgCement: 3.15, sgFineAgg: 2.65, sgCoarseAgg: 2.70,
    unitWeightCA: 1600, airPercent: 1.5,
  },
  highStrength: {
    label: "High-Strength Column",
    targetStrength: 45, slump: 50, maxAggSize: 10, fmSand: 2.8,
    sgCement: 3.15, sgFineAgg: 2.68, sgCoarseAgg: 2.72,
    unitWeightCA: 1650, airPercent: 1.0,
  },
  massPlacement: {
    label: "Mass Concrete / Dam",
    targetStrength: 25, slump: 40, maxAggSize: 40, fmSand: 2.4,
    sgCement: 3.15, sgFineAgg: 2.60, sgCoarseAgg: 2.68,
    unitWeightCA: 1580, airPercent: 2.0,
  },
};

// ─── UI Components ───────────────────────────────────────────────────────────

const Label = ({ children, sub }) => (
  <div style={{ marginBottom: 2 }}>
    <span style={{ fontSize: 11, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "#94a3b8" }}>
      {children}
    </span>
    {sub && <span style={{ fontSize: 10, color: "#64748b", marginLeft: 6 }}>{sub}</span>}
  </div>
);

const NumberInput = ({ label, sub, value, min, max, step, onChange }) => (
  <div style={{ marginBottom: 14 }}>
    <Label sub={sub}>{label}</Label>
    <input
      type="number"
      min={min} max={max} step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value) || 0)}
      style={{
        width: "100%", padding: "7px 10px", background: "#0f172a",
        border: "1px solid #1e3a5f", borderRadius: 6, color: "#e2e8f0",
        fontFamily: "'Barlow', sans-serif", fontSize: 14,
        outline: "none", boxSizing: "border-box",
        transition: "border-color 0.2s",
      }}
      onFocus={e => e.target.style.borderColor = "#38bdf8"}
      onBlur={e => e.target.style.borderColor = "#1e3a5f"}
    />
  </div>
);

const ResultRow = ({ label, value, unit, highlight }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "9px 14px", marginBottom: 4, borderRadius: 7,
    background: highlight ? "rgba(56,189,248,0.10)" : "rgba(255,255,255,0.03)",
    border: highlight ? "1px solid rgba(56,189,248,0.25)" : "1px solid rgba(255,255,255,0.05)",
  }}>
    <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 12, letterSpacing: "0.06em", textTransform: "uppercase", color: "#94a3b8" }}>{label}</span>
    <span style={{ fontFamily: "'Barlow', sans-serif", fontWeight: 700, fontSize: highlight ? 18 : 15, color: highlight ? "#38bdf8" : "#e2e8f0" }}>
      {value} <span style={{ fontSize: 11, fontWeight: 400, color: "#64748b" }}>{unit}</span>
    </span>
  </div>
);

const VolumeBar = ({ label, pct, color }) => (
  <div style={{ marginBottom: 8 }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
      <span style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", color: "#64748b" }}>{label}</span>
      <span style={{ fontSize: 11, color: "#94a3b8" }}>{pct.toFixed(1)}%</span>
    </div>
    <div style={{ height: 6, background: "#1e293b", borderRadius: 3, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: color, borderRadius: 3, transition: "width 0.5s ease" }} />
    </div>
  </div>
);

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function ConcreteMixDesigner() {
  const [params, setParams] = useState({ ...SCENARIOS.standard });
  const [results, setResults] = useState(null);
  const [activeScenario, setActiveScenario] = useState("standard");

  const set = (key) => (val) => setParams(p => ({ ...p, [key]: val }));

  useEffect(() => {
    try {
      setResults(computeMix(params));
    } catch {
      setResults(null);
    }
  }, [params]);

  const loadScenario = (key) => {
    setActiveScenario(key);
    setParams({ ...SCENARIOS[key] });
  };

  const totalVol = results ? results.volWater + results.volCement + results.volCA + results.volFA + results.volAir : 1000;
  const pct = (v) => (v / totalVol) * 100;

  return (
    <div style={{
      height: "100vh", background: "#070d1a",
      fontFamily: "'Barlow', sans-serif", color: "#e2e8f0",
      display: "flex", flexDirection: "column", overflow: "hidden",
    }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800&family=Barlow:wght@300;400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        input[type=number]::-webkit-inner-spin-button { opacity: 0.3; }
        ::-webkit-scrollbar { width: 6px; } ::-webkit-scrollbar-track { background: #0f172a; } ::-webkit-scrollbar-thumb { background: #1e3a5f; border-radius: 3px; }
      `}</style>

      {/* Header */}
      <div style={{
        background: "linear-gradient(135deg, #0c1f3a 0%, #071020 100%)",
        borderBottom: "1px solid #1e3a5f", padding: "18px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 3, height: 28, background: "#38bdf8", borderRadius: 2 }} />
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "#f1f5f9" }}>
              Concrete Mix Designer
            </span>
          </div>
          <div style={{ fontSize: 11, color: "#64748b", letterSpacing: "0.1em", textTransform: "uppercase", marginTop: 2, paddingLeft: 13 }}>
            ACI 211.1 Absolute Volume Method
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {Object.entries(SCENARIOS).map(([key, sc]) => (
            <button key={key} onClick={() => loadScenario(key)} style={{
              padding: "6px 12px", fontSize: 11, fontFamily: "'Barlow Condensed', sans-serif",
              letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
              borderRadius: 6, cursor: "pointer", transition: "all 0.2s",
              background: activeScenario === key ? "#38bdf8" : "transparent",
              color: activeScenario === key ? "#0f172a" : "#64748b",
              border: activeScenario === key ? "1px solid #38bdf8" : "1px solid #1e3a5f",
            }}>{sc.label}</button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 0, minHeight: "calc(100vh - 73px)" }}>

        {/* ── LEFT: Inputs ── */}
        <div style={{
          width: 320, flexShrink: 0, background: "#0b1525",
          borderRight: "1px solid #1e3a5f", padding: "24px 22px",
          overflowY: "auto",
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#38bdf8", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid #1e3a5f" }}>
              ▸ Design Requirements
            </div>
            <NumberInput label="Target Strength" sub="MPa" value={params.targetStrength} min={15} max={60} step={1} onChange={set("targetStrength")} />
            <NumberInput label="Slump" sub="mm" value={params.slump} min={20} max={120} step={5} onChange={set("slump")} />
            <NumberInput label="Max Aggregate Size" sub="mm" value={params.maxAggSize} min={10} max={40} step={10} onChange={set("maxAggSize")} />
            <NumberInput label="Fineness Modulus of Sand" sub="FM" value={params.fmSand} min={2.2} max={3.2} step={0.05} onChange={set("fmSand")} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f59e0b", marginBottom: 12, paddingBottom: 6, borderBottom: "1px solid #1e3a5f" }}>
              ▸ Material Properties
            </div>
            <NumberInput label="S.G. of Cement" value={params.sgCement} min={3.0} max={3.3} step={0.01} onChange={set("sgCement")} />
            <NumberInput label="S.G. of Fine Aggregate" value={params.sgFineAgg} min={2.4} max={2.9} step={0.01} onChange={set("sgFineAgg")} />
            <NumberInput label="S.G. of Coarse Aggregate" value={params.sgCoarseAgg} min={2.4} max={2.9} step={0.01} onChange={set("sgCoarseAgg")} />
            <NumberInput label="Unit Weight – Coarse Agg" sub="kg/m³" value={params.unitWeightCA} min={1400} max={1800} step={10} onChange={set("unitWeightCA")} />
            <NumberInput label="Entrapped Air" sub="%" value={params.airPercent} min={0.5} max={5} step={0.1} onChange={set("airPercent")} />
          </div>

          {/* ACI Reference badge */}
          <div style={{
            marginTop: 8, padding: "10px 12px", background: "rgba(56,189,248,0.06)",
            border: "1px solid rgba(56,189,248,0.15)", borderRadius: 8,
          }}>
            <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", color: "#38bdf8", marginBottom: 4 }}>ACI Tables Used</div>
            <div style={{ fontSize: 10, color: "#64748b", lineHeight: 1.7 }}>
              6.3.3 — Mixing water vs slump & aggregate<br/>
              6.3.4(a) — W/C ratio vs compressive strength<br/>
              6.3.6 — Coarse agg volume per m³
            </div>
          </div>
        </div>

        {/* ── CENTRE: Results ── */}
        <div style={{ flex: 1, padding: "24px 28px", overflowY: "auto" }}>
          {results ? (
            <>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#38bdf8", marginBottom: 14 }}>
                  Mix Proportions — per 1 m³
                </div>
                <ResultRow label="Water" value={results.waterContent} unit="kg/m³" />
                <ResultRow label="Cement" value={results.cementContent} unit="kg/m³" highlight />
                <ResultRow label="Coarse Aggregate" value={results.coarseAggMass} unit="kg/m³" />
                <ResultRow label="Fine Aggregate" value={results.fineAggMass} unit="kg/m³" />
                <div style={{ borderTop: "1px solid #1e3a5f", margin: "12px 0" }} />
                <ResultRow label="Total Batch Mass" value={results.totalMass} unit="kg/m³" />
              </div>

              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f59e0b", marginBottom: 14 }}>
                  Design Parameters
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  {[
                    { label: "W/C Ratio", value: results.wcRatio.toFixed(2), color: "#38bdf8" },
                    { label: "Water Content", value: `${results.waterContent} kg`, color: "#94a3b8" },
                    { label: "Cement Factor", value: `${results.cementContent} kg`, color: "#94a3b8" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      flex: 1, padding: "14px 16px", background: "#0f172a",
                      border: "1px solid #1e3a5f", borderRadius: 10,
                    }}>
                      <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.07em", textTransform: "uppercase", color: "#64748b", marginBottom: 6 }}>{label}</div>
                      <div style={{ fontWeight: 700, fontSize: 22, color, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Volume breakdown */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#94a3b8", marginBottom: 14 }}>
                  Volume Distribution — L/m³
                </div>
                <div style={{
                  padding: "16px 18px", background: "#0b1525",
                  border: "1px solid #1e3a5f", borderRadius: 10,
                }}>
                  <VolumeBar label="Water" pct={pct(results.volWater)} color="#38bdf8" />
                  <VolumeBar label="Cement" pct={pct(results.volCement)} color="#f59e0b" />
                  <VolumeBar label="Coarse Aggregate" pct={pct(results.volCA)} color="#6366f1" />
                  <VolumeBar label="Fine Aggregate" pct={pct(results.volFA)} color="#22c55e" />
                  <VolumeBar label="Air" pct={pct(results.volAir)} color="#94a3b8" />
                </div>
              </div>

              {/* Volume table */}
              <div>
                <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: 10 }}>
                  Absolute Volumes
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
                  {[
                    { label: "Water", value: results.volWater, color: "#38bdf8" },
                    { label: "Cement", value: results.volCement, color: "#f59e0b" },
                    { label: "Coarse Agg", value: results.volCA, color: "#6366f1" },
                    { label: "Fine Agg", value: results.volFA, color: "#22c55e" },
                    { label: "Air", value: results.volAir, color: "#64748b" },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{
                      padding: "12px 10px", background: "#0f172a",
                      border: `1px solid ${color}33`, borderRadius: 8, textAlign: "center",
                    }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, margin: "0 auto 6px" }} />
                      <div style={{ fontWeight: 700, fontSize: 16, color, fontFamily: "'Barlow Condensed', sans-serif" }}>{value}</div>
                      <div style={{ fontSize: 9, color: "#64748b", letterSpacing: "0.06em", textTransform: "uppercase", marginTop: 2 }}>{label}</div>
                      <div style={{ fontSize: 9, color: "#334155" }}>L/m³</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div style={{ color: "#ef4444", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.05em" }}>
              Calculation error — check input values.
            </div>
          )}
        </div>

        {/* ── RIGHT: Stacked Bar Chart ── */}
        <div style={{
          width: 200, flexShrink: 0, background: "#0b1525",
          borderLeft: "1px solid #1e3a5f", padding: "24px 16px",
          display: "flex", flexDirection: "column", alignItems: "center",
          overflowY: "auto",
        }}>
          <div style={{ fontSize: 10, fontFamily: "'Barlow Condensed', sans-serif", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#64748b", marginBottom: 20, textAlign: "center" }}>
            Mix Composition
          </div>

          {results && (() => {
            const segs = [
              { label: "Fine Agg", value: results.fineAggMass, color: "#22c55e" },
              { label: "Coarse Agg", value: results.coarseAggMass, color: "#6366f1" },
              { label: "Cement", value: results.cementContent, color: "#f59e0b" },
              { label: "Water", value: results.waterContent, color: "#38bdf8" },
            ];
            const total = segs.reduce((a, s) => a + s.value, 0);
            return (
              <>
                <div style={{
                  width: 80, height: 280, display: "flex", flexDirection: "column",
                  borderRadius: 8, overflow: "hidden", border: "1px solid #1e3a5f", marginBottom: 20,
                }}>
                  {segs.map(({ label, value, color }) => {
                    const h = (value / total) * 280;
                    return (
                      <div key={label} style={{ height: h, background: color, position: "relative", transition: "height 0.4s ease" }}>
                        {h > 24 && (
                          <span style={{
                            position: "absolute", bottom: 4, left: 0, right: 0, textAlign: "center",
                            fontSize: 9, fontFamily: "'Barlow Condensed', sans-serif",
                            fontWeight: 700, color: "rgba(0,0,0,0.6)", letterSpacing: "0.04em",
                          }}>{Math.round(value)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div style={{ width: "100%" }}>
                  {segs.map(({ label, value, color }) => (
                    <div key={label} style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: color, flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 9, fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.06em", textTransform: "uppercase", color: "#64748b" }}>{label}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: "'Barlow Condensed', sans-serif" }}>{value.toFixed(0)} kg</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            );
          })()}
        </div>
      </div>

      {/* Footer */}
      <div style={{
        background: "#0b1525", borderTop: "1px solid #1e293b",
        padding: "8px 32px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ fontSize: 10, color: "#334155", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          ACI 211.1 Standard Practice for Selecting Proportions for Normal Concrete
        </span>
        <span style={{ fontSize: 10, color: "#334155", fontFamily: "'Barlow Condensed', sans-serif", letterSpacing: "0.08em" }}>
          Live calculation · All values per 1 m³
        </span>
      </div>
    </div>
  );
}

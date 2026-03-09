[README.md](https://github.com/user-attachments/files/25838286/README.md)
# Concrete Mix Designer

A professional-grade, interactive concrete mix design calculator based on **ACI 211.1 Standard Practice** for selecting proportions for normal, heavyweight, and other special concrete.

## 🎯 Features

- **Absolute Volume Method**: Industry-standard calculation method per ACI 211.1
- **Live Calculations**: Real-time results as you adjust parameters
- **3 Preset Scenarios**: 
  - Standard Structural concrete (30 MPa)
  - High-Strength Column concrete (45 MPa)
  - Mass Concrete/Dam concrete (25 MPa)
- **Comprehensive Results**:
  - Mix proportions (kg/m³)
  - Water-to-cement ratio
  - Absolute volumes for all components
  - Volume distribution visualization
  - Stacked bar chart composition
- **Professional UI**: Dark theme with responsive design
- **Material Properties**: Customizable specific gravities and unit weights

## 📋 What's Included

### Calculation Tables (ACI 211.1)
- **Table 6.3.3**: Mixing water requirements vs slump and aggregate size
- **Table 6.3.4(a)**: Water-to-cement ratio vs target strength
- **Table 6.3.6**: Coarse aggregate volume per m³

### Design Parameters
- **Target Compressive Strength**: 15–60 MPa
- **Slump**: 20–120 mm
- **Max Aggregate Size**: 10, 20, or 40 mm
- **Fineness Modulus**: 2.2–3.2
- **Air Content**: 0.5–5%
- **Material Specific Gravities**: Customizable

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm (or yarn/pnpm)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/concrete-mix-designer.git
cd concrete-mix-designer

# Install dependencies
npm install

# Start the development server
npm run dev
```

The application will open at `http://localhost:5173/`

### Build for Production

```bash
npm run build
```

Output files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## 📁 Project Structure

```
concrete-mix-designer/
├── src/
│   ├── main.jsx          # React entry point
│   ├── App.jsx           # Main component with all logic
│   ├── index.css         # Global styles (optional)
│   └── components/       # Additional components (future)
├── index.html            # HTML template
├── package.json          # Dependencies and scripts
├── vite.config.js        # Vite configuration
├── .gitignore            # Git ignore rules
└── README.md             # This file
```

## 🧮 How It Works

### 1. Input Parameters
Specify your concrete design requirements:
- Target compressive strength (MPa)
- Desired slump (mm)
- Maximum aggregate size
- Fineness modulus of sand
- Material properties (specific gravities)

### 2. Calculation Process
The calculator:
- Interpolates water content from ACI Table 6.3.3
- Determines W/C ratio from ACI Table 6.3.4(a)
- Calculates cement content (water ÷ W/C ratio)
- Interpolates coarse aggregate fraction from ACI Table 6.3.6
- Computes fine aggregate using absolute volume method
- Calculates absolute volumes for all components

### 3. Results
Displays:
- **Mix Proportions**: kg/m³ of each component
- **Batch Parameters**: W/C ratio, water and cement content
- **Volume Breakdown**: L/m³ and percentage distribution
- **Composition Chart**: Visual stacked bar chart

## 🎨 UI Components

- **Label**: Stylized uppercase labels with optional units
- **NumberInput**: Input fields for parameters with min/max constraints
- **ResultRow**: Display results with highlighting
- **VolumeBar**: Horizontal progress bars showing volume percentages
- **Custom Styling**: Dark theme using inline styles (no external CSS framework required)

## 🔢 Mathematical Methods

### Linear Interpolation (1D)
```javascript
lerp(x, x0, x1, y0, y1) → y
```

### Bilinear Interpolation (2D)
Used for table lookups with two variables:
- Water content vs slump & aggregate size
- Coarse aggregate volume vs aggregate size & fineness modulus

### Absolute Volume Method
Total volume per m³ = 1000 L
```
Vol(Water) + Vol(Cement) + Vol(FA) + Vol(CA) + Vol(Air) = 1000 L
```

## 📊 Default Material Properties

| Property | Value |
|----------|-------|
| Cement Specific Gravity | 3.15 |
| Fine Aggregate S.G. | 2.65 |
| Coarse Aggregate S.G. | 2.70 |
| Unit Weight (Coarse Agg) | 1600 kg/m³ |
| Air Entrainment | 1.5% |

## 🛠️ Customization

### Add New Scenarios
Edit the `SCENARIOS` object in `src/App.jsx`:

```javascript
const SCENARIOS = {
  myScenario: {
    label: "My Custom Scenario",
    targetStrength: 35,
    slump: 60,
    maxAggSize: 20,
    fmSand: 2.6,
    // ... other properties
  }
};
```

### Modify ACI Tables
Update lookup tables at the top of `src/App.jsx`:

```javascript
const WATER_TABLE = {
  rows: [/* slump midpoints */],
  cols: [/* max aggregate sizes */],
  data: [/* interpolation values */]
};
```

### Change Theme
Modify color values in the style objects throughout `src/App.jsx`:
- Primary accent: `#38bdf8` (cyan)
- Secondary accent: `#f59e0b` (amber)
- Background: `#070d1a` (dark blue)

## 📚 References

- **ACI 211.1-91**: Standard Practice for Selecting Proportions for Normal, Heavyweight, and Mass Concrete
- **ACI Publications**: www.concrete.org

## 🐛 Known Limitations

1. Interpolation is limited to the ranges provided in ACI tables
2. Does not account for water absorption by aggregates
3. Simplified model; adjustment factors may be needed for specific conditions
4. Air content is user-specified (not automatically calculated)

## 🚀 Future Enhancements

- [ ] Export mix design as PDF
- [ ] Save designs to local storage
- [ ] Batch size scaling
- [ ] Extended ACI tables (heavyweight, high-performance concrete)
- [ ] Optimization algorithms for target slump
- [ ] Cost analysis per m³
- [ ] Material supplier database

## 💡 Tips for Accurate Results

1. **Verify Material Properties**: Use actual test data for your aggregates
2. **Unit Weight**: Ensure coarse aggregate unit weight matches your source
3. **Fineness Modulus**: Accurately determine FM of your fine aggregate
4. **Check Output**: Verify total mass ≈ 2300–2400 kg/m³ for normal concrete
5. **Adjust for Conditions**: Consider local practice, seasonal variations, and job requirements

## 📄 License

MIT License - feel free to use, modify, and distribute

## 👤 Author

Your Name  
Contact: your.email@example.com

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📞 Support

For issues, questions, or feature requests, please [open an issue](https://github.com/yourusername/concrete-mix-designer/issues) on GitHub.

---

**Disclaimer**: This tool is provided for educational and professional reference purposes. Always verify calculations according to applicable codes and standards. Consult structural engineers and material specialists for critical projects.

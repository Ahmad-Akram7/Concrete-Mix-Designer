# Contributing to Concrete Mix Designer

Thank you for your interest in contributing! This document provides guidelines and instructions.

## Code of Conduct

- Be respectful and inclusive
- Welcome diverse perspectives
- Focus on constructive feedback
- Help others learn and grow

## How to Contribute

### Reporting Bugs

1. **Check existing issues** to avoid duplicates
2. **Provide a clear title** describing the bug
3. **Include detailed steps** to reproduce
4. **Share expected vs actual behavior**
5. **Provide environment info** (OS, browser, Node version)

**Example Bug Report:**
```
Title: W/C ratio calculation returns NaN for slump > 100mm

Steps:
1. Open the app
2. Set slump to 110 mm
3. Set target strength to 35 MPa
4. Observe W/C ratio field

Expected: Valid W/C ratio (e.g., 0.52)
Actual: Shows NaN

Environment: Chrome 120, Node 18.12
```

### Suggesting Features

1. **Check existing feature requests**
2. **Describe the use case** clearly
3. **Explain the benefit** to users
4. **Provide examples** if applicable

**Example Feature Request:**
```
Title: Add batch size scaling

Description: Allow users to scale the mix design to desired batch volumes
(e.g., 0.5 m³, 2.5 m³, 10 m³)

Use case: Ready-mix trucks often work with partial batches

Example: "Scale to 0.5 m³" button that multiplies all results by 0.5
```

### Pull Request Process

#### Before You Start
1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/your-feature-name`
3. **Keep commits atomic**: One logical change per commit

#### While Working
1. **Follow the code style** (see below)
2. **Write clear commit messages**:
   ```
   Add batch size scaling feature
   
   - Allow users to scale mix designs
   - Add scale input field in UI
   - Update results calculations
   ```
3. **Test your changes** thoroughly
4. **Update documentation** if needed

#### Before Submitting
1. **Run linter**: `npm run lint`
2. **Format code**: `npm run format`
3. **Test the build**: `npm run build`
4. **Write a clear PR description**

#### PR Description Template
```markdown
## Description
Brief summary of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Code refactor

## Testing
How was this tested? Include steps to verify.

## Screenshots (if UI changes)
Add before/after images

## Checklist
- [ ] Code follows style guidelines
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No breaking changes
```

## Code Style Guide

### JavaScript/React

**Naming Conventions:**
```javascript
// Constants: UPPER_SNAKE_CASE
const MAX_AGGREGATE_SIZE = 40;

// Functions: camelCase
function computeMix(params) { }

// Components: PascalCase
function ConcreteMixDesigner() { }

// Variables: camelCase
const waterContent = 190;
```

**Formatting:**
- Use 2-space indentation
- Single quotes for strings: `'string'` not `"string"`
- Semicolons required
- Max line length: 100 characters

**React Best Practices:**
```javascript
// ✅ Use functional components and hooks
function MyComponent() {
  const [state, setState] = useState(null);
  return <div>{state}</div>;
}

// ❌ Avoid class components
class MyComponent extends React.Component { }

// ✅ Extract complex logic
function computeMix(params) {
  // Implementation
}

// ❌ Avoid inline calculations in JSX
<div>{a + b + c + d + e}</div> // Bad
```

**Comments:**
```javascript
// Single-line comments for simple explanations
const value = 42; // The answer to everything

// Multi-line comments for complex logic
// Use bilinear interpolation to find water content
// from ACI Table 6.3.3 using slump and max aggregate size
const waterContent = interp2D(rows, cols, data, slump, maxAgg);
```

### File Structure

```
src/
├── App.jsx              # Main component
├── components/
│   ├── Input.jsx        # Reusable input component
│   ├── ResultRow.jsx    # Result display component
│   └── VolumeBar.jsx    # Volume visualization
├── utils/
│   ├── calculations.js  # Math functions
│   ├── tables.js        # ACI lookup tables
│   └── constants.js     # Constants
└── styles/
    └── theme.js         # Color and design tokens
```

### Documentation

- Write clear, concise comments
- Explain the "why" not just the "what"
- Update README.md for user-facing changes
- Add JSDoc comments for exported functions

```javascript
/**
 * Compute concrete mix proportions using ACI 211.1 method
 * @param {Object} params - Design parameters
 * @param {number} params.targetStrength - Compressive strength (MPa)
 * @param {number} params.slump - Slump (mm)
 * @returns {Object} Mix design results with proportions
 */
function computeMix(params) {
  // Implementation
}
```

## Areas Needing Help

- **Bug fixes**: Check open issues labeled `bug`
- **Feature development**: See `enhancement` label
- **Documentation**: Help improve README and comments
- **Testing**: Add tests and edge cases
- **Performance**: Optimize calculations and rendering
- **Accessibility**: Improve WCAG compliance
- **UI/UX**: Enhance design and usability

## Development Workflow

### Setup Development Environment
```bash
git clone https://github.com/yourusername/concrete-mix-designer.git
cd concrete-mix-designer
npm install
npm run dev
```

### Common Tasks

**Run tests** (future):
```bash
npm test
```

**Check code quality**:
```bash
npm run lint
```

**Format code**:
```bash
npm run format
```

**Build production**:
```bash
npm run build
```

## Commit Message Conventions

Use clear, descriptive commit messages:

```
feat: Add batch size scaling feature
fix: Resolve W/C ratio calculation for high slump
docs: Update installation instructions
style: Format code and fix linting issues
refactor: Extract calculation logic to utils
test: Add tests for interpolation functions (future)
```

## Questions or Need Help?

- **Join discussions**: Use GitHub Discussions
- **Ask on issues**: Open an issue with your question
- **Email maintainer**: [your.email@example.com]

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for making Concrete Mix Designer better! 🎉

# KoinX – Tax Loss Harvesting Tool

A fully responsive React application for tax loss harvesting, pixel-matched to the KoinX Figma design.

## 🚀 Setup Instructions

### Prerequisites
- Node.js 16+ and npm

### Installation

```bash
# Extract the zip and enter the folder
cd tax-loss-harvesting

# Install dependencies
npm install

# Start development server
npm start
```

App runs at **http://localhost:3000**

### Build for Production

```bash
npm run build
```

## 📁 Folder Structure

```
src/
├── App.js                   ← All UI components
├── App.css                  ← Dark theme styles (matching KoinX Figma)
├── index.js                 ← React entry point
├── index.css                ← Tailwind directives
├── data/
│   └── mockApi.js           ← Mock APIs (Promise-based, ~600–800ms delay)
└── utils/
    └── calculations.js      ← computeGains(), sortHoldings(), formatters
```

## ✅ Features Implemented

### Core Requirements
- **Pre Harvesting card** (dark background) — reads Capital Gains API; shows STCG & LTCG profits, losses, net capital gains, and realised capital gains
- **After Harvesting card** (blue gradient) — mirrors Pre initially; updates in real-time as holdings are selected
  - Positive gain → added to profits
  - Negative gain → added to losses
  - Shows "🎉 You are going to save upto ₹X" only when post < pre realised gains
- **Holdings table** with columns: Asset (logo + name + ticker), Holdings + Avg Buy Price, Current Price, Total Current Value, Short-term gain, Long-term gain, Amount to Sell
- Holdings sorted by absolute gain (largest first)
- Checkbox per row + Select All / Deselect All header checkbox (with indeterminate state)
- Real-time After Harvesting updates on selection/deselection
- Mock Capital Gains API and Mock Holdings API (Promise-based)

### Bonus Features
- ✅ **Mobile responsive** — stacked cards on mobile, horizontal-scrollable table, simplified columns
- ✅ **Clean reusable components** — `CapitalGainsCard`, `HoldingsTable`, `HoldingRow`, `DisclaimerBanner`
- ✅ **Loader state** — spinner while both APIs load
- ✅ **Error state** — error banner if any API call fails
- ✅ **View All** — shows 6 rows by default, toggle to show all 25
- ✅ **Visual feedback for selections** — blue row highlight when selected
- ✅ **Select/Deselect All** — header checkbox with proper indeterminate state
- ✅ **Stable row IDs** — selections persist correctly when toggling "View All"
- ✅ **Collapsible disclaimer** — with tooltip on ℹ icon (matching screenshots)
- ✅ **Broken image fallback** — SVG initials placeholder for failed coin logos

## 💡 Assumptions

1. **Currency**: ₹ (Indian Rupee) as shown in the Figma/screenshots.
2. **Gain logic** exactly as spec: positive gain → add to profits; negative gain → absolute value added to losses (for both STCG and LTCG independently).
3. **Savings** shown only when `preRealised > afterRealised`.
4. **Near-zero gains** (< ₹0.0001) displayed as `~₹0` for readability.
5. **Holdings sorting** by absolute total gain value descending.
6. **Current Price column** added per spec table definition (was missing in original screenshots but required in spec).

## 🔗 Deployment

**Vercel:**
```bash
npm install -g vercel
vercel
```

**Netlify:**
```bash
npm run build
# Drag the build/ folder to netlify.com/drop
```

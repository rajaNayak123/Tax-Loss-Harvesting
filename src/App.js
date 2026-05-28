import React, { useState, useEffect, useCallback } from "react";
import { fetchCapitalGains, fetchHoldings } from "./data/mockApi";
import { computeGains, sortHoldings } from "./utils/calculations";
import "./App.css";

const DISCLAIMER_POINTS = [
  "Tax-loss harvesting is currently not allowed under Indian tax regulations. Please consult your tax advisor before making any decisions.",
  "Tax harvesting does not apply to derivatives or futures. These are handled separately as business income under tax rules.",
  "Price and market value data is fetched from Coingecko, not from individual exchanges. As a result, values may slightly differ from the ones on your exchange.",
  "Some countries do not have a short-term / long-term bifurcation. For now, we are calculating everything as long-term.",
  "Only realized losses are considered for harvesting. Unrealized losses in held assets are not counted.",
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtUSD = (v) => {
  const abs = Math.abs(v);
  const str = abs.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return v < 0 ? `- $ ${str}` : `$ ${str}`;
};

const fmtBal = (val) => {
  if (Math.abs(val) < 1e-10) return "~0";
  if (Math.abs(val) < 0.0001) return val.toExponential(2);
  return val.toLocaleString("en-US", { maximumFractionDigits: 6 });
};

const fmtGain = (gain) => {
  if (Math.abs(gain) < 0.0001) return "~$0";
  const abs = Math.abs(gain).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return gain < 0 ? `-$${abs}` : `+$${abs}`;
};

// ─── Spinner ─────────────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div className="flex items-center justify-center py-20">
      <div className="spinner" />
    </div>
  );
}

// ─── KoinX Logo ──────────────────────────────────────────────────────────────
function KoinXLogo() {
  return (
    <div className="koinx-logo">
      <span className="logo-koin">Koin</span>
      <span className="logo-x">X</span>
      <span className="logo-reg">®</span>
    </div>
  );
}

// ─── Disclaimer Banner ────────────────────────────────────────────────────────
function DisclaimerBanner() {
  const [open, setOpen] = useState(false);

  return (
    <div className="disclaimer-banner">
      <button className="disclaimer-header" onClick={() => setOpen((o) => !o)}>
        <div className="disclaimer-left">
          <span className="info-icon">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="9" r="8.5" stroke="#3b82f6" />
              <text x="9" y="13" textAnchor="middle" fill="#3b82f6" fontSize="11" fontWeight="bold">i</text>
            </svg>
          </span>
          <span className="disclaimer-title">Important Notes &amp; Disclaimers</span>
        </div>
        <svg
          className={`chevron ${open ? "open" : ""}`}
          width="16" height="16" viewBox="0 0 16 16" fill="none"
        >
          <path d="M4 6l4 4 4-4" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <ul className="disclaimer-list">
          {DISCLAIMER_POINTS.map((pt, i) => (
            <li key={i} className="disclaimer-item">
              <span className="bullet">•</span>
              <span>{pt}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Capital Gains Card ───────────────────────────────────────────────────────
function CapitalGainsCard({ title, data, isAfter, savings }) {
  const netStcg = data.stcg.profits - data.stcg.losses;
  const netLtcg = data.ltcg.profits - data.ltcg.losses;
  const realised = netStcg + netLtcg;

  const netColor = (v) => (v < 0 ? "val-negative" : "val-positive");

  return (
    <div className={`gains-card ${isAfter ? "after-card" : "pre-card"}`}>
      <h2 className="card-title">{title}</h2>

      <table className="gains-table">
        <thead>
          <tr>
            <th className="col-label" />
            <th className="col-val">Short-term</th>
            <th className="col-val">Long-term</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="row-label">Profits</td>
            <td className="row-val">
              $ {data.stcg.profits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td className="row-val">
              $ {data.ltcg.profits.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
          <tr>
            <td className="row-label">Losses</td>
            <td className="row-val">
              - $ {data.stcg.losses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
            <td className="row-val">
              - $ {data.ltcg.losses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </td>
          </tr>
          <tr className="net-row">
            <td className="row-label net-label">Net Capital Gains</td>
            <td className={`row-val net-val ${netColor(netStcg)}`}>
              {fmtUSD(netStcg)}
            </td>
            <td className={`row-val net-val ${netColor(netLtcg)}`}>
              {fmtUSD(netLtcg)}
            </td>
          </tr>
        </tbody>
      </table>

      <div className="realised-row">
        <span className="realised-label">
          {isAfter ? "Effective Capital Gains:" : "Realised Capital Gains:"}
        </span>
        <span className={`realised-val ${realised < 0 ? "val-negative" : ""}`}>
          {fmtUSD(realised)}
        </span>
      </div>

      {isAfter && savings !== null && savings > 0 && (
        <div className="savings-row">
          <span>🎉</span>
          <span>
            You are going to save upto{" "}
            <span className="savings-amount">
              $ {savings.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Holding Row ──────────────────────────────────────────────────────────────
function HoldingRow({ holding, selected, onToggle }) {
  const totalValue = holding.currentPrice * holding.totalHolding;
  const stcgGain = holding.stcg.gain;
  const ltcgGain = holding.ltcg.gain;

  const gainClass = (g) =>
    Math.abs(g) < 0.0001 ? "gain-zero" : g < 0 ? "gain-neg" : "gain-pos";

  return (
    <tr
      className={`holding-row ${selected ? "row-selected" : ""}`}
      onClick={onToggle}
    >
      {/* Checkbox */}
      <td className="td-check">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggle}
          onClick={(e) => e.stopPropagation()}
          className="row-checkbox"
        />
      </td>

      {/* Asset */}
      <td className="td-asset">
        <div className="asset-inner">
          <img
            src={holding.logo}
            alt={holding.coin}
            className="coin-logo"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='32' height='32'%3E%3Ccircle cx='16' cy='16' r='16' fill='%234B5563'/%3E%3Ctext x='50%25' y='56%25' text-anchor='middle' dominant-baseline='middle' fill='white' font-size='10' font-family='sans-serif'%3E${holding.coin.slice(0,2)}%3C/text%3E%3C/svg%3E`;
            }}
          />
          <div className="asset-text">
            <div className="asset-name">{holding.coinName}</div>
            <div className="asset-ticker">{holding.coin}</div>
          </div>
        </div>
      </td>

      {/* Holdings + Avg Buy Price */}
      <td className="td-right">
        <div className="cell-primary">{fmtBal(holding.totalHolding)} {holding.coin}</div>
        <div className="cell-secondary">
          $ {holding.averageBuyPrice.toLocaleString("en-US", { maximumFractionDigits: 4 })}/{holding.coin}
        </div>
      </td>

      {/* Current Price — desktop only */}
      <td className="td-right hide-mobile">
        <div className="cell-primary">
          $ {holding.currentPrice.toLocaleString("en-US", { maximumFractionDigits: 4 })}
        </div>
      </td>

      {/* Total Current Value — desktop only */}
      <td className="td-right hide-mobile">
        <div className="cell-primary">
          $ {totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </td>

      {/* Short-term gain */}
      <td className="td-right">
        <div className={`cell-gain ${gainClass(stcgGain)}`}>{fmtGain(stcgGain)}</div>
        <div className="cell-secondary">{fmtBal(holding.stcg.balance)} {holding.coin}</div>
      </td>

      {/* Long-term gain */}
      <td className="td-right">
        <div className={`cell-gain ${gainClass(ltcgGain)}`}>{fmtGain(ltcgGain)}</div>
        <div className="cell-secondary">{fmtBal(holding.ltcg.balance)} {holding.coin}</div>
      </td>

      {/* Amount to Sell */}
      <td className="td-right">
        {selected ? (
          <span className="amount-to-sell">{fmtBal(holding.totalHolding)} {holding.coin}</span>
        ) : (
          <span className="cell-secondary">-</span>
        )}
      </td>
    </tr>
  );
}

// ─── Holdings Table ───────────────────────────────────────────────────────────
function HoldingsTable({ holdings, selectedSet, onToggle, onToggleAll }) {
  const [viewAll, setViewAll] = useState(false);
  const PREVIEW = 6;
  const displayed = viewAll ? holdings : holdings.slice(0, PREVIEW);
  const allSelected = holdings.length > 0 && selectedSet.size === holdings.length;
  const someSelected = selectedSet.size > 0 && !allSelected;

  return (
    <div className="holdings-section">
      <div className="holdings-header">
        <h2 className="holdings-title">Holdings</h2>
      </div>

      <div className="table-scroll">
        <table className="holdings-table">
          <thead>
            <tr className="thead-row">
              <th className="th-check">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected; }}
                  onChange={onToggleAll}
                  className="row-checkbox"
                />
              </th>
              <th className="th-left">Asset</th>
              <th className="th-right">
                <div>Holdings</div>
                <div className="th-sub">Avg Buy Price</div>
              </th>
              <th className="th-right hide-mobile">Current Price</th>
              <th className="th-right hide-mobile">Total Current Value</th>
              <th className="th-right">Short-term</th>
              <th className="th-right">Long-Term</th>
              <th className="th-right">Amount to Sell</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map((h) => (
              <HoldingRow
                key={h._id}
                holding={h}
                selected={selectedSet.has(h._id)}
                onToggle={() => onToggle(h._id)}
              />
            ))}
          </tbody>
        </table>
      </div>

      {holdings.length > PREVIEW && (
        <div className="view-all-row">
          <button className="view-all-btn" onClick={() => setViewAll((v) => !v)}>
            {viewAll ? "View less" : "View all"}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [capitalGains, setCapitalGains] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [selectedSet, setSelectedSet] = useState(new Set());
  const [loadingGains, setLoadingGains] = useState(true);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCapitalGains()
      .then((d) => setCapitalGains(d.capitalGains))
      .catch(() => setError("Failed to load capital gains data."))
      .finally(() => setLoadingGains(false));

    fetchHoldings()
      .then((data) => {
        // Assign stable unique IDs
        const sorted = sortHoldings(data).map((h, i) => ({ ...h, _id: `${h.coin}-${i}` }));
        setHoldings(sorted);
      })
      .catch(() => setError("Failed to load holdings data."))
      .finally(() => setLoadingHoldings(false));
  }, []);

  const toggleHolding = useCallback((id) => {
    setSelectedSet((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedSet((prev) =>
      prev.size === holdings.length
        ? new Set()
        : new Set(holdings.map((h) => h._id))
    );
  }, [holdings]);

  const selectedHoldings = holdings.filter((h) => selectedSet.has(h._id));

  const preData = capitalGains
    ? {
        stcg: { profits: capitalGains.stcg.profits, losses: capitalGains.stcg.losses },
        ltcg: { profits: capitalGains.ltcg.profits, losses: capitalGains.ltcg.losses },
      }
    : null;

  const afterData = capitalGains ? computeGains(capitalGains, selectedHoldings) : null;

  const preRealised = preData
    ? preData.stcg.profits - preData.stcg.losses + preData.ltcg.profits - preData.ltcg.losses
    : 0;
  const afterRealised = afterData ? afterData.realised : 0;
  const savings = preRealised > afterRealised ? preRealised - afterRealised : null;

  const loading = loadingGains || loadingHoldings;

  return (
    <div className="app-root">
      {/* ── Header ── */}
      <header className="app-header">
        <KoinXLogo />
        <button className="hamburger" aria-label="Menu">
          <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      {/* ── Main ── */}
      <main className="app-main">
        {/* Page Title */}
        <div className="page-title-row">
          <h1 className="page-title">Tax Harvesting</h1>
          <span className="how-it-works-wrapper">
            <a href="#!" className="how-it-works">How it works?</a>
            <div className="hiw-tooltip">
              <div className="hiw-tooltip-arrow" />
              Lorem ipsum dolor sit amet consectetur. Euismod id posuere nibh semper mattis
              scelerisque tellus. Vel mattis diam duis morbi tellus dui consectetur.{" "}
              <a href="#!" className="tooltip-link">Know More</a>
            </div>
          </span>
        </div>

        {/* Disclaimer */}
        <DisclaimerBanner />

        {/* Error */}
        {error && (
          <div className="error-banner">⚠️ {error}</div>
        )}

        {/* Content */}
        {loading ? (
          <Spinner />
        ) : (
          <>
            {/* Capital Gains Cards */}
            <div className="cards-grid">
              {preData && (
                <CapitalGainsCard
                  title="Pre Harvesting"
                  data={preData}
                  isAfter={false}
                  savings={null}
                />
              )}
              {afterData && (
                <CapitalGainsCard
                  title="After Harvesting"
                  data={afterData}
                  isAfter={true}
                  savings={savings}
                />
              )}
            </div>

            {/* Holdings */}
            <HoldingsTable
              holdings={holdings}
              selectedSet={selectedSet}
              onToggle={toggleHolding}
              onToggleAll={toggleAll}
            />
          </>
        )}
      </main>
    </div>
  );
}

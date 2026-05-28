export const formatCurrency = (value, prefix = "₹") => {
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (value < 0) return `- ${prefix} ${formatted}`;
  return `${prefix} ${formatted}`;
};

export const formatNumber = (value, decimals = 6) => {
  if (Math.abs(value) < 1e-10) return "~0";
  if (Math.abs(value) < 0.001) return value.toExponential(2);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
};

export const computeGains = (capitalGains, selectedHoldings) => {
  let stcgProfits = capitalGains.stcg.profits;
  let stcgLosses = capitalGains.stcg.losses;
  let ltcgProfits = capitalGains.ltcg.profits;
  let ltcgLosses = capitalGains.ltcg.losses;

  selectedHoldings.forEach((h) => {
    if (h.stcg.gain > 0) {
      stcgProfits += h.stcg.gain;
    } else if (h.stcg.gain < 0) {
      stcgLosses += Math.abs(h.stcg.gain);
    }

    if (h.ltcg.gain > 0) {
      ltcgProfits += h.ltcg.gain;
    } else if (h.ltcg.gain < 0) {
      ltcgLosses += Math.abs(h.ltcg.gain);
    }
  });

  const stcgNet = stcgProfits - stcgLosses;
  const ltcgNet = ltcgProfits - ltcgLosses;
  const realised = stcgNet + ltcgNet;

  return {
    stcg: { profits: stcgProfits, losses: stcgLosses, net: stcgNet },
    ltcg: { profits: ltcgProfits, losses: ltcgLosses, net: ltcgNet },
    realised,
  };
};

export const sortHoldings = (holdings) => {
  return [...holdings].sort((a, b) => {
    const aGain = Math.abs(a.stcg.gain) + Math.abs(a.ltcg.gain);
    const bGain = Math.abs(b.stcg.gain) + Math.abs(b.ltcg.gain);
    return bGain - aGain;
  });
};

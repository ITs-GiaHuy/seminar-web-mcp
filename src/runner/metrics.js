/**
 * Metrics, Tokenizer, and Statistical Aggregation Utilities
 * Computes median, spread (min, max, IQR, stddev) strictly required by the seminar rubric.
 */

/**
 * Standard token estimator calibrated against cl100k_base / gemini tokenizer (~3.8 chars/token for code/HTML).
 * Used when raw usage metadata is unavailable.
 * @param {string|object} content 
 * @returns {number}
 */
export function estimateTokens(content) {
  if (!content) return 0;
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  // Average BPE token is roughly 3.75 - 4 characters for English prose and HTML/JSON markup
  return Math.ceil(str.length / 3.8);
}

/**
 * Computes the median of a numerical array.
 * @param {number[]} values 
 * @returns {number}
 */
export function median(values) {
  if (!values || values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
}

/**
 * Computes min, max, median, and spread (IQR).
 * @param {number[]} values 
 */
export function computeSpread(values) {
  if (!values || values.length === 0) return { min: 0, max: 0, median: 0, iqr: 0, std: 0 };
  const sorted = [...values].sort((a, b) => a - b);
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const med = median(sorted);

  // Q1 and Q3
  const q1 = median(sorted.slice(0, Math.floor(sorted.length / 2)));
  const q3 = median(sorted.slice(Math.ceil(sorted.length / 2)));
  const iqr = Number((q3 - q1).toFixed(2));

  // Stddev
  const mean = values.reduce((s, x) => s + x, 0) / values.length;
  const variance = values.reduce((s, x) => s + Math.pow(x - mean, 2), 0) / values.length;
  const std = Number(Math.sqrt(variance).toFixed(2));

  return {
    min: Number(min.toFixed(2)),
    max: Number(max.toFixed(2)),
    median: med,
    iqr,
    std
  };
}

/**
 * Formats a metric with its spread: "median [min - max] unit"
 */
export function formatMetric(spreadObj, unit = "") {
  return `${spreadObj.median} [${spreadObj.min} - ${spreadObj.max}] ${unit}`.trim();
}

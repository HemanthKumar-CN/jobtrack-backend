// Helper: normalize any input to YYYY-MM-DD (keeps local date for Date objects)
const normalizeToDateOnly = (input) => {
  if (!input) return null;

  // If it's already a Date object
  if (input instanceof Date && !isNaN(input)) {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, "0");
    const d = String(input.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // If it's a timestamp number
  if (typeof input === "number" && !isNaN(input)) {
    return normalizeToDateOnly(new Date(input));
  }

  // If it's a string
  if (typeof input === "string") {
    // Already in YYYY-MM-DD format?
    if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;

    // ISO-like string with T -> take left part (date) without converting timezone
    if (input.includes("T")) return input.split("T")[0];

    // Fallback: try to parse and extract local date components
    const parsed = new Date(input);
    if (!isNaN(parsed)) return normalizeToDateOnly(parsed);

    return null;
  }

  // Final fallback
  try {
    return new Date(input).toISOString().split("T")[0];
  } catch {
    return null;
  }
};

module.exports = normalizeToDateOnly;

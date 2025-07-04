module.exports = function isValidDate(dateString, format) {
  // Supported tokens: YYYY, MM, DD, HH, mm
  // Allow single-digit hour (H) and minute (m) for time-only formats
  let formatRegex = format
    .replace(/YYYY/, "(\\d{4})")
    .replace(/MM/, "(0[1-9]|1[0-2])")
    .replace(/DD/, "(0[1-9]|[12]\\d|3[01])")
    .replace(/HH/, "([01]?\\d|2[0-3])") // allow 0-9, 00-23
    .replace(/mm/, "([0-5]?\\d)"); // allow 0-9, 00-59

  const regex = new RegExp("^" + formatRegex + "$", "");
  const match = dateString.match(regex);
  if (!match) return false;

  // Extract values based on format order
  const order = [];
  let idx = 1;
  let formatCopy = format;
  ["YYYY", "MM", "DD", "HH", "mm"].forEach((token) => {
    const pos = formatCopy.indexOf(token);
    if (pos !== -1) {
      order.push({ token, idx });
      formatCopy = formatCopy.replace(token, "____");
      idx++;
    }
  });

  // Map values
  const values = {};
  order.forEach((o, i) => {
    // parseInt to allow single-digit values
    values[o.token] = parseInt(match[o.idx], 10);
  });

  // If only time is provided (no YYYY/MM/DD in format), use a fixed valid date
  let year = values["YYYY"];
  let month = values["MM"];
  let day = values["DD"];
  if (typeof year === "undefined" && typeof month === "undefined" && typeof day === "undefined") {
    year = 2000;
    month = 1;
    day = 1;
  } else {
    year = year || 0;
    month = month || 1;
    day = day || 1;
  }
  const hour = values["HH"] || 0;
  const minute = values["mm"] || 0;

  const date = new Date(year, month - 1, day, hour, minute);

  // Validate date parts if present in format
  if (format.includes("YYYY") && date.getFullYear() !== year) return false;
  if (format.includes("MM") && date.getMonth() !== month - 1) return false;
  if (format.includes("DD") && date.getDate() !== day) return false;

  // Validate time parts if present in format
  if (format.includes("HH") && date.getHours() !== hour) return false;
  if (format.includes("mm") && date.getMinutes() !== minute) return false;

  return true;
};

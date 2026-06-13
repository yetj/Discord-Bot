module.exports = function isValidDate(dateString, format, timezone = "UTC+2") {
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

  // Parse timezone strings like: UTC+2, UTC+02:00, +02:00, Z, UTC, GMT, local
  function parseTimezone(tz) {
    if (!tz) return 0;
    const s = String(tz).trim();
    if (/^local$/i.test(s)) return null; // use system local timezone
    if (/^(Z|UTC|GMT)$/i.test(s)) return 0;
    const m = s.match(/(?:UTC|GMT)?([+-])(\d{1,2})(?::?(\d{2}))?$/i);
    if (!m) return 0;
    const sign = m[1] === "+" ? 1 : -1;
    const hrs = parseInt(m[2], 10);
    const mins = m[3] ? parseInt(m[3], 10) : 0;
    return sign * (hrs * 60 + mins);
  }

  const tzOffsetMinutes = parseTimezone(timezone);

  // If timezone is null, use system local timezone (behaviour preserved)
  if (tzOffsetMinutes === null) {
    const localDate = new Date(year, month - 1, day, hour, minute);

    // Validate date parts if present in format (local)
    if (format.includes("YYYY") && localDate.getFullYear() !== year) return false;
    if (format.includes("MM") && localDate.getMonth() !== month - 1) return false;
    if (format.includes("DD") && localDate.getDate() !== day) return false;

    // Validate time parts if present in format (local)
    if (format.includes("HH") && localDate.getHours() !== hour) return false;
    if (format.includes("mm") && localDate.getMinutes() !== minute) return false;

    return true;
  }

  // For a fixed timezone offset, build a UTC-based timestamp then adjust
  // so that the provided components are interpreted in the desired timezone.
  const offsetMs = tzOffsetMinutes * 60 * 1000;

  // baseUtcMs is the timestamp if the components were UTC. Subtracting
  // the offset gives the actual UTC instant that corresponds to the
  // components in the target timezone.
  const baseUtcMs = Date.UTC(year, month - 1, day, hour, minute);
  const actualUtcMs = baseUtcMs - offsetMs;
  const date = new Date(actualUtcMs);

  // To validate the original components (as they should appear in the
  // target timezone) convert back by adding the offset and reading UTC
  // fields.
  const adjusted = new Date(date.getTime() + offsetMs);

  if (format.includes("YYYY") && adjusted.getUTCFullYear() !== year) return false;
  if (format.includes("MM") && adjusted.getUTCMonth() !== month - 1) return false;
  if (format.includes("DD") && adjusted.getUTCDate() !== day) return false;

  if (format.includes("HH") && adjusted.getUTCHours() !== hour) return false;
  if (format.includes("mm") && adjusted.getUTCMinutes() !== minute) return false;

  return true;
};

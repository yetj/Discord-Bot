// module.exports = function isValidDate(dateString) {
//   const dateRegex = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
//   if (!dateRegex.test(dateString)) return false;

//   const [year, month, day] = dateString.split("-").map(Number);
//   const date = new Date(year, month - 1, day);

//   return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
// };
module.exports = function isValidDate(dateString, format) {
  // Supported tokens: YYYY, MM, DD, HH, mm
  let formatRegex = format
    .replace(/YYYY/, "(\\d{4})")
    .replace(/MM/, "(0[1-9]|1[0-2])")
    .replace(/DD/, "(0[1-9]|[12]\\d|3[01])")
    .replace(/HH/, "([01]\\d|2[0-3])")
    .replace(/mm/, "([0-5]\\d)");

  const regex = new RegExp("^" + formatRegex + "$");
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
    values[o.token] = Number(match[o.idx]);
  });

  // Build date object
  const year = values["YYYY"] || 0;
  const month = (values["MM"] || 1) - 1;
  const day = values["DD"] || 1;
  const hour = values["HH"] || 0;
  const minute = values["mm"] || 0;

  const date = new Date(year, month, day, hour, minute);

  // Validate date parts
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day)
    return false;

  // Validate time parts if present in format
  if (format.includes("HH") && date.getHours() !== hour) return false;
  if (format.includes("mm") && date.getMinutes() !== minute) return false;

  return true;
};

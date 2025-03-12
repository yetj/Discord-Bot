module.exports = function formattedDate(date, type = "date_time") {
  if (type === "date_time") {
    return new Date(date)
      .toLocaleString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
      .replace(",", "")
      .split(" ")
      .map((item, index) => (index === 0 ? item.split(".").reverse().join("-") : item))
      .join(" ");
  } else if (type === "date_time_utc") {
    return new Date(date)
      .toLocaleString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      })
      .replace(",", "")
      .split(" ")
      .map((item, index) => (index === 0 ? item.split(".").reverse().join("-") : item))
      .join(" ");
  } else if (type === "date") {
    return new Date(date)
      .toLocaleString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
      .split(".")
      .reverse()
      .join("-");
  } else if (type === "date_utc") {
    return new Date(date)
      .toLocaleString("pl-PL", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        timeZone: "UTC",
      })
      .split(".")
      .reverse()
      .join("-");
  }
};

module.exports = async function prepareChannelName(name) {
  name = name.toLowerCase();
  name = name.replace(/[`~!@#\$%\^&*\(\)|+=?;:",<>\{\}\[\]\\\/]/g, "-");
  name = name.replace(/['\.]/g, "");
  name = name.replace(/ /g, "-");
  name = name.replace("---", "-");
  name = name.replace("--", "-");
  name = name.replace("--", "-");
  name = name.replace("--", "-");
  name = name.replace(/-$/, "");

  return name;
};

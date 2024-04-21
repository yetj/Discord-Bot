module.exports = function getDisplayName(member) {
  if (member.nickname) {
    return member.nickname;
  } else if (member.user.globalName) {
    return member.user.globalName;
  } else {
    return member.user.username;
  }
};

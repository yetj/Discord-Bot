module.exports = async function tryCatch(promise, errorsToCatch) {
  return promise
    .then((data) => {
      return [undefined, data];
    })
    .catch((error) => {
      if (errorsToCatch == undefined) {
        return [error];
      }

      if (errorsToCatch.some((e) => error instanceof e)) {
        return [error];
      }

      throw error;
    });
};

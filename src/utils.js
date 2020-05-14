const R = require('ramda');

function catchError(targetFn, inputOpts = {}) {
  const defaults = { message: null, throwError: false }
  const options = R.mergeRight(defaults, inputOpts);

  try {
    targetFn();
  } catch(err) {
    return err;
  }

  if (!options.throwError) return null;
  throw new Error(options.message || `This function was supposed to throw and error:\n${targetFn}`)
}

function joinRight(paths, separator = '.') {
  return paths.reduce((acc, path, index) => {
    if (index + 1 === paths.length) separator = '';
    if (path) return acc + path + separator;
    return acc;
  }, '');
}

function setMainOption(arg, mainOption) {
  if (typeof arg === 'object') return arg;
  return { [mainOption]: arg }
}

module.exports = {
  catchError,
  joinRight,
  setMainOption
}

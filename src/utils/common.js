function joinRight(paths, separator) {
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
  joinRight,
  setMainOption
}

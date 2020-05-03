function joinRight(paths, separator) {
  return paths.reduce((acc, path, index) => {
    if (index + 1 === paths.length) separator = '';
    if (path) return acc + path + separator;
    return acc;
  }, '');
}

module.exports = {
  joinRight
}

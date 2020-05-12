const { ElementTypes, ELEMENT } = require('../constants');

function getElementType(element) {
  return isElement(element) ? element._sfElementType : undefined;
}

function isElement(element) {
  return element && element._sfType === ELEMENT;
}

function isComponent(element) {
  return element && element._sfElementType === ElementTypes.COMPONENT;
}

function isGroup(element) {
  return element && element._sfElementType === ElementTypes.GROUP;
}

function generateMapFromPath(name, dependency, options = {}) {
  const defaults = { separator: '.' }
  options = Object.assign({}, defaults, options);
  const subnames = name.split(options.separator);

  return generate(subnames);

  function generate(paths) {
    const currentPath = paths.shift();
    if (!currentPath) return dependency;
    return { [currentPath]: generate(paths) };
  }
}

module.exports = {
  getElementType,
  isElement,
  isComponent,
  isGroup,
  generateMapFromPath
}

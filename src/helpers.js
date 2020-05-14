const { ElementTypes, ELEMENT, REGISTRATION } = require('./constants');

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

function isRegistration(element) {
  return element && element._sfType === REGISTRATION;
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

// TODO: It shouldn't be here.
function createBuildOptions(source, ...optionsList) {
  const buildOptions = {};

  optionsList.forEach(options => {
    Object.assign(buildOptions, options());
  });

  return {
    ...source,
    ...buildOptions
  }
}

module.exports = {
  getElementType,
  isElement,
  isComponent,
  isGroup,
  isRegistration,
  createBuildOptions,
  generateMapFromPath
}

const { ContainerElementTypes } = require('../constants');

module.exports = {
  getContainerElementType,
  isContainerElement,
  isComponent
}

function getContainerElementType(element) {
  if (!isContainerElement(element)) return undefined;
  return element._sfType;
}

function isContainerElement(element) {
  if (!element || !element._sfType) return false;
  if (!Object.keys(ContainerElementTypes).includes(element._sfType)) return false;
  return true;
}

// Function checks whether the container element is a component (that is: wrapped in a `sfioc.component` method).
function isComponent(element) {
  if (!element || !element._sfType) return false;
  return element._sfType === ContainerElementTypes.COMPONENT;
}

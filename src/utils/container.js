const { ElementTypes, SFIOC } = require('../constants');

function getElementType(element) {
  return isElement(element) ? element._sfElementType : undefined;
}

function isElement(element) {
  return element && element._sfType === SFIOC.ELEMENT;
}

function isComponent(element) {
  return element && element._sfElementType === ElementTypes.COMPONENT;
}

function isGroup(element) {
  return element && element._sfElementType === ElementTypes.GROUP;
}

module.exports = {
  getElementType,
  isElement,
  isComponent,
  isGroup
}

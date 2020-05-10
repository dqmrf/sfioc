const U = require('./utils');
const t = require('./infra/tcomb');
const { createBuildOptions } = require('./buildOptions');
const { ElementTypes, SFIOC } = require('./constants');

const group = {
  elements: {}
};

Object.defineProperties(group, {
  '_sfType': {
    value: SFIOC.ELEMENT,
    enumerable: true,
    configurable: false,
    writable: false
  },
  '_sfElementType': {
    value: ElementTypes.GROUP,
    enumerable: true,
    configurable: false,
    writable: false
  }
});

const handler = t.createHandler({
  description: 'Sfioc.Group'
});

const elementsHandler = handler.extend({
  validator: t.Object,
  paramName: 'elements'
});

/**
 * Prepares the group of dependencies (or groups) for registration.
 *
 * @param {object} elements
 * Dependencies wrapped with 'sfioc.component' or 'sfioc.group' wrappers.
 *
 * @return {object}
 * Container 'GROUP' element that can be registered.
 */
function groupWrapper(elements) {
  group.elements = elementsHandler.handle(elements).value;

  return createBuildOptions(group, updatingStrategy);
}

function updatingStrategy(context, attr, newValue) {
  const { elements } = context;

  for (let elementName in elements) {
    let element = elements[elementName];

    switch(U.getElementType(element)) {
      case ElementTypes.COMPONENT:
        element[attr] = newValue;
        break;
      case ElementTypes.GROUP:
        updatingStrategy(element, attr, newValue);
        break;
    }
  }

  return context;
}

module.exports = {
  groupWrapper
};

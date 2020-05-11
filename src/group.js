const U = require('./utils');
const t = require('./infra/tcomb');
const { updateOptions } = require('./component');
const { createBuildOptions } = require('./buildOptions');
const { ElementTypes, SFIOC } = require('./constants');

const handler = t.createHandler({
  description: 'Sfioc.Group'
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
function groupWrapper(elements, options = {}) {
  const group = {
    elements: handler.handle(elements, {
      validator: t.Object,
      paramName: 'elements'
    }).value
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

  updateChildren(group, options);
  return createBuildOptions(group, updateChildren);
}

function updateChildren(context, inputAttrs) {
  const { elements } = context;

  for (let elementName in elements) {
    let element = elements[elementName];

    switch(U.getElementType(element)) {
      case ElementTypes.COMPONENT:
        updateOptions(element, inputAttrs);
        break;
      case ElementTypes.GROUP:
        updateChildren(element, inputAttrs);
        break;
    }
  }

  return context;
}

module.exports = {
  groupWrapper,
  updateChildren
};

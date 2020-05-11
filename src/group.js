const U = require('./utils');
const t = require('./infra/tcomb');
const { createBuildOptions } = require('./buildOptions');
const { updateComponentOptions } = require('./component');
const { ElementTypes, SFIOC, COMPONENT_OPTIONS } = require('./constants');

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
    }).value,
    [COMPONENT_OPTIONS]: {}
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

  updateComponentOptions(group, options);
  return createBuildOptions(group, updateComponentOptions);
}

module.exports = {
  groupWrapper
};

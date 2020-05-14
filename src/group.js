const t = require('./infra/tcomb');
const H = require('./helpers');
const component = require('./component');
const { ElementTypes, ELEMENT, COMPONENT_OPTIONS } = require('./constants');

/**
 * Prepares the group of dependencies (or groups) for registration.
 *
 * @param {object} elements
 * Dependencies wrapped with 'sfioc.component' or 'sfioc.group' wrappers.
 *
 * @param {object} options
 * Options for nested components.
 *
 * @return {object}
 * Container 'GROUP' element that can be registered.
 */
function createGroup(elements, options = {}) {
  const group = {
    elements: t.handle(elements, {
      description: 'Sfioc.createGroup',
      paramName: 'elements',
      validator: t.Object,
    }).value,
    [COMPONENT_OPTIONS]: {}
  };

  Object.defineProperties(group, {
    '_sfType': {
      value: ELEMENT,
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

  component.updateKinOptions(group, options);
  return H.createBuildOptions(group, component.buildOptions);
}

module.exports = {
  createGroup
};

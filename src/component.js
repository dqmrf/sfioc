const R = require('ramda');
const t = require('./infra/tcomb');
const { ComponentOptions } = require('./structures');
const { createBuildOptions } = require('./buildOptions');
const {
  ComponentTypes, Lifetime, ElementTypes, SFIOC, COMPONENT_OPTIONS
 } = require('./constants');

const componentOptionsDefaults = {
  type: ComponentTypes.FUNCTION,
  lifetime: Lifetime.TRANSIENT,
  dependsOn: null
}

/**
 * Prepares the dependency for registration.
 *
 * @param {any} target
 * Dependency for resolving.
 *
 * @param {object} options
 * Dependency options.
 *
 * @return {object}
 * Container 'COMPONENT' element that can be registered.
 */
function componentWrapper(target, options = {}) {
  const component = {
    target,
    [COMPONENT_OPTIONS]: R.clone(componentOptionsDefaults)
  };

  Object.defineProperties(component, {
    '_sfType': {
      value: SFIOC.ELEMENT,
      enumerable: true,
      configurable: false,
      writable: false
    },
    '_sfElementType': {
      value: ElementTypes.COMPONENT,
      enumerable: true,
      configurable: false,
      writable: false
    }
  });

  updateComponentOptions(component, options);
  return createBuildOptions(component, updateComponentOptions);
}

function updateComponentOptions(source, newOptions) {
  t.handle(newOptions, {
    validator: ComponentOptions,
    paramName: COMPONENT_OPTIONS
  });

  return Object.assign(
    source[COMPONENT_OPTIONS],
    filterComponentOptions(newOptions)
  );
}

function filterComponentOptions(options) {
  const result = {};
  for (let optionName in options) {
    if (!componentOptionsDefaults.hasOwnProperty(optionName)) continue;
    result[optionName] = options[optionName];
  }
  return result;
}

module.exports = {
  componentWrapper,
  updateComponentOptions
};

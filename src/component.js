const t = require('./infra/tcomb');
const { ComponentOptions } = require('./structures');
const { createBuildOptions } = require('./buildOptions');
const { ComponentTypes, Lifetime, ElementTypes, SFIOC } = require('./constants');

const configurableOptions = [
  'type', 'lifetime', 'dependsOn'
];

const handler = t.createHandler({
  description: 'Sfioc.Component'
});

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
    type: ComponentTypes.FUNCTION,
    lifetime: Lifetime.TRANSIENT,
    dependsOn: null
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

  updateOptions(component, options);
  return createBuildOptions(component, updateOptions);
}

function updateOptions(context, newOptions) {
  handler.handle(newOptions, {
    validator: ComponentOptions,
    paramName: 'options'
  });
  return Object.assign(context, filterOptions(newOptions));
}

function filterOptions(options) {
  const result = {};
  for (let optionName in options) {
    if (!configurableOptions.includes(optionName)) continue;
    result[optionName] = options[optionName];
  }
  return result;
}

module.exports = {
  componentWrapper,
  updateOptions
};

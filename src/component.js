const t = require('./infra/tcomb');
const { ComponentOptions } = require('./structures');
const { createBuildOptions } = require('./buildOptions');
const { ComponentTypes, Lifetime, ElementTypes, SFIOC } = require('./constants');

const component = {
  target: null
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

const defaultOptions = {
  type: ComponentTypes.FUNCTION,
  lifetime: Lifetime.TRANSIENT,
  dependsOn: null
}

const handler = t.createHandler({
  description: 'Sfioc.Component'
});

const optionsHandler = handler.extend({
  validator: ComponentOptions,
  paramName: 'options',
  defaults: defaultOptions
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
  options = optionsHandler.handle(options).value;

  Object.assign(component, {
    target,
    type: options.type,
    lifetime: options.lifetime,
    dependsOn: options.dependsOn
  });

  return createBuildOptions(component, updatingStrategy);
}

function updatingStrategy(context, attr, newValue) {
  context[attr] = newValue;
  return context;
}

module.exports = {
  componentWrapper
};

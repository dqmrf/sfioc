const R = require('ramda');
const t = require('./infra/tcomb');
const { ComponentOptions } = require('./structures');
const {
  ComponentTypes,
  Lifetime,
  ElementTypes,
  ELEMENT,
  COMPONENT_OPTIONS
} = require('./constants');

const defaultOptions = {
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
    [COMPONENT_OPTIONS]: R.clone(defaultOptions)
  };

  Object.defineProperties(component, {
    '_sfType': {
      value: ELEMENT,
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
  return createComponentBuildOptions(component);
}

function createComponentBuildOptions(source) {
  const builder = {
    ...source,
    setLifetime,
    singleton: partial(setLifetime, Lifetime.SINGLETON),
    transient: partial(setLifetime, Lifetime.TRANSIENT),
    fn: partial(setType, ComponentTypes.FUNCTION),
    value: partial(setType, ComponentTypes.VALUE),
    class: partial(setType, ComponentTypes.CLASS)
  }

  return builder;

  function setLifetime(value) {
    return update('lifetime', value);
  }

  function setType(value) {
    return update('type', value);
  }

  function update(name, value) {
    updateComponentOptions(source, { [name]: value });
    return builder;
  }
}

function updateComponentOptions(source, inputOptions, ...args) {
  const newOptions = args.reduce((acc, options) => {
    return Object.assign({}, acc, options || {});
  }, inputOptions || {});

  if (R.isEmpty(newOptions)) return source[COMPONENT_OPTIONS];

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
    if (!defaultOptions.hasOwnProperty(optionName)) continue;
    result[optionName] = options[optionName];
  }
  return result;
}

function partial(fn, ...args) {
  return function partiallyApplied() {
    return fn.apply(this, args);
  }
}

module.exports = {
  componentWrapper,
  updateComponentOptions,
  filterComponentOptions,
  createComponentBuildOptions,
  COMPONENT_OPTIONS
};

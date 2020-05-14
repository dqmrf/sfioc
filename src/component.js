const R = require('ramda');
const H = require('./helpers');
const t = require('./infra/tcomb');
const { ComponentOptions } = require('./structures');
const {
  ComponentTypes,
  Lifetime,
  ElementTypes,
  ELEMENT,
  COMPONENT_OPTIONS
} = require('./constants');

const allowedOptions = [
  'dependsOn', 'type', 'lifetime'
];

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
function createComponent(target, options = {}) {
  const component = {
    target,
    [COMPONENT_OPTIONS]: {}
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

  updateOptions(component, options);

  return H.createBuildOptions(
    component,
    componentBuildOptions,
    componentOnlyBuildOptions
  );
}

function componentBuildOptions() {
  return {
    setType,
    setLifetime,
    singleton: partial(setLifetime, Lifetime.SINGLETON),
    transient: partial(setLifetime, Lifetime.TRANSIENT),
    fn: partial(setType, ComponentTypes.FUNCTION),
    value: partial(setType, ComponentTypes.VALUE),
    class: partial(setType, ComponentTypes.CLASS)
  }

  function setLifetime(value) {
    return updateOptions(this, { lifetime: value });
  }

  function setType(value) {
    return updateOptions(this, { type: value });
  }
}

function componentOnlyBuildOptions() {
  return { dependsOn }

  function dependsOn(value) {
    return updateOptions(this, { dependsOn: value });
  }
}

function updateOptions(source, inputOptions, ...args) {
  const newOptions = args.reduce((acc, options) => {
    return Object.assign({}, acc, options || {});
  }, inputOptions || {});

  if (R.isEmpty(newOptions)) return source[COMPONENT_OPTIONS];

  t.handle(newOptions, {
    validator: ComponentOptions,
    paramName: COMPONENT_OPTIONS
  });

  Object.assign(
    source[COMPONENT_OPTIONS],
    filterOptions(newOptions)
  );

  return source;
}

function filterOptions(options) {
  const result = {};
  for (let optionName in options) {
    if (!allowedOptions.includes(optionName)) continue;
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
  createComponent,
  filterOptions,
  updateKinOptions: updateOptions,
  buildOptions: componentBuildOptions
};

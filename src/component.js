const R = require('ramda');
const H = require('./helpers');
const t = require('./infra/tcomb');
const { ComponentOptions } = require('./structures');
const {
  ResolveAs,
  Lifetime,
  ElementTypes,
  ELEMENT,
  COMPONENT_OPTIONS
} = require('./constants');

const allowedOptions = [
  'dependsOn', 'resolveAs', 'lifetime'
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
    [COMPONENT_OPTIONS]: updateOptions(null, options)
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

  return H.createBuildOptions(
    component,
    componentBuildOptions,
    componentOnlyBuildOptions
  );
}

function componentBuildOptions() {
  return {
    resolveAs,
    setLifetime,
    updateComponentOptions,
    singleton: partial(setLifetime, Lifetime.SINGLETON),
    transient: partial(setLifetime, Lifetime.TRANSIENT),
    fn: partial(resolveAs, ResolveAs.FUNCTION),
    value: partial(resolveAs, ResolveAs.VALUE),
    class: partial(resolveAs, ResolveAs.CLASS)
  }

  function setLifetime(value) {
    return updateOptions(this, { lifetime: value });
  }

  function resolveAs(value) {
    return updateOptions(this, { resolveAs: value });
  }

  function updateComponentOptions(...options) {
    return updateOptions(this, ...options);
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

  t.handle(newOptions, {
    validator: ComponentOptions,
    paramName: COMPONENT_OPTIONS
  });

  const updatedOptions = Object.assign(
    (source ? source[COMPONENT_OPTIONS] : {}),
    filterOptions(newOptions)
  );

  return source || updatedOptions;
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
  updateRelatedOptions: updateOptions,
  buildOptions: componentBuildOptions
};

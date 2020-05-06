const R = require('ramda');
const async = require('async');
const U = require('./utils');
const t = require('./infra/tcomb');
const { Lifetime, ElementTypes } = require('./constants');
const { SfiocResolutionError, SfiocTypeError } = require('./errors');
const { Elements, ComponentDependencies } = require('./structures');
const { registration } = require('./registration');

const { COMPONENT, GROUP } = ElementTypes;

function createContainer() {
  const registrations = {};
  const resolutionStack = [];
  const cache = new Map();

  const container = {
    register,
    resolve,
    registrations,
    cache
  }

  return container;

  function register(elements) {
    const vd = t.createValidator('Sfioc.register');
    vd.handle([elements, 'elements'], Elements);
    return _register(elements);
  }

  function _register(elements, options = {}) {
    const elementNames = Object.keys(elements);
    const { groupId } = options;

    for (const elementName of elementNames) {
      const element = elements[elementName];
      const elementId = U.joinRight([groupId, elementName], '.');

      switch(U.getElementType(element)) {
        case COMPONENT: {
          registrations[elementId] = registration(
            element,
            { id: elementId, groupId }
          );
          break;
        }
        case GROUP: {
          _register(element.elements, { groupId: elementId });
          break;
        }
      }
    }

    return container;
  }

  function resolve(name) {
    let registration = registrations[name];

    if (!registration) {
      throw new SfiocResolutionError(name, resolutionStack);
    }

    if (resolutionStack.indexOf(name) > -1) {
      throw new SfiocResolutionError(
        name,
        resolutionStack,
        `'Cyclic dependencies detected.'`
      );
    }

    resolutionStack.push(name);

    let resolved, cached;
    switch (registration.lifetime || Lifetime.TRANSIENT) {
      case Lifetime.TRANSIENT: {
        resolved = _resolveTarget(registration);
        break;
      }
      case Lifetime.SINGLETON: {
        cached = cache.get(name);
        if (!cached) {
          resolved = _resolveTarget(registration);
          cache.set(name, resolved);
        } else {
          resolved = cached;
        }
        break;
      }
      default: {
        throw new SfiocResolutionError(
          name,
          resolutionStack,
          `Unknown lifetime "${registration.lifetime}"`
        );
      }
    }

    resolutionStack.pop();
    return resolved;
  }

  function _resolveTarget(registration) {
    let resolvedTarget;
    async.seq(
      next => next(null, registration.dependencies),
      prepareTargetDependencies,
      resolveTargetDependencies
    )((err, resolvedDependencies) => {
      const { target } = registration;

      if (err) {
        resolvedTarget = target();
      } else {
        resolvedTarget = target(resolvedDependencies);
      }
    });

    return resolvedTarget;

    function prepareTargetDependencies(dependsOn, next) {
      if (!dependsOn || R.isEmpty(dependsOn)) return next(1);

      switch (R.type(dependsOn)) {
        case 'Array': {
          return next(null, dependsOn);
        }
        case 'String': {
          return next(null, [dependsOn]);
        }
        case 'Function': {
          const selectors = _generateDependenciesSelectors();
          const dependencies = dependsOn(selectors);

          // This validation is necessary here, because we just called the
          // callback provided by the user, and injected the selectors inside.
          // Callback may return some unexpected value, and we need to validate it.
          SfiocTypeError.assert(
            t.validate(dependencies, ComponentDependencies).isValid(),
            (`"dependsOn" callback must return the (String | Array) with dependency names, ` +
            `but got: (${R.type(dependencies)})`)
          );

          return prepareTargetDependencies(dependencies, next);
        }
      }
    }

    function resolveTargetDependencies(dependencies, next) {
      let resolvedDependencies = {};
      dependencies.forEach(dependency => {
        const resolvedDependency = resolve(dependency);
        const newDependency = U.generateMapFromPath(dependency, resolvedDependency);
        resolvedDependencies = R.mergeDeepRight(resolvedDependencies, newDependency);
      });
      return next(null, resolvedDependencies);
    }
  }

  function _generateDependenciesSelectors() {
    let selectors = {};

    Object.values(registrations).forEach(registration => {
      const { id } = registration;
      const newSelector = U.generateMapFromPath(id, id);
      selectors = R.mergeDeepRight(selectors, newSelector);
    });

    return selectors;
  }
}

module.exports = {
  createContainer
};

const R = require('ramda');
const async = require('async');
const U = require('./utils');
const t = require('./infra/tcomb');
const { SfiocResolutionError } = require('./errors');
const { createRegistration } = require('./registration');
const { Elements, ComponentDependencies } = require('./structures');
const { Lifetime, ElementTypes, COMPONENT_OPTIONS } = require('./constants');
const { updateComponentOptions, filterComponentOptions } = require('./component');

const { COMPONENT, GROUP } = ElementTypes;

/**
 * Creates an Sfioc container instance.
 *
 * @return {object}
 * The container.
 */
function createContainer(containerOptions = {}) {
  // Storage for all registered registrations.
  const registrations = {};

  // Storage for currently resolved registrations.
  const resolutionStack = [];

  // Storage for resolved dependencies with 'SINGLETON' lifetime.
  const cache = new Map();

  // Registration that is currently resolving.
  let registration = null;

  // Global options for all components.
  const componentOptions = filterComponentOptions(containerOptions);

  // Container itself.
  const container = {
    register,
    resolve,
    registrations,
    cache
  }

  return container;

  /**
   * Registers input elements.
   *
   * @param {object} elements
   * Object with container elements.
   *
   * @return {object}
   * The container.
   */
  function register(elements) {
    t.handle(elements, {
      validator: Elements,
      description: 'Sfioc.register',
      paramName: 'elements'
    });

    return _register(elements);
  }

  /**
   * Registers input elements.
   *
   * This method is only used internally, so it doesn't need any
   * input parameter validations.
   *
   * @param {object} elements
   * Object with container elements.
   *
   * @param {object} options
   * Options for internal recursive calls.
   *
   * @return {object}
   * The container.
   */
  function _register(elements, params = {}) {
    params = R.mergeRight({ parentGroup: {} }, params);

    const elementNames = Object.keys(elements);
    const { parentGroup } = params;

    for (const elementName of elementNames) {
      const element = elements[elementName];
      const elementId = U.joinRight([parentGroup.id, elementName], '.');

      updateComponentOptions(
        element,
        parentGroup[COMPONENT_OPTIONS],
        componentOptions
      );

      switch(U.getElementType(element)) {
        case COMPONENT: {
          registrations[elementId] = createRegistration(
            element, {
            id: elementId,
            groupId: parentGroup.id
          });
          break;
        }
        case GROUP: {
          _register(
            element.elements, {
            parentGroup: {
              ...element,
              id: elementId
            }
          });
          break;
        }
      }
    }

    return container;
  }

  /**
   * Resolves the registration with the given name.
   *
   * @param {string} name
   * The name of the registration to resolve.
   *
   * @return {any}
   * Whatever was resolved.
   */
  function resolve(name) {
    registration = registrations[name];

    if (!registration) {
      throw new SfiocResolutionError(name, resolutionStack);
    }

    if (R.find(R.propEq('id', name), resolutionStack)) {
      throw new SfiocResolutionError(
        name,
        resolutionStack,
        `'Cyclic dependencies detected.'`
      );
    }

    resolutionStack.push(registration);

    let resolved, cached;
    switch (registration.lifetime) {
      case Lifetime.TRANSIENT: {
        resolved = resolveRegistration();
        break;
      }
      case Lifetime.SINGLETON: {
        cached = cache.get(name);
        if (!cached) {
          resolved = resolveRegistration();
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
    registration = R.last(resolutionStack);

    return resolved;
  }

  /**
   * Resolves the dependencies of the given registration.
   *
   * @param {object} registration
   * The registration to resolve.
   *
   * @return {any}
   * Whatever was resolved.
   */
  function resolveRegistration() {
    let resolvedTarget;

    async.seq(
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
  }

  /**
   * Transforms dependencies of the given registration to an Array.
   *
   * @param {object} registration
   * The registration.
   *
   * @param {function} next
   * Callback to the next step.
   *
   * @return {array}
   * Adapted dependencies for further use.
   */
  function prepareTargetDependencies(next) {
    return prepare(registration.dependencies, next);

    function prepare(dependsOn, next) {
      if (!dependsOn || R.isEmpty(dependsOn)) return next(1);

      switch (R.type(dependsOn)) {
        case 'Array': {
          return next(null, dependsOn);
        }
        case 'String': {
          return next(null, [dependsOn]);
        }
        case 'Function': {
          const selectors = generateDependenciesSelectors(registration);
          const dependencies = dependsOn(selectors);

          // This validation is necessary here, because we just called the
          // callback provided by the user, and injected the selectors inside.
          // Callback may return some unexpected value, and we need to validate it.
          t.handle(dependencies, {
            validator: ComponentDependencies,
            description: 'Sfioc.resolve',
            message: (`"dependsOn" callback must return the (String | Array)` +
            ` with dependency names, but got: (${R.type(dependencies)})`)
          });

          return prepare(dependencies, next);
        }
      }
    }
  }

  /**
   * 1. Resolves all of the given dependencies (for current registration).
   * 2. Creates a single map with all of the resolved dependencies.
   *
   * @param {array} dependencies
   * The registration to resolve.
   *
   * @param {function} next
   * Callback to the next step.
   *
   * @return {object}
   * Map with resolved dependencies that will be injected into the target function.
   */
  function resolveTargetDependencies(dependencies, next) {
    let resolvedDependencies = {};
    dependencies.forEach(dependency => {
      const resolvedDependency = resolve(dependency);
      const newDependency = U.generateMapFromPath(dependency, resolvedDependency);
      resolvedDependencies = R.mergeDeepRight(resolvedDependencies, newDependency);
    });
    return next(null, resolvedDependencies);
  }

  /**
   * Generate selectors with registrations to pass them to the 'dependsOn'
   * callback in the future.
   *
   * @param {object} registration
   * The registration to exclude.
   *
   * @return {object}
   * Ready selectors.
   */
  function generateDependenciesSelectors(exclude = {}) {
    let selectors = {};

    Object.values(registrations).forEach(registration => {
      const { id } = registration;
      if (id === exclude.id) return;
      const newSelector = U.generateMapFromPath(id, id);
      selectors = R.mergeDeepRight(selectors, newSelector);
    });

    return selectors;
  }
}

module.exports = {
  createContainer
};

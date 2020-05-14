const R = require('ramda');
const U = require('./utils');
const H = require('./helpers');
const t = require('./infra/tcomb');
const component = require('./component');
const { createResolver } = require('./resolver');
const { SfiocResolutionError } = require('./errors');
const { createRegistration } = require('./registration');
const { Elements, ContainerOptions } = require('./structures');
const { InjectionMode, Lifetime, ElementTypes, COMPONENT_OPTIONS } = require('./constants');

const { COMPONENT, GROUP } = ElementTypes;

const defaultOptions = {
  injectionMode: InjectionMode.CLASSIC
}

/**
 * Creates an Sfioc container instance.
 *
 * @return {object}
 * The container.
 */
function createContainer(containerOptions = {}) {
  // Global options for the container.
  containerOptions = t.handle(containerOptions, {
    description: 'Sfioc.createContainer',
    paramName: 'containerOptions',
    validator: ContainerOptions,
    defaults: R.clone(defaultOptions)
  }).value

  // Global options for all components.
  const componentOptions = component.filterOptions(containerOptions);

  // Storage for all registered registrations.
  const registrations = {};

  // Storage for currently resolved registrations.
  const resolutionStack = [];

  // Storage for resolved dependencies with 'SINGLETON' lifetime.
  const cache = new Map();

  // Container itself.
  const container = {
    options: containerOptions,
    register,
    resolve,
    registrations,
    cache,
    get: proxify(registrations)
  }

  // For resolving the current registration.
  const resolver = createResolver(container);

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

    const elementIds = Object.keys(elements);
    const { parentGroup } = params;

    for (const elementId of elementIds) {
      const element = elements[elementId];
      const elementPath = U.joinRight([parentGroup.id, elementId]);

      component.updateOptions(
        element,
        parentGroup[COMPONENT_OPTIONS],
        componentOptions
      );

      switch(H.getElementType(element)) {
        case COMPONENT: {
          registrations[elementPath] = createRegistration(
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
              id: elementPath
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
   * @param {string | object} registration
   * The id of the registration or registration.
   *
   * @return {any}
   * Whatever was resolved.
   */
  function resolve(registration) {
    let currentRegistration = registration;

    if (R.type(registration) === 'String') {
      currentRegistration = registrations[registration];
    }

    if (!H.isRegistration(currentRegistration)) {
      throw new SfiocResolutionError(registration, resolutionStack);
    }

    const { path, lifetime } = currentRegistration;

    if (resolutionStack.includes(path)) {
      throw new SfiocResolutionError(
        path,
        resolutionStack,
        `'Cyclic dependencies detected.'`
      );
    }

    resolutionStack.push(path);

    let resolved, cached;
    switch (lifetime) {
      case Lifetime.TRANSIENT: {
        resolved = resolver.resolve(currentRegistration);
        break;
      }
      case Lifetime.SINGLETON: {
        cached = cache.get(path);
        if (!cached) {
          resolved = resolver.resolve(currentRegistration);
          cache.set(path, resolved);
        } else {
          resolved = cached;
        }
        break;
      }
      default: {
        throw new SfiocResolutionError(
          path,
          resolutionStack,
          `Unknown lifetime "${lifetime}"`
        );
      }
    }

    resolutionStack.pop();
    return resolved;
  }

  /**
   * Generate a proxy object for registrations that is able
   * to resolve its dependencies.
   *
   * @param {object} registrations
   * Container registrations.
   *
   * @return {object}
   * Proxy with registration resolvers.
   */
  function proxify(registrations) {
    return new Proxy(registrations, {
      get(target, inputId) {
        const groupRegistrations = {};

        for (registration of Object.values(target)) {
          if (inputId == registration.id) {
            return resolve(registration);
          }

          if (inputId == registration.groupId) {
            groupRegistrations[registration.id] = registration;
          }
        }

        if (!R.isEmpty(groupRegistrations)) {
          return proxify(groupRegistrations);
        }

        throw new SfiocResolutionError(inputId, resolutionStack);
      }
    });
  }
}

module.exports = {
  createContainer
};

const R = require('ramda');
const t = require('./infra/tcomb');
const { Lifetime, ElementTypes } = require('./constants');
const { SfiocResolutionError } = require('./errors');
const { Elements } = require('./structures');
const { createRegistration } = require('./registration');
const { joinRight, getElementType } = require('./utils');

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
      const elementId = joinRight([groupId, elementName], '.');

      switch(getElementType(element)) {
        case COMPONENT: {
          registrations[elementId] = createRegistration(
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
    const { target, dependencies } = registration;

    if (dependencies && !!dependencies.length) {
      return target(_resolveTargetDependencies(dependencies));
    }

    return target();
  }

  function _resolveTargetDependencies(dependencies) {
    let resolvedDependencies = {};
    dependencies.forEach(dependency => {
      const resolvedDependency = resolve(dependency);
      const newDependency = _generateDependenciesMap(dependency, resolvedDependency);
      resolvedDependencies = R.mergeDeepRight(resolvedDependencies, newDependency);
    });
    return resolvedDependencies;
  }

  function _generateDependenciesMap(name, dependency) {
    const subnames = name.split('.');
    return generate(subnames);

    function generate(paths) {
      const currentPath = paths.shift();
      if (!currentPath) return dependency;
      return { [currentPath]: generate(paths) }
    }
  }
}

module.exports = {
  createContainer
};

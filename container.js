const { Lifetime } = require('./constants');
const { SfiocResolutionError } = require('./errors');
const { isComponent, isGroup } = require('./utils');

module.exports = {
  createContainer
};

function createContainer() {
  const resolutionStack = [];
  const cache = new Map();
  const _elements = {};

  const container = {
    register,
    resolve,
    cache
  }

  return container;

  function register(elements) {
    return _register(elements);
  }

  function _register(elements, options = {/* private options */}) {
    const names = [
      ...Object.keys(elements),
      ...Object.getOwnPropertySymbols(elements)
    ];

    for (const name of names) {
      _elements[name] = elements[name];
    }

    return container;
  }

  function resolve(name) {
    let component = _getElementByName(name);

    if (!isComponent(component)) {
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

    const { options } = component;
    let resolved, cached;
    switch (options.lifetime || Lifetime.TRANSIENT) {
      case Lifetime.TRANSIENT: {
        resolved = _resolveTarget(component);
        break;
      }
      case Lifetime.SINGLETON: {
        cached = cache.get(name);
        if (!cached) {
          resolved = _resolveTarget(component);
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
          `Unknown lifetime "${options.lifetime}"`
        );
      }
    }

    resolutionStack.pop();
    return resolved;
  }

  function _resolveTarget(component) {
    const { options, target } = component;
    const dependencies = options.dependsOn;

    if (dependencies && dependencies.length > 0) {
      return target(_resolveTargetDependencies(dependencies));
    }

    return target();
  }

  function _resolveTargetDependencies(dependencies) {
    let resolvedDependencies = {};
    dependencies.forEach(dependency => {
      const resolvedDependency = resolve(dependency);
      const newDependency = _createDependencyMap(dependency, resolvedDependency);
      Object.assign(resolvedDependencies, newDependency);
    });
    return resolvedDependencies;
  }

  function _createDependencyMap(name, dependency) {
    const subnames = name.split('.');
    return _create(subnames);

    function _create(paths) {
      const currentPath = paths.shift();
      if (!currentPath) return dependency;
      return { [currentPath]: _create(paths) }
    }
  }

  function _getElementByName(name) {
    const subnames = name.split('.');
    return _find(subnames, _elements);

    function _find(paths, elements) {
      const isLastPath = !paths[1],
            currentPath = paths.shift(),
            currentElement = elements[currentPath];

      if (!isLastPath) {
        if (isGroup(currentElement)) {
          return _find(paths, currentElement.components);
        }
        // TODO: else { here will be groups resolving implementation. }
      } else {
        if (isComponent(currentElement)) {
          return currentElement;
        }
      }

      throw new SfiocResolutionError(
        name,
        resolutionStack,
        `Incorrect registration name: '${name}'.`
      );
    }
  }
}

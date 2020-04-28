const { Lifetime } = require('./constants');
const { isComponent, isGroup } = require('./utils');


const createContainer = () => {
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
      throw new Error(`Could not resolve ${name}.`)
    }

    if (resolutionStack.indexOf(name) > -1) {
      throw new Error('Cyclic dependencies detected.');
    }

    resolutionStack.push(name);

    const { options } = component;
    let resolved = null;
    let cached = null;
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
        throw new Error(`Unknown lifetime ${options.lifetime}`);
      }
    }

    resolutionStack.pop();
    return resolved;
  }

  function _resolveTarget(component) {
    const { options, target } = component;
    const dependencies = options.dependsOn;

    if (dependencies && dependencies.length > 0) {
      let children = {};

      dependencies.forEach(dependency => {
        const resolved = resolve(dependency);
        Object.assign(children, _createDependencyMap(dependency, resolved));
      });

      return target(children);
    }

    return target();
  }

  function _createDependencyMap(name, dependency) {
    const subnames = name.split('.');
    return _generate(subnames);

    function _generate(paths) {
      const currentPath = paths.shift();
      if (!currentPath) return dependency;
      return { [currentPath]: _generate(paths) }
    }
  }

  function _getElementByName(name) {
    let currentElement, result;
    const subnames = name.split('.');

    subnames.forEach((subname, index) => {
      // First iteration:
      if (index === 0) currentElement = _elements;

      // Middle itarations:
      if (index + 1 !== subnames.length) {
        // currentElement = GROUP element.
        currentElement = currentElement[subname];

        if (isGroup(currentElement)) {
          currentElement = currentElement.components;
        } else {
          // Components are inappropriate in middle iterations.
          throw new Error(`Incorrect registration name: '${name}'.`);
        }
      }

      // Last iteration:
      else {
        result = currentElement[subname];
      }
    });

    if (!result) {
      // TODO: DRY
      throw new Error(`Incorrect registration name: '${name}'.`);
    }

    return result;
  }
}

module.exports = {
  createContainer
};

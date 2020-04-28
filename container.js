const { ContainerElementTypes, Lifetime } = require('./constants');
const { getContainerElementType, isComponent } = require('./utils');


const createContainer = () => {
  const registrations = [];
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
    return _register(elements);
  }

  function _register(elements, options = {/* private options */}) {
    const names = [
      ...Object.keys(elements),
      ...Object.getOwnPropertySymbols(elements)
    ];
    const { parentName } = options;

    for (const name of names) {
      const element = elements[name];
      const key = parentName ? (parentName + '.' + name) : name

      switch (getContainerElementType(element)) {
        case ContainerElementTypes.COMPONENT: {
          registrations[key] = element;
          break;
        }
        case ContainerElementTypes.GROUP: {
          _register(element.components, { parentName: key });
          break;
        }
        default: {
          throw new Error(
            `Component must be wrapped in \`sfioc.component\` method in order to be registered. ` +
            `Or use \`sfioc.group\` method in order to register multiple components in namespace.`
          );
        }
      }
    }

    return container;
  }

  function resolve(name) {
    const component = registrations[name];

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
        children[dependency] = resolve(dependency);
      });

      return target(children);
    }

    return target();
  }
}

module.exports = {
  createContainer
};

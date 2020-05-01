const R = require('ramda');
const { Lifetime, ContainerElementTypes } = require('./constants');
const { SfiocResolutionError } = require('./errors');
const { isComponent, isGroup, getContainerElementType } = require('./utils');
const { Validator } = require('./utils');
const { ContainerElements } = require('./structures');

const { COMPONENT, GROUP } = ContainerElementTypes;

function createContainer() {
  const resolutionStack = [];
  const cache = new Map();
  const _elements = {};

  const container = {
    register,
    resolve,
    cache,
    get components() {
      return _extractComponents()
    },
    get groups() {
      return _extractGroups()
    }
  }

  return container;

  function register(elements) {
    const v = new Validator('Sfioc.register');
    v.validate(elements, ContainerElements);
    return _register(elements);
  }

  function _register(elements) {
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
      resolvedDependencies = R.mergeDeepRight(resolvedDependencies, newDependency);
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

  function _extractComponents() {
    return _extractElements(COMPONENT, _elements);
  }

  function _extractGroups() {
    return _extractElements(GROUP, _elements);
  }

  function _extractElements(elementsToExtractType, elements) {
    let generateSiblingsMap;
    switch(elementsToExtractType) {
      case COMPONENT: {
        generateSiblingsMap = generateComponentsMap;
        break;
      }
      case GROUP: {
        generateSiblingsMap = generateGroupsMap;
        break;
      }
    }

    return extract(elements);

    function extract(elements, parentName) {
      const keys = Object.keys(elements);
      let result = {}

      keys.forEach(key => {
        const element = elements[key];
        const elementName = parentName ? `${parentName}.${key}` : key;
        Object.assign(result, generateSiblingsMap(element, elementName));
      });

      return result;
    }

    function generateComponentsMap(element, elementName) {
      switch(getContainerElementType(element)) {
        case GROUP: {
          return extract(element.components, elementName);
        }
        case COMPONENT: {
          return { [elementName]: element }
        }
      }
    }

    function generateGroupsMap(element, elementName) {
      if (getContainerElementType(element) !== GROUP) return {};

      return Object.assign(
        { [elementName]: element },
        extract(element.components, elementName)
      );
    }
  }
}

module.exports = {
  createContainer
};

import R from 'ramda'
import t from './infra/tcomb'
import * as U from './utils'
import * as H from './helpers'
import { createGroup } from './group'
import { createResolver } from './resolver'
import { createRegistration } from './registration'
import { Elements, ContainerOptions } from './structures'
import { SfiocResolutionError, SfiocTypeError } from './errors'
import {
  handleOptions as handleComponentOptions,
  filterOptions as extractComponentOptions
} from './component'
import {
  InjectionMode,
  Lifetime,
  ResolveAs,
  ElementTypes,
  COMPONENT_OPTIONS,
  ParamNames
} from './constants'

const { COMPONENT, GROUP } = ElementTypes

const defaultOptions = {
  injectionMode: InjectionMode.CLASSIC,
  resolveAs: ResolveAs.FUNCTION,
  lifetime: Lifetime.TRANSIENT,
}

/**
 * Creates a Sfioc container instance.
 *
 * @return {object}
 * The container.
 */
export function createContainer(containerOptions = {}) {
  // Global options for the container.
  containerOptions = t.handle(containerOptions, {
    description: 'Sfioc.createContainer',
    paramName: 'containerOptions',
    validator: ContainerOptions,
    defaults: R.clone(defaultOptions)
  }).value

  // Global options for all components.
  const componentOptions = extractComponentOptions(containerOptions)

  // Storage for all registered registrations.
  const registrations = {}

  // Storage for currently resolved registrations.
  const resolutionStack = []

  // Storage for resolved dependencies with 'SINGLETON' lifetime.
  const cache = new Map()

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
  const resolver = createResolver(container)

  return container

  /**
   * Registers input elements.
   *
   * @return {object}
   * The container.
   */
  function register(...args) {
    const [firstArg, secondArg, thirdArg] = args
    const options = (R.is(String, firstArg) ? thirdArg : secondArg) || {}
    const params = { [COMPONENT_OPTIONS]: extractComponentOptions(options) }
    const { namespace } = options;

    if (R.isEmpty(firstArg)) throw argsError(firstArg)

    if (H.isComponent(firstArg) && namespace) {
      return registerElements({ [namespace]: firstArg }, params)
    }

    if (H.isGroup(firstArg)) {
      return registerElements(withNamespace(firstArg.elements), {
        ...params,
        parentGroup: firstArg
      })
    }

    switch (R.type(firstArg)) {
      case 'Object': {
        return registerElements(withNamespace(firstArg), params)
      }
      case 'String': {
        if (namespace) throw argsError(namespace, firstArg)
        return register(secondArg, { ...options, namespace: firstArg })
      }
      case 'Array': {
        if (R.type(firstArg[0]) !== 'String') {
          firstArg.forEach(subarg => register(subarg, options))
          return container
        }

        return register(
          firstArg[0],
          firstArg[1],
          handleComponentOptions(params[COMPONENT_OPTIONS], firstArg[2])
        )
      }
    }

    throw argsError(firstArg, secondArg)

    function withNamespace(elements) {
      if (!options.namespace) return elements
      return { [options.namespace]: createGroup(elements) }
    }

    function argsError(...args) {
      return new SfiocTypeError({
        description: 'Sfioc.register',
        paramName: ParamNames.all,
        given: args.reduce((acc, arg) => (acc += `, ${arg}`)),
        expected: '(object) | (array) | (string, object | array)'
      })
    }
  }

  /**
   * Registers input elements.
   *
   * This method is only used internally.
   *
   * @param {object} elements
   * Object with container elements.
   *
   * @param {object} params
   * Params for internal recursive calls.
   *
   * @return {object}
   * The container.
   */
  function registerElements(elements, params = {}) {
    t.handle(elements, {
      validator: Elements,
      description: 'Sfioc.registerElements',
      paramName: 'elements'
    })

    params = R.mergeRight({ parentGroup: {} }, params)

    const elementIds = Object.keys(elements)
    const { parentGroup } = params

    for (const elementId of elementIds) {
      const element = R.clone(elements[elementId])
      const elementPath = U.joinRight([parentGroup.id, elementId])

      // Here options are overwritten from right to left.
      element.updateComponentOptions(
        componentOptions, // global container's options.
        params[COMPONENT_OPTIONS], // options that are given from the 'register' method.
        parentGroup[COMPONENT_OPTIONS], // options from the parent group.
        element[COMPONENT_OPTIONS] // element's own options.
      )

      switch(H.getElementType(element)) {
        case COMPONENT: {
          registrations[elementPath] = createRegistration(
            element, {
            id: elementId,
            groupId: parentGroup.id
          })
          break
        }
        case GROUP: {
          registerElements(
            element.elements, {
            parentGroup: {
              ...element,
              id: elementPath
            }
          })
          break
        }
      }
    }

    return container
  }

  /**
   * Resolves the registration with the given name.
   * This function is taken from here:
   * https://github.com/jeffijoe/awilix/blob/master/src/container.ts
   * and adapted for this module.
   *
   * @param {string | object} registration
   * The id of the registration or registration.
   *
   * @return {any}
   * Whatever was resolved.
   */
  function resolve(registration) {
    let currentRegistration = registration

    if (R.type(registration) === 'String') {
      currentRegistration = registrations[registration]
    }

    if (!H.isRegistration(currentRegistration)) {
      throw new SfiocResolutionError(registration, resolutionStack)
    }

    const { path, lifetime } = currentRegistration

    if (resolutionStack.includes(path)) {
      throw new SfiocResolutionError(
        path,
        resolutionStack,
        `'Cyclic dependencies detected.'`
      )
    }

    resolutionStack.push(path)

    let resolved, cached
    switch (lifetime) {
      case Lifetime.TRANSIENT: {
        resolved = resolver.resolve(currentRegistration)
        break
      }
      case Lifetime.SINGLETON: {
        cached = cache.get(path)
        if (!cached) {
          resolved = resolver.resolve(currentRegistration)
          cache.set(path, resolved)
        } else {
          resolved = cached
        }
        break
      }
      default: {
        throw new SfiocResolutionError(
          path,
          resolutionStack,
          `Unknown lifetime "${lifetime}"`
        )
      }
    }

    resolutionStack.pop()
    return resolved
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
        const groupRegistrations = {}

        for (let registration of Object.values(target)) {
          if (inputId == registration.id) {
            return resolve(registration)
          }

          if (inputId == registration.groupId) {
            groupRegistrations[registration.id] = registration
          }
        }

        if (!R.isEmpty(groupRegistrations)) {
          return proxify(groupRegistrations)
        }

        throw new SfiocResolutionError(inputId, resolutionStack)
      }
    })
  }
}

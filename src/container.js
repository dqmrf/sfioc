import R from 'ramda'
import t from './infra/tcomb'
import * as U from './utils'
import * as H from './helpers'
import { createGroup } from './group'
import { createResolver } from './resolver'
import { createRegistration } from './registration'
import { SfiocResolutionError, SfiocTypeError } from './errors'
import { Elements, Element, ContainerOptions, Group } from './structures'
import { filterOptions as extractComponentOptions } from './component'
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
 * Creates an Sfioc container instance.
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
    const fnName = 'Sfioc.register'
    const handler = t.createHandler({ description: fnName })
    const options = R.is(String, firstArg) ? thirdArg : secondArg
    const params = { [COMPONENT_OPTIONS]: options }

    if (R.isEmpty(firstArg)) throw argsError(firstArg)

    if (H.isGroup(firstArg)) {
      handler.handle(firstArg, {
        validator: Group,
        paramName: ParamNames.first
      })

      return _register(firstArg.elements, params)
    }

    switch (R.type(firstArg)) {
      case 'Object': {
        handler.handle(firstArg, {
          validator: Elements,
          paramName: ParamNames.first
        })

        return _register(firstArg, params)
      }
      case 'String': {
        if (H.isElement(secondArg)) {
          handler.handle(secondArg, {
            validator: Element,
            paramName: ParamNames.second
          })

          return _register({ [firstArg]: secondArg }, params)
        }

        switch (R.type(secondArg)) {
          case 'Object': {
            return register(firstArg, createGroup(secondArg), options)
          }
          case 'Array': {
            secondArg.forEach(subarg => register(firstArg, subarg, options))
            return container
          }
        }

        break
      }
      case 'Array': {
        if (R.type(firstArg[0]) === 'String') {
          for (let i = 0; i < firstArg.length; i+=2) {
            register(firstArg[i], firstArg[i+1], options)
          }
        } else {
          firstArg.forEach(subarg => register(subarg, options))
        }

        return container
      }
    }

    throw argsError(`'${firstArg}', '${secondArg}'`)

    function argsError(args) {
      return new SfiocTypeError({
        description: fnName,
        paramName: ParamNames.all,
        given: args,
        expected: '(object) | (array) | (string, object | array)'
      })
    }
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
   * @param {object} params
   * Params for internal recursive calls.
   *
   * @return {object}
   * The container.
   */
  function _register(elements, params = {}) {
    params = R.mergeRight({ parentGroup: {} }, params)

    const elementIds = Object.keys(elements)
    const { parentGroup } = params

    for (const elementId of elementIds) {
      const element = elements[elementId]
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
          _register(
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

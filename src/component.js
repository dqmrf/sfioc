import R from 'ramda'
import * as U from './utils'
import * as H from './helpers'
import t from './infra/tcomb'
import { ComponentOptions } from './structures'
import {
  ResolveAs,
  Lifetime,
  ElementTypes,
  ELEMENT,
  COMPONENT_OPTIONS
} from './constants'

const allowedOptions = [
  'dependsOn', 'resolveAs', 'lifetime'
]

/**
 * Prepares the dependency for registration.
 *
 * @param {any} target
 * Dependency for resolving.
 *
 * @param {object} options
 * Dependency options.
 *
 * @return {object}
 * Container 'COMPONENT' element that can be registered.
 */
export function createComponent(target, options = {}) {
  const component = {
    target,
    [COMPONENT_OPTIONS]: handleOptions(options)
  }

  Object.defineProperties(component, {
    '_sfType': {
      value: ELEMENT,
      enumerable: true,
      configurable: false,
      writable: false
    },
    '_sfElementType': {
      value: ElementTypes.COMPONENT,
      enumerable: true,
      configurable: false,
      writable: false
    }
  })

  return H.createBuildOptions(
    component,
    buildOptions,
    componentBuildOptions
  )
}

export function buildOptions() {
  return {
    resolveAs,
    setLifetime,
    updateComponentOptions,
    singleton: U.partial(setLifetime, Lifetime.SINGLETON),
    transient: U.partial(setLifetime, Lifetime.TRANSIENT),
    fn: U.partial(resolveAs, ResolveAs.FUNCTION),
    value: U.partial(resolveAs, ResolveAs.VALUE),
    class: U.partial(resolveAs, ResolveAs.CLASS)
  }

  function setLifetime(value) {
    return updateOptions(this, { lifetime: value })
  }

  function resolveAs(value) {
    return updateOptions(this, { resolveAs: value })
  }

  function updateComponentOptions(...options) {
    return updateOptions(this, [...options], true)
  }
}

function componentBuildOptions() {
  return { dependsOn }

  function dependsOn(value) {
    return updateOptions(this, { dependsOn: value })
  }
}

export function updateOptions(source, inputOptions, overwrite = false) {
  const newOptions = handleOptions(U.toArray(inputOptions))

  if (!source) return newOptions

  if (overwrite) {
    Object.assign(source[COMPONENT_OPTIONS], newOptions)
    return source
  }

  return {
    ...source,
    [COMPONENT_OPTIONS]: R.mergeRight(source[COMPONENT_OPTIONS], newOptions)
  }
}

export function handleOptions(...inputOptions) {
  const mergedOptions = inputOptions.reduce((acc, options) => {
    if (R.type(options) === 'Array') {
      options = handleOptions(...options)
    }
    return Object.assign({}, acc, options || {})
  }, {})

  t.handle(mergedOptions, {
    validator: ComponentOptions,
    paramName: COMPONENT_OPTIONS
  })

  return filterOptions(mergedOptions)
}

export function filterOptions(options) {
  const result = {}
  for (let optionName in options) {
    if (!allowedOptions.includes(optionName)) continue
    result[optionName] = options[optionName]
  }
  return result
}

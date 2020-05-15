import t from './infra/tcomb'
import * as H from './helpers'
import { ElementTypes, ELEMENT, COMPONENT_OPTIONS } from './constants'
import {
  buildOptions as componentBuildOptions,
  updateOptions as updateComponentOptions
} from './component'

/**
 * Prepares the group of dependencies (or groups) for registration.
 *
 * @param {object} elements
 * Dependencies wrapped with 'sfioc.component' or 'sfioc.group' wrappers.
 *
 * @param {object} options
 * Options for nested components.
 *
 * @return {object}
 * Container 'GROUP' element that can be registered.
 */
export function createGroup(elements, options = {}) {
  const group = {
    elements: t.handle(elements, {
      description: 'Sfioc.createGroup',
      paramName: 'elements',
      validator: t.Object,
    }).value,
    [COMPONENT_OPTIONS]: updateComponentOptions(null, options)
  }

  Object.defineProperties(group, {
    '_sfType': {
      value: ELEMENT,
      enumerable: true,
      configurable: false,
      writable: false
    },
    '_sfElementType': {
      value: ElementTypes.GROUP,
      enumerable: true,
      configurable: false,
      writable: false
    }
  })

  return H.createBuildOptions(group, componentBuildOptions)
}

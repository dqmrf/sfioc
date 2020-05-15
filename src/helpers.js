import { ElementTypes, ELEMENT, REGISTRATION } from './constants'

export function getElementType(element) {
  return isElement(element) ? element._sfElementType : undefined
}

export function isElement(element) {
  return element && element._sfType === ELEMENT
}

export function isComponent(element) {
  return element && element._sfElementType === ElementTypes.COMPONENT
}

export function isGroup(element) {
  return element && element._sfElementType === ElementTypes.GROUP
}

export function isRegistration(element) {
  return element && element._sfType === REGISTRATION
}

export function generateMapFromPath(name, dependency, options = {}) {
  const defaults = { separator: '.' }
  options = Object.assign({}, defaults, options)
  const subnames = name.split(options.separator)

  return generate(subnames)

  function generate(paths) {
    const currentPath = paths.shift()
    if (!currentPath) return dependency
    return { [currentPath]: generate(paths) }
  }
}

// TODO: It shouldn't be here.
export function createBuildOptions(source, ...optionsList) {
  const buildOptions = {}

  optionsList.forEach(options => {
    Object.assign(buildOptions, options())
  })

  return {
    ...source,
    ...buildOptions
  }
}

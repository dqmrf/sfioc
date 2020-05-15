import R from 'ramda'
import async from 'async'
import * as H from '../helpers'
import t from '../infra/tcomb'
import { ComponentDependencies } from '../structures'

export function classicResolver(registration, container) {
  let resolved

  async.seq(
    prepareTargetDependencies,
    resolveTargetDependencies
  )((err, resolvedDependencies) => {
    const { target } = registration

    if (err) {
      resolved = target()
    } else {
      resolved = target(resolvedDependencies)
    }
  })

  return resolved

  /**
   * Transforms dependencies of the given registration to an Array.
   *
   * @param {object} registration
   * The registration.
   *
   * @param {function} next
   * Callback to the next step.
   *
   * @return {array}
   * Adapted dependencies for further use.
   */
  function prepareTargetDependencies(next) {
    return prepare(registration.dependencies)

    function prepare(dependsOn) {
      if (!dependsOn || R.isEmpty(dependsOn)) return next(1)

      switch (R.type(dependsOn)) {
        case 'Array': {
          return next(null, dependsOn)
        }
        case 'String': {
          return next(null, [dependsOn])
        }
        case 'Function': {
          const selectors = generateDependenciesSelectors(registration)
          const dependencies = dependsOn(selectors)

          // This validation is necessary here, because we just called the
          // callback provided by the user, and injected the selectors inside.
          // Callback may return some unexpected value, and we need to validate it.
          t.handle(dependencies, {
            validator: ComponentDependencies,
            description: 'Sfioc.resolve',
            message: (`"dependsOn" callback must return the (String | Array)` +
            ` with dependency names, but got: (${R.type(dependencies)})`)
          })

          return prepare(dependencies, next)
        }
      }
    }
  }

  /**
   * 1. Resolves all of the given dependencies (for current registration).
   * 2. Creates a single map with all of the resolved dependencies.
   *
   * @param {array} dependencies
   * The registration to resolve.
   *
   * @param {function} next
   * Callback to the next step.
   *
   * @return {object}
   * Map with resolved dependencies that will be injected into the target function.
   */
  function resolveTargetDependencies(dependencies, next) {
    let resolvedDependencies = {}
    dependencies.forEach(dependency => {
      const resolvedDependency = container.resolve(dependency)
      const newDependency = H.generateMapFromPath(dependency, resolvedDependency)
      resolvedDependencies = R.mergeDeepRight(resolvedDependencies, newDependency)
    })
    return next(null, resolvedDependencies)
  }

  /**
   * Generate selectors with registrations to pass them to the 'dependsOn'
   * callback in the future.
   *
   * @param {object} registration
   * The registration to exclude.
   *
   * @return {object}
   * Ready selectors.
   */
  function generateDependenciesSelectors(exclude = {}) {
    let selectors = {}

    Object.values(container.registrations).forEach(registration => {
      const { id } = registration
      if (id === exclude.id) return
      const newSelector = H.generateMapFromPath(id, id)
      selectors = R.mergeDeepRight(selectors, newSelector)
    })

    return selectors
  }
}

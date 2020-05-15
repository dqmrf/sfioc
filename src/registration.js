import * as U from './utils'
import t from './infra/tcomb'
import { ResolveAs, REGISTRATION, COMPONENT_OPTIONS } from './constants'

/**
 * Creates the container registration.
 *
 * @param {object} component
 * Dependency wrapped with the 'sfioc.component' wrapper.
 *
 * @param {object} options
 * Registration options.
 *
 * @return {object}
 * Registration that will be pushed in the containers' 'registrations' storage.
 */
export function createRegistration(component, options = {}) {
  const targetHandler = t.createHandler({
    description: 'Sfioc.createRegistration',
    validator: t.Function,
    paramName: 'target'
  })

  const componentOpts = component[COMPONENT_OPTIONS]

  return {
    _sfType: REGISTRATION,
    id: options.id,
    groupId: options.groupId || null,
    target: prepareTarget(),
    lifetime: componentOpts.lifetime,
    dependencies: componentOpts.dependsOn || null,
    get path() {
      return U.joinRight([this.groupId, this.id])
    },
  }

  function prepareTarget() {
    const { target } = component

    switch(componentOpts.resolveAs) {
      case ResolveAs.FUNCTION:
        targetHandler.handle(target)
        return target
      case ResolveAs.CLASS:
        targetHandler.handle(target)
        return newClass
      case ResolveAs.VALUE:
        return () => target
    }

    function newClass() {
      return Reflect.construct(target, arguments)
    }
  }
}

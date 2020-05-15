import t from '../infra/tcomb'
import { InjectionModeEnums, ResolveAsEnums, LifetimeEnums } from './enums'

const ContainerOptions = t.declare('ContainerOptions')

ContainerOptions.define(t.struct({
  injectionMode: InjectionModeEnums,
  resolveAs: t.maybe(ResolveAsEnums),
  lifetime: t.maybe(LifetimeEnums)
}))

module.exports = {
  ContainerOptions
}

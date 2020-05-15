const t = require('../infra/tcomb');
const { InjectionModeEnums, ResolveAsEnums, LifetimeEnums } = require('./enums');

const ContainerOptions = t.declare('ContainerOptions');

ContainerOptions.define(t.struct({
  injectionMode: InjectionModeEnums,
  resolveAs: t.maybe(ResolveAsEnums),
  lifetime: t.maybe(LifetimeEnums)
}));

module.exports = {
  ContainerOptions
}

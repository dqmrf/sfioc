const t = require('../infra/tcomb');
const { InjectionModeEnums, ComponentTypesEnums, LifetimeEnums } = require('./enums');

const ContainerOptions = t.declare('ContainerOptions');

ContainerOptions.define(t.struct({
  injectionMode: InjectionModeEnums,
  type: t.maybe(ComponentTypesEnums),
  lifetime: t.maybe(LifetimeEnums)
}));

module.exports = {
  ContainerOptions
}

const t = require('tcomb-validation');
const { InjectionMode, Lifetime, ComponentTypes } = require('../constants');

const InjectionModeEnums = t.enums.of(Object.values(InjectionMode));
const ComponentTypesEnums = t.enums.of(Object.values(ComponentTypes));
const LifetimeEnums = t.enums.of(Object.values(Lifetime));

module.exports = {
  InjectionModeEnums,
  ComponentTypesEnums,
  LifetimeEnums
}

const t = require('tcomb-validation');
const { InjectionMode, Lifetime, ResolveAs } = require('../constants');

const InjectionModeEnums = t.enums.of(Object.values(InjectionMode));
const ResolveAsEnums = t.enums.of(Object.values(ResolveAs));
const LifetimeEnums = t.enums.of(Object.values(Lifetime));

module.exports = {
  InjectionModeEnums,
  ResolveAsEnums,
  LifetimeEnums
}

const t = require('tcomb-validation');
const { Lifetime, ComponentTypes } = require('../constants');

const ComponentTypesEnums = t.enums.of(Object.values(ComponentTypes));
const LifetimeEnums = t.enums.of(Object.values(Lifetime));

module.exports = {
  ComponentTypesEnums,
  LifetimeEnums
}

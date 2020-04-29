const t = require('tcomb-validation');
const { ComponentTypes, Lifetime } = require('../constants');
const { LifetimeEnums, ComponentTypesEnums } = require('./enums');

const ComponentOptions = t.struct({
  type: ComponentTypesEnums,
  lifetime: LifetimeEnums,
  dependsOn: t.maybe(t.union([t.String, t.Array]))
}, {
  name: 'SfiocComponent.options',
  defaultProps: {
    type: ComponentTypes.FUNCTION,
    lifetime: Lifetime.TRANSIENT
  }
});

const ComponentTargetFn = t.declare('SfiocComponent.target');
ComponentTargetFn.define(t.Function);

module.exports = {
  ComponentOptions,
  ComponentTargetFn
};

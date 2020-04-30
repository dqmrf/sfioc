const t = require('tcomb-validation');
const { ComponentTypes, Lifetime, ContainerElementTypes } = require('../constants');
const { LifetimeEnums, ComponentTypesEnums } = require('./enums');

const Component = t.declare('SfiocComponent');
const ComponentOptions = t.declare('SfiocComponent:options');
const ComponentTarget = t.declare('SfiocComponent:target');
const Group = t.declare('SfiocGroup');
const GroupComponents = t.declare('SfiocGroup:components');
const ComponentOrGroup = t.declare('SfiocComponent | SfiocGroup');

Component.define(t.struct({
  _sfType: t.refinement(t.String, t => t === ContainerElementTypes.COMPONENT),
  target: t.Function,
  options: ComponentOptions
}));

ComponentOptions.define(t.struct({
  type: ComponentTypesEnums,
  lifetime: LifetimeEnums,
  dependsOn: t.maybe(t.union([t.String, t.Array]))
}, {
  defaultProps: {
    type: ComponentTypes.FUNCTION,
    lifetime: Lifetime.TRANSIENT
  }
}));

ComponentTarget.define(t.refinement(t.Function, t.Function)); // TODO: create wrapper.

Group.define(t.struct({
  _sfType: t.refinement(t.String, t => t === ContainerElementTypes.GROUP),
  components: GroupComponents
}));

GroupComponents.define(t.dict(t.String, ComponentOrGroup));

ComponentOrGroup.define(t.refinement(t.Object, (obj) => {
  const componentResult = t.validate(obj, Component).isValid();
  const groupResult = t.validate(obj, Group).isValid();
  return componentResult || groupResult;
}));

module.exports = {
  Component,
  ComponentOptions,
  ComponentTarget,
  Group,
  GroupComponents,
  ComponentOrGroup
};

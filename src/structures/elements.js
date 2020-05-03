const t = require('tcomb-validation');
const { LifetimeEnums, ComponentTypesEnums } = require('./enums');
const { ElementTypes, ComponentTypes, Lifetime, SFIOC } = require('../constants');

const Component = t.declare('Component');
const ComponentOptions = t.declare('ComponentOptions');
const ComponentTarget = t.declare('ComponentTarget');
const Group = t.declare('Group');
const ComponentOrGroup = t.declare('Component | Group');
const Elements = t.declare('Elements');

Component.define(t.struct({
  _sfType: t.refinement(t.String, t => t === SFIOC.ELEMENT),
  _sfElementType: t.refinement(t.String, t => t === ElementTypes.COMPONENT),
  target: ComponentTarget,
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

ComponentTarget.define(t.Function);

Group.define(t.struct({
  _sfType: t.refinement(t.String, t => t === SFIOC.ELEMENT),
  _sfElementType: t.refinement(t.String, t => t === ElementTypes.GROUP),
  elements: Elements
}));

ComponentOrGroup.define(t.refinement(t.Object, (obj) => {
  const componentResult = t.validate(obj, Component).isValid();
  const groupResult = t.validate(obj, Group).isValid();
  return componentResult || groupResult;
}));

Elements.define(t.dict(t.String, ComponentOrGroup));

module.exports = {
  Component,
  ComponentOptions,
  ComponentTarget,
  Group,
  ComponentOrGroup,
  Elements
};

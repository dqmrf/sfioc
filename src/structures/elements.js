const t = require('../infra/tcomb');
const { LifetimeEnums, ComponentTypesEnums } = require('./enums');
const { ElementTypes, ComponentTypes, Lifetime, SFIOC } = require('../constants');

const ElementBase = t.declare('ElementBase');
const ComponentBase = t.declare('ComponentBase');
const Component = t.declare('Component');
const ComponentOptions = t.declare('ComponentOptions');
const GroupBase = t.declare('GroupBase');
const Group = t.declare('Group');
const GroupRecursive = t.declare('GroupRecursive');
const Element = t.declare('Component | Group');
const Elements = t.declare('Elements');

// Element.
ElementBase.define(t.struct({
  _sfType: t.refinement(t.String, t => t === SFIOC.ELEMENT)
}));

Element.define(t.refinement(t.Object, (obj) => {
  const componentResult = t.validate(obj, Component).isValid();
  const groupResult = t.validate(obj, Group).isValid();
  return componentResult || groupResult;
}));

Elements.define(t.dict(t.String, Element));

// Component.
ComponentBase.define(ElementBase.extend({
  _sfElementType: t.refinement(t.String, t => t === ElementTypes.COMPONENT)
}));

Component.define(ComponentBase.extend({
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

// Group.
GroupBase.define(ElementBase.extend({
  _sfElementType: t.refinement(t.String, t => t === ElementTypes.GROUP)
}));

Group.define(GroupBase.extend({
  elements: t.Object
}));

GroupRecursive.define(GroupBase.extend({
  elements: Elements
}));

module.exports = {
  ElementBase,
  Element,
  Elements,
  ComponentBase,
  Component,
  ComponentOptions,
  GroupBase,
  Group,
  GroupRecursive
};

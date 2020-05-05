const t = require('../infra/tcomb');
const { LifetimeEnums, ComponentTypesEnums } = require('./enums');
const { ElementTypes, ComponentTypes, Lifetime, SFIOC } = require('../constants');

const Element = t.declare('Component | Group');
const Elements = t.declare('Elements');
const ComponentBase = t.declare('ComponentBase');
const Component = t.declare('Component');
const ComponentProps = t.declare('ComponentProps');
const ComponentOptions = t.declare('ComponentOptions');
const GroupBase = t.declare('GroupBase');
const GroupProps = t.declare('GroupProps');
const GroupPropsRecursive = t.declare('GroupPropsRecursive');
const Group = t.declare('Group');
const GroupRecursive = t.declare('GroupRecursive');

const ElementIdentifier = t.refinement(t.String, x => x === SFIOC.ELEMENT);
const ComponentIdentifier = t.refinement(t.String, x => x === ElementTypes.COMPONENT);
const GroupIdentifier = t.refinement(t.String, x => x === ElementTypes.GROUP);

Element.define(t.refinement(t.Object, (obj) => {
  const componentResult = t.validate(obj, Component).isValid();
  const groupResult = t.validate(obj, Group).isValid();
  return componentResult || groupResult;
}));

Elements.define(t.dict(t.String, Element));

ComponentBase.define(t.struct({
  _sfType: ElementIdentifier,
  _sfElementType: ComponentIdentifier
}));

ComponentProps.define(t.struct({
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

Component.define(ComponentBase.extend(ComponentProps));

GroupBase.define(t.struct({
  _sfType: ElementIdentifier,
  _sfElementType: GroupIdentifier
}));

GroupProps.define(t.struct({ elements: t.Object }));

GroupPropsRecursive.define(t.struct({ elements: Elements }));

Group.define(GroupBase.extend(GroupProps));

GroupRecursive.define(GroupBase.extend(GroupPropsRecursive));

module.exports = {
  ElementIdentifier,
  Element,
  Elements,
  ComponentBase,
  ComponentProps,
  ComponentOptions,
  Component,
  GroupBase,
  GroupProps,
  GroupPropsRecursive,
  Group,
  GroupRecursive
};

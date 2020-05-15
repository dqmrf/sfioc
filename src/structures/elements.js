const R = require('ramda');
const t = require('../infra/tcomb');
const { LifetimeEnums, ResolveAsEnums } = require('./enums');
const { ElementTypes, ELEMENT, COMPONENT_OPTIONS } = require('../constants');

const Element = t.declare('Component | Group');
const Elements = t.declare('Elements');
const Component = t.declare('Component');
const ComponentOptions = t.declare('ComponentOptions');
const Group = t.declare('Group');

const ElementIdentifier = t.refinement(t.String, x => x === ELEMENT);
const ComponentIdentifier = t.refinement(t.String, x => x === ElementTypes.COMPONENT);
const GroupIdentifier = t.refinement(t.String, x => x === ElementTypes.GROUP);

Element.define(t.refinement(t.Object, (obj) => {
  const componentResult = t.validate(obj, Component).isValid();
  const groupResult = t.validate(obj, Group).isValid();
  return componentResult || groupResult;
}));

Elements.define(t.dict(t.String, Element));

const ComponentDependency = t.refinement(t.String, str => !R.isEmpty(str), 'Dependency');
const ComponentDependencies = t.union([ComponentDependency, t.list(ComponentDependency)]);

// TODO: ?DRY?
Component.define(t.struct({
  _sfType: ElementIdentifier,
  _sfElementType: ComponentIdentifier,
  [COMPONENT_OPTIONS]: ComponentOptions
}));

ComponentOptions.define(t.struct({
  resolveAs: t.maybe(ResolveAsEnums),
  lifetime: t.maybe(LifetimeEnums),
  dependsOn: t.maybe(t.union([ComponentDependencies, t.Function]))
}));

Group.define(t.struct({
  _sfType: ElementIdentifier,
  _sfElementType: GroupIdentifier,
  elements: t.Object,
  [COMPONENT_OPTIONS]: ComponentOptions
}));

module.exports = {
  Element,
  Elements,
  ComponentOptions,
  Component,
  ComponentDependencies,
  Group
};

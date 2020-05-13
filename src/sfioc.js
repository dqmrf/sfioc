const container = require('./container');
const { componentWrapper } = require('./component');
const { groupWrapper } = require('./group');
const { ComponentTypes, Lifetime, InjectionMode } = require('./constants');

module.exports = {
  ...container,
  component: componentWrapper,
  group: groupWrapper,
  InjectionMode,
  ComponentTypes,
  Lifetime
}

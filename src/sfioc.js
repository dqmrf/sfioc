const container = require('./container');
const { componentWrapper } = require('./component');
const { groupWrapper } = require('./group');
const { ComponentTypes, Lifetime } = require('./constants');

module.exports = {
  ...container,
  component: componentWrapper,
  group: groupWrapper,
  ComponentTypes,
  Lifetime
}

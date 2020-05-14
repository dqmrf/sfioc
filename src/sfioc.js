const container = require('./container');
const { createGroup } = require('./group');
const { createComponent } = require('./component');
const { ComponentTypes, Lifetime, InjectionMode } = require('./constants');

module.exports = {
  ...container,
  component: createComponent,
  group: createGroup,
  InjectionMode,
  ComponentTypes,
  Lifetime
}

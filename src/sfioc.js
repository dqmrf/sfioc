const container = require('./container');
const { createGroup } = require('./group');
const { createComponent } = require('./component');
const { ResolveAs, Lifetime, InjectionMode } = require('./constants');

module.exports = {
  ...container,
  component: createComponent,
  group: createGroup,
  InjectionMode,
  ResolveAs,
  Lifetime
}

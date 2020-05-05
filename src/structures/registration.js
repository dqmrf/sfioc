const t = require('tcomb-validation');
const { SFIOC } = require('../constants');
const { LifetimeEnums } = require('./enums');

const RegistrationBase = t.declare('RegistrationBase');
const RegistrationProps = t.declare('RegistrationProps');
const Registration = t.declare('Registration');

const RegistrationIdentifier = t.refinement(t.String, x => x === SFIOC.REGISTRATION);

RegistrationBase.define(t.struct({
  _sfType: RegistrationIdentifier
}));

RegistrationProps.define(t.struct({
  id: t.String,
  groupId: t.maybe(t.String),
  target: t.Function,
  lifetime: LifetimeEnums,
  dependencies: t.maybe(t.union([t.String, t.Array]))
}));

Registration.define(RegistrationBase.extend(RegistrationProps));

module.exports = {
  RegistrationBase,
  RegistrationProps,
  Registration
}

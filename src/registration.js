const { SFIOC } = require('./constants');

function createRegistration(component, options = {}) {
  return {
    _sfType: SFIOC.REGISTRATION,
    id: options.id,
    groupId: options.groupId || null,
    target: component.target,
    lifetime: component.options.lifetime,
    dependencies: component.options.dependsOn
  }
}

module.exports = {
  createRegistration
}

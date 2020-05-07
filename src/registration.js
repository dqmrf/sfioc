const { SFIOC } = require('./constants');

/**
 * Creates the container registration.
 *
 * @param {object} component
 * Dependency wrapped with the 'sfioc.component' wrapper.
 *
 * @param {object} options
 * Registration options.
 *
 * @return {object}
 * Registration that will be pushed in the containers' 'registrations' storage.
 */
function registration(component, options = {}) {
  return {
    _sfType: SFIOC.REGISTRATION,
    id: options.id,
    groupId: options.groupId || null,
    target: component.target,
    lifetime: component.options.lifetime,
    dependencies: component.options.dependsOn
  };
}

module.exports = {
  registration
}

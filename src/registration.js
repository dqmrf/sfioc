const t = require('./infra/tcomb');
const { SFIOC, ComponentTypes } = require('./constants');

const targetHandler = t.createHandler({
  description: 'Sfioc.Registration',
  validator: t.Function,
  paramName: 'target'
});

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
function createRegistration(component, options = {}) {
  return {
    _sfType: SFIOC.REGISTRATION,
    id: options.id,
    groupId: options.groupId || null,
    target: prepareTarget(),
    lifetime: component.lifetime,
    dependencies: component.dependsOn
  };

  function prepareTarget() {
    const { target, type } = component;

    switch(type) {
      case ComponentTypes.FUNCTION:
        targetHandler.handle(target);
        return target;
      case ComponentTypes.CLASS:
        targetHandler.handle(target);
        return newClass;
      case ComponentTypes.VALUE:
        return () => target;
    }

    function newClass() {
      return Reflect.construct(target, arguments);
    }
  }
}

module.exports = {
  createRegistration
};

const t = require('./infra/tcomb');
const { ComponentOptions } = require('./structures');
const { ComponentTypes, ElementTypes, SFIOC } = require('./constants');

const handler = t.createHandler({
  description: 'Sfioc.Component'
});

const optionsHandler = handler.extend({
  validator: ComponentOptions,
  paramName: 'options'
});

const targetHandler = handler.extend({
  validator: t.Function,
  paramName: 'target'
});

class Component {
  constructor(target, options = {}) {
    this._sfType = SFIOC.ELEMENT;
    this._sfElementType = ElementTypes.COMPONENT;
    this.options = optionsHandler.handle(options).value;
    this.target = prepareTarget(target, this.options.type);
  }
}

function prepareTarget(target, targetType) {
  switch(targetType) {
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

/**
 * Prepares the dependency for registration.
 *
 * @param {any} target
 * Dependency for resolving.
 *
 * @param {object} options
 * Dependency options.
 *
 * @return {object}
 * Container 'COMPONENT' element that can be registered.
 */
function componentWrapper(target, options) {
  return new Component(target, options);
}

module.exports = {
  componentWrapper,
  Component
};

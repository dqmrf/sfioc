const t = require('./infra/tcomb');
const { ComponentOptions } = require('./structures');
const { ComponentTypes, Lifetime, ElementTypes, SFIOC } = require('./constants');

const defaultOptions = {
  type: ComponentTypes.FUNCTION,
  lifetime: Lifetime.TRANSIENT
}

const handler = t.createHandler({
  description: 'Sfioc.Component'
});

const optionsHandler = handler.extend({
  validator: ComponentOptions,
  paramName: 'options',
  defaults: defaultOptions
});

class Component {
  constructor(target, options = {}) {
    options = optionsHandler.handle(options).value;

    Object.defineProperties(this, {
      '_sfType': {
        value: SFIOC.ELEMENT,
        enumerable: true,
        configurable: false,
        writable: false
      },
      '_sfElementType': {
        value: ElementTypes.COMPONENT,
        enumerable: true,
        configurable: false,
        writable: false
      }
    });

    this.target = target;
    this.type = options.type;
    this.lifetime = options.lifetime;
    this.dependsOn = options.dependsOn;
  }

  update(attr, value) {
    this[attr] = value;
    return this;
  }

  singleton() {
    return this.update('lifetime', Lifetime.SINGLETON);
  }

  transient() {
    return this.update('lifetime', Lifetime.TRANSIENT);
  }

  fn() {
    return this.update('type', ComponentTypes.FUNCTION);
  }

  value() {
    return this.update('type', ComponentTypes.VALUE);
  }

  class() {
    return this.update('type', ComponentTypes.CLASS);
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

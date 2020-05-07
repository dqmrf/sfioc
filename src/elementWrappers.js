const t = require('./infra/tcomb');
const { ComponentOptions } = require('./structures');
const { ComponentTypes, ElementTypes, SFIOC } = require('./constants');

function component(target, options = {}) {
  const handler = t.createHandler({
    description: 'Sfioc.component'
  });

  const optsHandler = handler.extend({
    validator: ComponentOptions,
    paramName: 'options'
  });

  const targetHandler = handler.extend({
    validator: t.Function,
    paramName: 'target'
  });

  options = optsHandler.handle(options).value;

  let preparedTarget;

  switch(options.type) {
    case ComponentTypes.FUNCTION: {
      targetHandler.handle(target);
      preparedTarget = target;
      break;
    }
    case ComponentTypes.CLASS: {
      targetHandler.handle(target);
      preparedTarget = newClass;
      break;
    }
    case ComponentTypes.VALUE: {
      preparedTarget = () => target;
      break;
    }
  }

  return {
    _sfType: SFIOC.ELEMENT,
    _sfElementType: ElementTypes.COMPONENT,
    target: preparedTarget,
    options
  };

  function newClass() {
    return Reflect.construct(target, arguments);
  }
}

function group(elements) {
  t.handle(elements, {
    validator: t.Object,
    description: 'Sfioc.group',
    paramName: 'elements'
  });

  return {
    _sfType: SFIOC.ELEMENT,
    _sfElementType: ElementTypes.GROUP,
    elements
  }
}

module.exports = {
  component,
  group
}

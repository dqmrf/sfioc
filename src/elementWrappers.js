const t = require('tcomb-validation');
const { Validator } = require('./utils');
const {
  SFIOC,
  ElementTypes,
  ComponentTypes
} = require('./constants');
const {
  ComponentOptions,
  ComponentTarget,
  Elements,
} = require('./structures');

function component(target, options = {}) {
  const v = new Validator('Sfioc.component');
  options = v.validate(options, ComponentOptions);
  let preparedTarget;

  switch(options.type) {
    case ComponentTypes.FUNCTION: {
      v.validate(target, ComponentTarget);
      preparedTarget = target;
      break;
    }
    case ComponentTypes.CLASS: {
      v.validate(target, ComponentTarget);
      preparedTarget = newClass;
      break;
    }
    case ComponentTypes.VALUE: {
      preparedTarget = () => target;
      break
    }
  }

  return {
    _sfType: SFIOC.ELEMENT,
    _sfElementType: ElementTypes.COMPONENT,
    target: preparedTarget,
    options
  }

  function newClass() {
    return Reflect.construct(target, arguments);
  }
}

function group(elements) {
  const v = new Validator('Sfioc.group');
  v.validate(elements, Elements);

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

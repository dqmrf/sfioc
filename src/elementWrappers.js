const t = require('tcomb-validation');
const { Validator } = require('./utils');
const { ComponentOptions, Elements } = require('./structures');
const {
  SFIOC,
  ElementTypes,
  ComponentTypes
} = require('./constants');

function component(target, options = {}) {
  const v = new Validator('Sfioc.component');
  options = v.validate([options, 'options'], ComponentOptions);
  let preparedTarget;

  switch(options.type) {
    case ComponentTypes.FUNCTION: {
      v.validate([target, 'target'], t.Function);
      preparedTarget = target;
      break;
    }
    case ComponentTypes.CLASS: {
      v.validate([target, 'target'], t.Function);
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
  v.validate([elements, 'elements'], Elements);

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

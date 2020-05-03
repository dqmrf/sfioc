const t = require('./infra/tcomb');
const { ComponentOptions, Elements } = require('./structures');
const {
  SFIOC,
  ElementTypes,
  ComponentTypes
} = require('./constants');

function component(target, options = {}) {
  const vd = t.createValidator('Sfioc.component');
  options = vd.handle([options, 'options'], ComponentOptions);
  let preparedTarget;

  switch(options.type) {
    case ComponentTypes.FUNCTION: {
      vd.handle([target, 'target'], t.Function);
      preparedTarget = target;
      break;
    }
    case ComponentTypes.CLASS: {
      vd.handle([target, 'target'], t.Function);
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
  const vd = t.createValidator('Sfioc.group');
  vd.handle([elements, 'elements'], Elements);

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

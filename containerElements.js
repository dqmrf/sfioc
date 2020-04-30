const t = require('tcomb-validation');
const { ContainerElementTypes, ComponentTypes } = require('./constants');
const { Validator } = require('./utils');
const {
  ComponentOptions,
  GroupComponents,
  ComponentTarget
} = require('./structures');

module.exports = {
  component,
  group
}

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
    _sfType: ContainerElementTypes.COMPONENT,
    target: preparedTarget,
    options
  }

  function newClass() {
    return Reflect.construct(target, arguments);
  }
}

function group(components) {
  const v = new Validator('Sfioc.group');
  v.validate(components, GroupComponents);

  return {
    _sfType: ContainerElementTypes.GROUP,
    components
  }
}

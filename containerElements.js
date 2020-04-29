const t = require('tcomb-validation');
const { Validator, validate } = require('./utils');
const {
  ComponentOptions,
  ComponentTargetFn
} = require('./structures').containerElements;
const { ContainerElementTypes, ComponentTypes } = require('./constants');

module.exports = {
  component,
  group
}

function component(inputTarget, inputOptions) {
  const v = new Validator('Sfioc.component');
  const options = v.validate(inputOptions, ComponentOptions);
  let target;

  switch(options.type) {
    case ComponentTypes.FUNCTION: {
      v.validate(inputTarget, ComponentTargetFn);
      target = inputTarget;
      break;
    }
    case ComponentTypes.CLASS: {
      v.validate(inputTarget, ComponentTargetFn);
      target = newClass;
      break;
    }
    case ComponentTypes.VALUE: {
      target = () => inputTarget;
      break
    }
  }

  return {
    _sfType: ContainerElementTypes.COMPONENT,
    target,
    options
  }

  function newClass() {
    return Reflect.construct(inputTarget, arguments);
  }
}

function group(components) {
  validate(components, t.Object);

  return {
    _sfType: ContainerElementTypes.GROUP,
    // TODO: empty object {} by default
    components
  }
}

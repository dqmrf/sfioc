const t = require('tcomb-validation');
const { validate } = require('./utils');
const { ComponentOptions } = require('./structures').containerElements;
const { ContainerElementTypes, ComponentTypes } = require('./constants');

module.exports = {
  component,
  group
}

function component(inputTarget, inputOptions) {
  const options = validate(inputOptions, ComponentOptions);
  let target;

  switch(options.type) {
    case ComponentTypes.FUNCTION: {
      // TODO: normal error messages
      validate(inputTarget, t.Function);
      target = inputTarget;
      break;
    }
    case ComponentTypes.CLASS: {
      // TODO: normal error messages
      validate(inputTarget, t.Function);
      target = newClass;
      break;
    }
    case ComponentTypes.VALUE: {
      target = () => inputTarget;
      break
    }
    default: {
      throw new Error(
        `'sfioc.component' 'type' must be one of these values: ${Object.values(ComponentTypes)}`
      );
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

const t = require('tcomb-validation');
const { SfiocTypeError } = require('../errors');
const { parseFunctionName } = require('./parsing');

class Validator {
  constructor(options = {}) {
    this.options = _setMainOption(options, 'callerDescription');
  }

  validate(subject, validator, inputOpts = {}) {
    inputOpts = _setMainOption(inputOpts, 'paramName');
    let newOpts = Object.assign({}, this.options, inputOpts);
    return validate(subject, validator, newOpts);
  }
}

// Function validates subject and returns it back merged with defaults.
function validate(subject, validator, inputOpts = {}) {
  inputOpts = _setMainOption(inputOpts, 'paramName');

  const defaultOpts = {
    callerDescription: undefined,
    paramName: validator.displayName || undefined,
    pathSeparator: '.'
  };
  const options = Object.assign({}, defaultOpts, inputOpts);
  const result = t.validate(subject, validator);

  if (!result.isValid()) {
    return _handleError(result);
  }

  return result.value;

  function _handleError(errResult) {
    const error = errResult.firstError();
    const { callerDescription, paramName, pathSeparator } = options;
    let paramPath, expectedValue, givenValue;

    try {
      const { path } = error;
      const valuePath = (path && path.length) > 0 ? path.join(pathSeparator) : '';

      paramPath = (paramName || '') +
                  ((paramName && !!valuePath.length) ? pathSeparator : '') +
                  valuePath;
      expectedValue = _getExpectedValue(error);
      givenValue = error.actual;
    } catch(e) {
      throw new Error(error.message);
    }

    throw new SfiocTypeError(
      callerDescription,
      paramPath,
      expectedValue,
      givenValue
    );
  }

  function _getExpectedValue(error) {
    let result;

    switch(validator.meta.kind) {
      case 'irreducible':
        result = parseFunctionName(error.expected.is).slice(2);
        break;
      default:
        result = error.expected.displayName;
    }

    return result;
  }
}

function _setMainOption(arg, mainOption) {
  if (typeof arg === 'object') return arg;
  return { [mainOption]: arg }
}

module.exports = {
  Validator,
  validate
}

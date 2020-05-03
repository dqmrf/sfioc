const t = require('tcomb-validation');
const { SfiocTypeError } = require('../errors');

class Validator {
  constructor(options = {}) {
    this.options = _setMainOption(options, 'callerName');
  }

  validate(paramConf, validator, inputOpts = {}) {
    let newOpts = Object.assign({}, this.options, inputOpts);
    return validate(paramConf, validator, newOpts);
  }
}

function validate(paramConf, validator, inputOpts = {}) {
  const param = paramConf[0];
  const defaultOpts = {
    callerName: '',
    paramName: paramConf[1] || '',
    expected: undefined,
    pathSeparator: '.',
  };
  let options = Object.assign({}, defaultOpts, inputOpts);

  const result = t.validate(param, validator);
  if (!result.isValid()) {
    return _handleError(result);
  }

  return result.value;

  function _handleError(errResult) {
    const error = errResult.firstError();
    console.log(validator);
    console.log(error);
    const {
      callerName,
      paramName,
      pathSeparator,
      expected
    } = options;
    let paramPath, expectedValue, givenValue;

    try {
      const { path } = error;
      const valuePath = (path && !!path.length) ? path.join(pathSeparator) : '';

      paramPath = (paramName ? `[${paramName}]` : '') +
                  ((paramName && !!valuePath.length) ? pathSeparator : '') +
                  valuePath;
      expectedValue = expected || error.expected.displayName || validator.displayName;
      console.log(paramName)
      givenValue = error.actual;
    } catch(e) {
      throw new Error(error.message);
    }

    throw new SfiocTypeError(
      callerName,
      paramPath,
      expectedValue,
      givenValue
    );
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

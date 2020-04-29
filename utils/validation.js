const t = require('tcomb-validation');
const { SfiocTypeError } = require('../errors');
const { parseFunctionName } = require('./parsing');

module.exports = {
  validate
}

// Function validates subject and returns it back merged with defaults.
function validate(subject, validator, inputOpts = {}) {
  if (typeof inputOpts === 'string') {
    inputOpts = { paramName: inputOpts }
  }

  const defaultOpts = {
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
    let paramPath, expectedValue, givenValue;

    try {
      const { path } = error;
      const { paramName, pathSeparator } = options;
      const valuePath = (path && path.length) > 0 ? path.join(pathSeparator) : '';

      paramPath = (paramName || '') +
                  ((paramName && !!valuePath.length) ? pathSeparator : '') +
                  valuePath;
      expectedValue = _getExpectedValue(error);
      givenValue = error.actual;
    } catch(e) {
      throw new Error(error.message);
    }

    throw new SfiocTypeError(null, paramPath, expectedValue, givenValue);
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

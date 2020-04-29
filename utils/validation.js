const t = require('tcomb-validation');
const { parseFunctionName } = require('./parsing');

module.exports = {
  validate
}

// Function validates subject and returns it back merged with defaults.
function validate(subject, validator, inputOpts = {}) {
  if (typeof inputOpts === 'string') {
    inputOpts = { subjectName: inputOpts }
  }

  const defaultOpts = {
    subjectName: validator.displayName || undefined,
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
    let adaptedMessage;

    try {
      const { path } = error;
      const { subjectName, pathSeparator } = options;
      const valuePath = (path && path.length) > 0 ? path.join(pathSeparator) : '';
      const subjectPath = (subjectName || '') +
                          ((subjectName && !!valuePath.length) ? pathSeparator : '') +
                          valuePath;

      const expectedValue = _getExpectedValue(error);

      adaptedMessage = `Invalid value "${error.actual}" supplied to: "${subjectPath}". ` +
                       `Expected: (${expectedValue})`;
    } catch(e) {
      throw new Error(error.message);
    }

    throw new Error(adaptedMessage);
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

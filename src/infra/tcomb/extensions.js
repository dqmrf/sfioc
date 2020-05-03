const { setMainOption } = require('../../utils');
const { SfiocTypeError } = require('../../errors');

module.exports = {
  createValidator(inputOpts) {
    const options = setMainOption(inputOpts, 'callerName');

    return {
      handle: handle.bind(this)
    }

    function handle(paramConf, validator, inputOpts = {}) {
      let newOpts = Object.assign({}, options, inputOpts);
      return this.handle(paramConf, validator, newOpts);
    }
  },
  handle(paramConf, validator, inputOpts = {}) {
    const param = paramConf[0];
    const defaultOpts = {
      callerName: '',
      paramName: paramConf[1] || '',
      expected: undefined,
      pathSeparator: '.',
    };
    let options = Object.assign({}, defaultOpts, inputOpts);

    const result = this.validate(param, validator);
    if (!result.isValid()) {
      return _handleError(result);
    }

    return result.value;

    function _handleError(errResult) {
      const error = errResult.firstError();
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
}

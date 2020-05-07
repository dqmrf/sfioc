const R = require('ramda');
const { SfiocTypeError } = require('../../errors');
const { setMainOption } = require('../../utils');

module.exports = {
  createHandler(inputOpts) {
    const options = inputOpts;

    return {
      handle: handle.bind(this),
      extend: extend.bind(this)
    }

    function handle(param, inputOpts = {}) {
      let newOpts = Object.assign({}, options, inputOpts);
      return this.handle(param, newOpts);
    }

    function extend(inputOpts = {}) {
      let newOpts = Object.assign({}, options, inputOpts);
      return this.createHandler(newOpts);
    }
  },
  handle(param, inputOpts = {}) {
    const defaultOpts = {
      validator: null,
      message: null,
      description: '',
      paramName: '',
      expected: null,
      throwError: true,
      pathSeparator: '.',
    };
    let options = Object.assign({}, defaultOpts, inputOpts);

    const result = this.validate(param, options.validator);
    if (!result.isValid()) {
      const errorMsg = handleError(result);
      if (options.throwError) throw new SfiocTypeError(errorMsg);
      return {
        isValid: false,
        error: { message: errorMsg },
        value: param
      };
    }

    return {
      isValid: true,
      error: null,
      value: paramWithDefaults()
    }

    function paramWithDefaults() {
      const { meta } = options.validator;

      if (meta.kind !== 'struct') return param;

      if (R.type(param) !== 'Object') {
        throw new SfiocTypeError(
          `In order to assign defaults to param it must be an Object. ` +
          `Got: ${R.type(param)}`
        );
      }

      const defaultProps = meta.defaultProps || {};
      return Object.assign({}, defaultProps, param);
    }

    function handleError(errResult) {
      const {
        validator,
        message,
        description,
        paramName,
        pathSeparator,
        expected
      } = options;

      if (message) return message;

      const error = errResult.firstError();
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
        return error.message;
      }

      return SfiocTypeError.generateMessage(
        description,
        paramPath,
        expectedValue,
        givenValue
      );
    }
  }
}

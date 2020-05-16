import R from 'ramda'
import { SfiocTypeError } from '../../errors'

module.exports = {
  createHandler(inputOpts) {
    const options = inputOpts

    return {
      handle: handle.bind(this),
      extend: extend.bind(this)
    }

    function handle(param, inputOpts = {}) {
      let newOpts = R.mergeRight(options, inputOpts)
      return this.handle(param, newOpts)
    }

    function extend(inputOpts = {}) {
      let newOpts = R.mergeRight(options, inputOpts)
      return this.createHandler(newOpts)
    }
  },
  handle(param, inputOpts = {}) {
    const defaultOpts = {
      defaults: null,
      validator: null,
      throwError: true,
      pathSeparator: '.',
      message: null,
      description: '',
      paramName: '',
      expected: null
    }

    const options = R.mergeRight(defaultOpts, inputOpts)
    const { validator } = options

    if (validator.meta.kind === 'struct') {
      let result = this.handle(param, {
        ...options,
        defaults: null,
        validator: this.Object
      })

      if (!result.isValid) return result

      if (options.defaults) {
        param = R.mergeRight(options.defaults, param)
      }
    }

    let result = this.validate(param, validator)
    if (!result.isValid()) {
      const errorMsg = handleError(result)
      if (options.throwError) throw new SfiocTypeError({ message: errorMsg })
      return {
        isValid: false,
        error: { message: errorMsg },
        value: param
      }
    }

    return {
      isValid: true,
      error: null,
      value: param
    }

    function handleError(errResult) {
      const {
        validator,
        message,
        description,
        paramName,
        pathSeparator,
        expected
      } = options

      const error = errResult.firstError()
      let paramPath, expectedValue

      try {
        const { path } = error
        const valuePath = (path && !!path.length) ? path.join(pathSeparator) : ''

        paramPath = (paramName ? `[${paramName}]` : '') +
                    ((paramName && !!valuePath.length) ? pathSeparator : '') +
                    valuePath

        expectedValue = expected || error.expected.displayName || validator.displayName
      } catch(e) {
        return error.message
      }

      return SfiocTypeError.generateMessage({
        message,
        description,
        paramName: paramPath,
        expected: expectedValue,
        given: error.actual
      })
    }
  }
}

const EOL = '\n'

export class ExtendableError extends Error {
  constructor(message) {
    super(message)

    Object.defineProperty(this, 'message', {
      enumerable: false,
      value: message,
    })

    Object.defineProperty(this, 'name', {
      enumerable: false,
      value: this.constructor.name,
    })

    Error.captureStackTrace(this, this.constructor)
  }
}

export class SfiocError extends ExtendableError {}

export class SfiocTypeError extends SfiocError {
  constructor(params = {}) {
    super(SfiocTypeError.generateMessage(params))
  }

  static generateMessage(params = {}) {
    const {
      message,
      complement,
      description,
      paramName,
      expected,
      given
    } = params

    let result = ''

    if (message) return message
    if (description) result += `${description}: `
    result += `Invalid value "${given}" supplied`
    result += (paramName ? ` to ${paramName}` : '') + '.'
    if (expected) result += ` Expected: (${expected}).`
    if (complement) result += EOL + complement

    return result
  }
}

export class SfiocResolutionError extends SfiocError {
  constructor(
    path,
    resolutionStack,
    inputMessage,
  ) {
    resolutionStack = resolutionStack.slice()
    resolutionStack.push(path)
    const resolutionPathString = resolutionStack.join(' -> ')

    let message = `Could not resolve '${path}'.`
    if (inputMessage) message += ` ${inputMessage}`
    message += EOL + EOL
    message += `Resolution path: ${resolutionPathString}`
    super(message)
  }
}

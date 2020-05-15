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
  // Params are present for ease of use.
  constructor(description, paramName, expectedType, givenType) {
    super(SfiocTypeError.generateMessage(...arguments))
  }

  static generateMessage(description, paramName, expectedType, givenType) {
    let message = ''

    // If the second argument is missing display only the first argument.
    if (description && paramName) {
      message += `${description}: `
    } else if (description && !paramName) {
      return description
    }

    message += `Invalid value "${givenType}" supplied to: "${paramName}".`
    message += ` Expected: (${expectedType})`
    return message
  }

  static assert(
    condition,
    description,
    paramName,
    expectedType,
    givenType
  ) {
    if (!condition) {
      throw new SfiocTypeError(
        description,
        paramName,
        expectedType,
        givenType
      )
    }
    return condition
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

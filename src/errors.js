const EOL = '\n';

class ExtendableError extends Error {
  constructor(message) {
    super(message);

    Object.defineProperty(this, 'message', {
      enumerable: false,
      value: message,
    });

    Object.defineProperty(this, 'name', {
      enumerable: false,
      value: this.constructor.name,
    });

    Error.captureStackTrace(this, this.constructor);
  }
}

class SfiocError extends ExtendableError {}

class SfiocTypeError extends SfiocError {
  constructor(
    funcDescription,
    paramName,
    expectedType,
    givenType
  ) {
    let message = '';
    if (funcDescription) message += `${funcDescription}: `;
    message += `Invalid value "${givenType}" supplied to: "${paramName}". Expected: (${expectedType})`;
    super(message);
  }
}

class SfiocResolutionError extends SfiocError {
  constructor(
    name,
    resolutionStack,
    inputMessage,
  ) {
    resolutionStack = resolutionStack.slice();
    resolutionStack.push(name);
    const resolutionPathString = resolutionStack.join(' -> ');
    let message = `Could not resolve '${name}'.`;
    if (inputMessage) message += ` ${inputMessage}`;
    message += EOL + EOL;
    message += `Resolution path: ${resolutionPathString}`;
    super(message);
  }
}

module.exports = {
  ExtendableError,
  SfiocError,
  SfiocTypeError,
  SfiocResolutionError
}

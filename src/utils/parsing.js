function parseFunctionName(arg) {
  let stringifiedFn;

  switch (typeof arg) {
    case 'function':
      stringifiedFn = arg.toString();
      break;
    case 'string':
      stringifiedFn = arg;
      break;
    default:
      throw new Error(`Invalid argument supplied to "parseFunctionName":` +
                      `"String" or "Function" expected.`);
  }

  let nameFromFnRegex = /^function\s?([^\s(]*)/;
  return stringifiedFn.match(nameFromFnRegex)[1];
}

module.exports = {
  parseFunctionName
}

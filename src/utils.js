import R from 'ramda'

export function partial(fn, ...args) {
  return function partiallyApplied() {
    return fn.apply(this, args)
  }
}

export function catchError(targetFn, inputOpts = {}) {
  const defaults = { message: null, throwError: false }
  const options = R.mergeRight(defaults, inputOpts)

  try {
    targetFn()
  } catch(err) {
    return err
  }

  if (!options.throwError) return null
  throw new Error(options.message || `This function was supposed to throw and error:\n${targetFn}`)
}

export function joinRight(paths, separator = '.') {
  return paths.reduce((acc, path, index) => {
    if (index + 1 === paths.length) separator = ''
    if (path) return acc + path + separator
    return acc
  }, '')
}

export function setMainOption(arg, mainOption) {
  if (typeof arg === 'object') return arg
  return { [mainOption]: arg }
}

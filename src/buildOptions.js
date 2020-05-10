const { ComponentTypes, Lifetime } = require('./constants');

/**
 * Adds configuration methods to the given container element.
 *
 * @param {object} element
 * Container element.
 *
 * @param {function} update
 * Updating strategy provided by the element.
 *
 * @return {object}
 * Container element with options added.
 */
function createBuildOptions(element, update) {
  const result = {
    ...element,
    setLifetime,
    singleton: partial(setLifetime, Lifetime.SINGLETON),
    transient: partial(setLifetime, Lifetime.TRANSIENT),
    fn: partial(setType, ComponentTypes.FUNCTION),
    value: partial(setType, ComponentTypes.VALUE),
    class: partial(setType, ComponentTypes.CLASS)
  }

  return result;

  function setLifetime(value) {
    return update(this, 'lifetime', value);
  }

  function setType(value) {
    return update(this, 'type', value);
  }
}

function partial(fn, ...args) {
  return function partiallyApplied() {
    return fn.apply(this, args);
  }
}

module.exports = {
  createBuildOptions
}

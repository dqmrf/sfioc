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
function createBuildOptions(source, updateSource) {
  const builder = {
    ...source,
    setLifetime,
    singleton: partial(setLifetime, Lifetime.SINGLETON),
    transient: partial(setLifetime, Lifetime.TRANSIENT),
    fn: partial(setType, ComponentTypes.FUNCTION),
    value: partial(setType, ComponentTypes.VALUE),
    class: partial(setType, ComponentTypes.CLASS)
  }

  return builder;

  function setLifetime(value) {
    return update('lifetime', value);
  }

  function setType(value) {
    return update('type', value);
  }

  function update(name, value) {
    updateSource(source, { [name]: value });
    return builder;
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

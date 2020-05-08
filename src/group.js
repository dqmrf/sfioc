const t = require('./infra/tcomb');
const { ElementTypes, SFIOC } = require('./constants');

const handler = t.createHandler({
  description: 'Sfioc.Group'
});

const elementsHandler = handler.extend({
  validator: t.Object,
  paramName: 'elements'
});

class Group {
  constructor(elements) {
    this._sfType = SFIOC.ELEMENT;
    this._sfElementType = ElementTypes.GROUP;
    this.elements = elementsHandler.handle(elements).value;
  }
}

/**
 * Prepares the group of dependencies (or groups) for registration.
 *
 * @param {object} elements
 * Dependencies wrapped with 'sfioc.component' or 'sfioc.group' wrappers.
 *
 * @return {object}
 * Container 'GROUP' element that can be registered.
 */
function groupWrapper(elements) {
  return new Group(elements);
}

module.exports = {
  groupWrapper,
  Group
};

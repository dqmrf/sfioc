const t = require('tcomb-validation');
const { ComponentOrGroup } = require('./containerElements');

const ContainerElements = t.declare('SfiocContainer:elements');

ContainerElements.define(t.dict(t.String, ComponentOrGroup));

module.exports = {
  ContainerElements
}

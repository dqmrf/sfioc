const ELEMENT = 'ELEMENT';
const REGISTRATION = 'REGISTRATION';

const InjectionMode = {
  CLASSIC: 'CLASSIC',
  PROXY: 'PROXY'
}

const ElementTypes = {
  COMPONENT: 'COMPONENT',
  GROUP: 'GROUP'
}

const ComponentTypes = {
  FUNCTION: 'FUNCTION',
  CLASS: 'CLASS',
  VALUE: 'VALUE'
}

const Lifetime = {
  TRANSIENT: 'TRANSIENT',
  SINGLETON: 'SINGLETON'
}

const COMPONENT_OPTIONS = 'componentOptions';

module.exports = {
  ELEMENT,
  REGISTRATION,
  InjectionMode,
  ElementTypes,
  ComponentTypes,
  Lifetime,
  COMPONENT_OPTIONS
}

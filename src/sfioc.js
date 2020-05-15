import { createContainer } from './container'
import { createGroup as group }  from './group'
import { createComponent as component }  from './component'
import { ResolveAs, Lifetime, InjectionMode } from './constants'

module.exports = {
  createContainer,
  component,
  group,
  ResolveAs,
  Lifetime,
  InjectionMode
}

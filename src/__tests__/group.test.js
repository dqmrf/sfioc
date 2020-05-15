import { catchError } from '../utils'
import { SfiocTypeError } from '../errors'
import { createGroup } from '../group'
import { createComponent } from '../component'
import {
  ElementTypes,
  Lifetime,
  ResolveAs,
  ELEMENT,
  COMPONENT_OPTIONS
} from '../constants'

const stubTarget = jest.fn()
const stubComponent = (options) => createComponent(stubTarget, options)

describe('create', () => {
  it('returns a group with its components', () => {
    const component1 = stubComponent()
    const component2 = stubComponent()
    const group = createGroup({ component1, component2 })

    expect(typeof group).toBe('object')
    expect(group._sfType).toEqual(ELEMENT)
    expect(group._sfElementType).toEqual(ElementTypes.GROUP)
    expect(group.elements).toStrictEqual({ component1, component2 })
  })

  it('deals with nested groups', () => {
    const nestedComponent1 = stubComponent()
    const nestedComponent2 = stubComponent()
    const component1 = stubComponent()
    const component2 = stubComponent()

    const nestedGroup = createGroup({
      nestedComponent1,
      nestedComponent2
    })

    const group = createGroup({
      component1,
      component2,
      nestedGroup
    })

    expect(typeof group).toBe('object')
    expect(group.elements).toStrictEqual({
      component1,
      component2,
      nestedGroup
    })
  })

  it('throws an SfiocTypeError when called without params', () => {
    const error = catchError(() => createGroup())

    expect(error).toBeTruthy()
    expect(error).toBeInstanceOf(SfiocTypeError)
    expect(error.message).toContain('undefined')
  })

  it('throws an SfiocTypeError when called with wrong params', () => {
    const error = catchError(() => createGroup('wrongParam'))

    expect(error).toBeTruthy()
    expect(error).toBeInstanceOf(SfiocTypeError)
    expect(error.message).toContain('wrongParam')
  })

  it(`lets me setup '${COMPONENT_OPTIONS}' without builders`, () => {
    const component1 = stubComponent().value().class()
    const component2 = stubComponent().class()

    const group = createGroup({
      component1,
      component2
    }, {
      lifetime: Lifetime.SINGLETON,
      resolveAs: ResolveAs.FUNCTION
    })

    expect(group[COMPONENT_OPTIONS].lifetime).toEqual(Lifetime.SINGLETON)
    expect(group[COMPONENT_OPTIONS].resolveAs).toEqual(ResolveAs.FUNCTION)
  })
})

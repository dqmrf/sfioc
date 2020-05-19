import { catchError } from '../utils'
import { SfiocTypeError } from '../errors'
import { createComponent } from '../component'
import {
  ResolveAs,
  Lifetime,
  ElementTypes,
  ELEMENT,
  COMPONENT_OPTIONS
} from '../constants'

const stubTarget = jest.fn()

describe('create', () => {
  it('returns a component', () => {
    const options = {
      resolveAs: ResolveAs.FUNCTION,
      lifetime: Lifetime.SINGLETON,
      dependsOn: ['dependency1', 'dependency2']
    }
    const component = createComponent(stubTarget, options)

    expect(typeof component).toBe('object')
    expect(component._sfType).toEqual(ELEMENT)
    expect(component._sfElementType).toEqual(ElementTypes.COMPONENT)
    expect(component[COMPONENT_OPTIONS]).toStrictEqual(options)
  })

  it(`removes unnecessary options, thay don't break anything`, () => {
    const options = {
      resolveAs: ResolveAs.FUNCTION,
      lifetime: Lifetime.SINGLETON,
      someShit: 'javascript'
    }
    const component = createComponent(stubTarget, options)
    const componentOpts = component[COMPONENT_OPTIONS]

    expect(componentOpts.resolveAs).toEqual(ResolveAs.FUNCTION)
    expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON)
    expect(componentOpts.someShit).toEqual(undefined)
  })

  it('does not throw any error when called without params', () => {
    const component = createComponent()

    expect(component).toBeTruthy()
    expect(component.target).toEqual(undefined)
  })

  it('throws an SfiocTypeError when the lifetime is unknown', () => {
    const error = catchError(() => {
      createComponent(stubTarget, { lifetime: '228' })
    })

    expect(error).toBeTruthy()
    expect(error).toBeInstanceOf(SfiocTypeError)
    expect(error.message).toContain('228')
  })

  it(`throws an SfiocTypeError when the 'resolveAs' is unknown`, () => {
    const error = catchError(() => {
      createComponent(stubTarget, { resolveAs: '228' })
    })

    expect(error).toBeTruthy()
    expect(error).toBeInstanceOf(SfiocTypeError)
    expect(error.message).toContain('228')
  })
})

describe('builder options', () => {
  it(`lets me call a chain of builders`, () => {
    const component = createComponent(class Lol {}).singleton().class()
    const componentOpts = component[COMPONENT_OPTIONS]

    expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON)
    expect(componentOpts.resolveAs).toEqual(ResolveAs.CLASS)
  })

  describe('dependsOn', () => {
    it(`sets component dependencies`, () => {
      const dependencies = ['ukraine', 'eniarku']
      const component = createComponent(stubTarget).dependsOn(dependencies)
      const componentOpts = component[COMPONENT_OPTIONS]

      expect(componentOpts.dependsOn).toEqual(dependencies)
    })

    it(`overrides component dependencies`, () => {
      const dependencies = ['cow', 'pig']
      const component = createComponent(stubTarget, {
        dependsOn: ['orange', 'apple']
      }).dependsOn(dependencies)
      const componentOpts = component[COMPONENT_OPTIONS]

      expect(componentOpts.dependsOn).toEqual(dependencies)
    })
  })

  describe('singleton', () => {
    it(`changes component 'lifetime' to 'SINGLETON'`, () => {
      const component = createComponent(stubTarget).singleton()
      const componentOpts = component[COMPONENT_OPTIONS]

      expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON)
    })
  })

  describe('transient', () => {
    it(`changes component 'lifetime' to 'TRANSIENT'`, () => {
      const component = createComponent(stubTarget)
                          .singleton()
                          .transient()
      const componentOpts = component[COMPONENT_OPTIONS]

      expect(componentOpts.lifetime).toEqual(Lifetime.TRANSIENT)
    })
  })

  describe('fn', () => {
    let valueGetter = () => 228

    it(`changes component 'resolveAs' to 'FUNCTION'`, () => {
      const component = createComponent(valueGetter).fn()
      const componentOpts = component[COMPONENT_OPTIONS]

      expect(componentOpts.resolveAs).toEqual(ResolveAs.FUNCTION)
    })
  })

  describe('value', () => {
    let value = 228

    it(`changes component 'resolveAs' to 'VALUE'`, () => {
      const component = createComponent(value).value()
      const componentOpts = component[COMPONENT_OPTIONS]

      expect(componentOpts.resolveAs).toEqual(ResolveAs.VALUE)
    })
  })

  describe('class', () => {
    class TestClass { getValue() { return 228 } }

    it(`changes component 'resolveAs' to 'CLASS'`, () => {
      const component = createComponent(TestClass).class()
      const componentOpts = component[COMPONENT_OPTIONS]

      expect(componentOpts.resolveAs).toEqual(ResolveAs.CLASS)
    })
  })
})

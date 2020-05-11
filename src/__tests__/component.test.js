const { catchError } = require('../utils');
const { SfiocTypeError } = require('../errors');
const { componentWrapper } = require('../component');
const {
  ComponentTypes, Lifetime, ElementTypes, SFIOC, COMPONENT_OPTIONS
} = require('../constants');

const stubTarget = jest.fn();

describe('componentWrapper', () => {
  it('returns a component', () => {
    const options = {
      type: ComponentTypes.FUNCTION,
      lifetime: Lifetime.SINGLETON,
      dependsOn: ['dependency1', 'dependency2']
    }
    const component = componentWrapper(stubTarget, options);

    expect(typeof component).toBe('object');
    expect(component._sfType).toEqual(SFIOC.ELEMENT);
    expect(component._sfElementType).toEqual(ElementTypes.COMPONENT);
    expect(component[COMPONENT_OPTIONS]).toStrictEqual(options)
  });

  it('replaces missing options with defaults (without options passed)', () => {
    const component = componentWrapper(stubTarget);
    const componentOpts = component[COMPONENT_OPTIONS];

    expect(componentOpts.type).toEqual(ComponentTypes.FUNCTION);
    expect(componentOpts.lifetime).toEqual(Lifetime.TRANSIENT);
  });

  it('replaces missing options with defaults (with some options passed)', () => {
    const component = componentWrapper(stubTarget, {
      lifetime: Lifetime.SINGLETON
    });
    const componentOpts = component[COMPONENT_OPTIONS];

    expect(componentOpts.type).toEqual(ComponentTypes.FUNCTION);
    expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON);
  });

  it(`removes unnecessary options, thay don't break anything`, () => {
    const options = {
      type: ComponentTypes.FUNCTION,
      lifetime: Lifetime.SINGLETON,
      someShit: 'javascript'
    }
    const component = componentWrapper(stubTarget, options);
    const componentOpts = component[COMPONENT_OPTIONS];

    expect(componentOpts.type).toEqual(ComponentTypes.FUNCTION);
    expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON);
    expect(componentOpts.someShit).toEqual(undefined);
  });

  it('does not throw any error when called without params', () => {
    const component = componentWrapper();

    expect(component).toBeTruthy();
    expect(component.target).toEqual(undefined);
  });

  it('throws an SfiocTypeError when the lifetime is unknown', () => {
    const error = catchError(() => {
      componentWrapper(stubTarget, { lifetime: '228' });
    });

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('228');
  });

  it('throws an SfiocTypeError when the type is unknown', () => {
    const error = catchError(() => {
      componentWrapper(stubTarget, { type: '228' });
    });

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('228');
  });
});

describe('builder options', () => {
  it(`lets me call a chain of builders`, () => {
    const component = componentWrapper(class Lol {}).singleton().class();
    const componentOpts = component[COMPONENT_OPTIONS];

    expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON);
    expect(componentOpts.type).toEqual(ComponentTypes.CLASS);
  });

  describe('singleton', () => {
    it(`changes component 'lifetime' to 'SINGLETON'`, () => {
      const component = componentWrapper(stubTarget).singleton();
      const componentOpts = component[COMPONENT_OPTIONS];
      expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON);
    });
  });

  describe('transient', () => {
    it(`changes component 'lifetime' to 'TRANSIENT'`, () => {
      const component = componentWrapper(stubTarget)
                          .singleton()
                          .transient();
      const componentOpts = component[COMPONENT_OPTIONS];
      expect(componentOpts.lifetime).toEqual(Lifetime.TRANSIENT);
    });
  });

  describe('fn', () => {
    let valueGetter = () => 228;

    it(`changes component 'type' to 'FUNCTION'`, () => {
      const component = componentWrapper(valueGetter).fn();
      const componentOpts = component[COMPONENT_OPTIONS];
      expect(componentOpts.type).toEqual(ComponentTypes.FUNCTION);
    });
  });

  describe('value', () => {
    let value = 228;

    it(`changes component 'type' to 'VALUE'`, () => {
      const component = componentWrapper(value).value();
      const componentOpts = component[COMPONENT_OPTIONS];
      expect(componentOpts.type).toEqual(ComponentTypes.VALUE);
    });
  });

  describe('class', () => {
    class TestClass { getValue = () => 228 }

    it(`changes component 'type' to 'CLASS'`, () => {
      const component = componentWrapper(TestClass).class();
      const componentOpts = component[COMPONENT_OPTIONS];
      expect(componentOpts.type).toEqual(ComponentTypes.CLASS);
    });
  });
});

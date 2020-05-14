const { catchError } = require('../utils');
const { SfiocTypeError } = require('../errors');
const { createComponent } = require('../component');
const {
  ComponentTypes,
  Lifetime,
  ElementTypes,
  ELEMENT,
  COMPONENT_OPTIONS
} = require('../constants');

const stubTarget = jest.fn();

describe('create', () => {
  it('returns a component', () => {
    const options = {
      type: ComponentTypes.FUNCTION,
      lifetime: Lifetime.SINGLETON,
      dependsOn: ['dependency1', 'dependency2']
    }
    const component = createComponent(stubTarget, options);

    expect(typeof component).toBe('object');
    expect(component._sfType).toEqual(ELEMENT);
    expect(component._sfElementType).toEqual(ElementTypes.COMPONENT);
    expect(component[COMPONENT_OPTIONS]).toStrictEqual(options)
  });

  it('replaces missing options with defaults (without options passed)', () => {
    const component = createComponent(stubTarget);
    const componentOpts = component[COMPONENT_OPTIONS];

    expect(componentOpts.type).toEqual(ComponentTypes.FUNCTION);
    expect(componentOpts.lifetime).toEqual(Lifetime.TRANSIENT);
  });

  it('replaces missing options with defaults (with some options passed)', () => {
    const component = createComponent(stubTarget, {
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
    const component = createComponent(stubTarget, options);
    const componentOpts = component[COMPONENT_OPTIONS];

    expect(componentOpts.type).toEqual(ComponentTypes.FUNCTION);
    expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON);
    expect(componentOpts.someShit).toEqual(undefined);
  });

  it('does not throw any error when called without params', () => {
    const component = createComponent();

    expect(component).toBeTruthy();
    expect(component.target).toEqual(undefined);
  });

  it('throws an SfiocTypeError when the lifetime is unknown', () => {
    const error = catchError(() => {
      createComponent(stubTarget, { lifetime: '228' });
    });

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('228');
  });

  it('throws an SfiocTypeError when the type is unknown', () => {
    const error = catchError(() => {
      createComponent(stubTarget, { type: '228' });
    });

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('228');
  });
});

describe('builder options', () => {
  it(`lets me call a chain of builders`, () => {
    const component = createComponent(class Lol {}).singleton().class();
    const componentOpts = component[COMPONENT_OPTIONS];

    expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON);
    expect(componentOpts.type).toEqual(ComponentTypes.CLASS);
  });

  describe('dependsOn', () => {
    it(`sets component dependencies`, () => {
      const dependencies = ['ukraine', 'eniarku']
      const component = createComponent(stubTarget).dependsOn(dependencies);
      const componentOpts = component[COMPONENT_OPTIONS];

      expect(componentOpts.dependsOn).toEqual(dependencies);
    });

    it(`overrides component dependencies`, () => {
      const dependencies = ['cow', 'pig'];
      const component = createComponent(stubTarget, {
        dependsOn: ['orange', 'apple']
      }).dependsOn(dependencies);
      const componentOpts = component[COMPONENT_OPTIONS];

      expect(componentOpts.dependsOn).toEqual(dependencies);
    });
  });

  describe('singleton', () => {
    it(`changes component 'lifetime' to 'SINGLETON'`, () => {
      const component = createComponent(stubTarget).singleton();
      const componentOpts = component[COMPONENT_OPTIONS];

      expect(componentOpts.lifetime).toEqual(Lifetime.SINGLETON);
    });
  });

  describe('transient', () => {
    it(`changes component 'lifetime' to 'TRANSIENT'`, () => {
      const component = createComponent(stubTarget)
                          .singleton()
                          .transient();
      const componentOpts = component[COMPONENT_OPTIONS];

      expect(componentOpts.lifetime).toEqual(Lifetime.TRANSIENT);
    });
  });

  describe('fn', () => {
    let valueGetter = () => 228;

    it(`changes component 'type' to 'FUNCTION'`, () => {
      const component = createComponent(valueGetter).fn();
      const componentOpts = component[COMPONENT_OPTIONS];

      expect(componentOpts.type).toEqual(ComponentTypes.FUNCTION);
    });
  });

  describe('value', () => {
    let value = 228;

    it(`changes component 'type' to 'VALUE'`, () => {
      const component = createComponent(value).value();
      const componentOpts = component[COMPONENT_OPTIONS];

      expect(componentOpts.type).toEqual(ComponentTypes.VALUE);
    });
  });

  describe('class', () => {
    class TestClass { getValue = () => 228 }

    it(`changes component 'type' to 'CLASS'`, () => {
      const component = createComponent(TestClass).class();
      const componentOpts = component[COMPONENT_OPTIONS];

      expect(componentOpts.type).toEqual(ComponentTypes.CLASS);
    });
  });
});

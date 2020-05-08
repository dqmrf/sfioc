const { catchError } = require('../utils');
const { SfiocTypeError } = require('../errors');
const { componentWrapper, Component } = require('../component');
const { ComponentTypes, Lifetime, ElementTypes, SFIOC } = require('../constants');

const stubTarget = jest.fn();

const componentPrivateAttrs = {
  _sfType: SFIOC.ELEMENT,
  _sfElementType: ElementTypes.COMPONENT,
}

describe('componentWrapper', () => {
  it('returns a component', () => {
    const componentOpts = {
      type: ComponentTypes.FUNCTION,
      lifetime: Lifetime.SINGLETON,
      dependsOn: ['dependency1', 'dependency2']
    }
    const component = componentWrapper(stubTarget, componentOpts);

    expect(typeof component).toBe('object');
    expect(component).toEqual(expect.any(Component));
    expect(component).toEqual({
      ...componentPrivateAttrs,
      target: stubTarget,
      options: componentOpts
    });
  });

  it('replaces missing options with defaults (without options passed)', () => {
    const component = componentWrapper(stubTarget);

    expect(typeof component.options).toBe('object')
    expect(component.options).toStrictEqual({
      type: ComponentTypes.FUNCTION,
      lifetime: Lifetime.TRANSIENT
    });
  });

  it('replaces missing options with defaults (with some options passed)', () => {
    const component = componentWrapper(stubTarget, {
      lifetime: Lifetime.SINGLETON
    });

    expect(typeof component.options).toBe('object')
    expect(component.options).toStrictEqual({
      type: ComponentTypes.FUNCTION,
      lifetime: Lifetime.SINGLETON
    });
  });

  it('wraps target function correctly', () => {
    const component = componentWrapper(() => 228, {
      type: ComponentTypes.FUNCTION
    });

    expect(typeof component.target).toBe('function');
    expect(component.target()).toBe(228);
  });

  it('wraps target class correctly', () => {
    class TestClass { getSomeValue = () => 228; }

    const component = componentWrapper(TestClass, {
      type: ComponentTypes.CLASS
    })

    expect(typeof component.target).toBe('function')
    expect(new component.target().getSomeValue()).toBe(228);
  });

  it('wraps target value correctly', () => {
    const component = componentWrapper(228, {
      type: ComponentTypes.VALUE
    });

    expect(typeof component.target).toBe('function')
    expect(component.target()).toBe(228);
  });

  it('throws an SfiocTypeError when called without params', () => {
    const error = catchError(() => componentWrapper());

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('undefined');
  });

  it('throws an SfiocTypeError when the target doesn\'t match its type', () => {
    const error = catchError(() => {
      componentWrapper('wrongTarget', {
        type: ComponentTypes.FUNCTION
      });
    });

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('wrongTarget');
  });

  it('throws an SfiocTypeError when the lifetime is unknown', () => {
    const error = catchError(() => {
      componentWrapper(stubTarget, { lifetime: '228' })
    });

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('228');
  });

  it('throws an SfiocTypeError when the type is unknown', () => {
    const error = catchError(() => {
      componentWrapper(stubTarget, { type: '228' })
    });

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('228');
  });
});

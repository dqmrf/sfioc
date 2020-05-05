const wrappers = require('../elementWrappers');
const { SfiocTypeError } = require('../errors');
const { ComponentTypes, Lifetime, SFIOC, ElementTypes } = require('../constants');

const componentWrapper = wrappers.component;
const groupWrapper = wrappers.group;

const stubTarget = () => {};
const defaultComponentOpts = {
  type: ComponentTypes.FUNCTION,
  lifetime: Lifetime.TRANSIENT
}
const defaultComponent = {
  _sfType: SFIOC.ELEMENT,
  _sfElementType: ElementTypes.COMPONENT,
  target: stubTarget,
  options: defaultComponentOpts
}

describe('component wrapper', () => {
  it('returns component', () => {
    const componentOpts = {
      type: ComponentTypes.FUNCTION,
      lifetime: Lifetime.SINGLETON,
      dependsOn: ['dependency1', 'dependency2']
    }
    const component = componentWrapper(stubTarget, componentOpts);

    expect(typeof component).toBe('object');
    expect(component).toStrictEqual({
      _sfType: SFIOC.ELEMENT,
      _sfElementType: ElementTypes.COMPONENT,
      target: stubTarget,
      options: componentOpts
    });
  });

  it('replaces missing options with defaults', () => {
    const component = componentWrapper(stubTarget, {
      lifetime: Lifetime.SINGLETON
    });

    expect(typeof component.options).toBe('object')
    expect(component.options).toStrictEqual({
      type: ComponentTypes.FUNCTION,
      lifetime: Lifetime.SINGLETON
    });
  });

  it('accepts a single dependency as a string', () => {
    const component = componentWrapper(stubTarget, { dependsOn: 'dependency' });

    expect(component.options.dependsOn).toStrictEqual(['dependency']);
  });

  it('wraps target function correctly', () => {
    const component = componentWrapper(() => 228, {
      type: ComponentTypes.FUNCTION
    });

    expect(typeof component.target).toBe('function')
    expect(component.target()).toBe(228);
  });

  it('wraps target class correctly', () => {
    class TestClass {
      getSomeValue() {
        return 228;
      }
    }
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
    let error;
    try {
      componentWrapper();
    } catch(e) {
      error = e;
    }

    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('undefined');
  });

  it('throws an SfiocTypeError when the target doesn\'t match its type', () => {
    let error;
    try {
      componentWrapper('wrongTarget', {
        type: ComponentTypes.FUNCTION
      });
    } catch(e) {
      error = e;
    }

    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('wrongTarget');
  });

  it('throws an SfiocTypeError when the lifetime is unknown', () => {
    let error;
    try {
      componentWrapper(stubTarget, { lifetime: '228' });
    } catch(e) {
      error = e;
    }

    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('228');
  });

  it('throws an SfiocTypeError when the type is unknown', () => {
    let error;
    try {
      componentWrapper(stubTarget, { type: '228' })
    } catch(e) {
      error = e;
    }

    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('228');
  });
});

describe('group wrapper', () => {
  it('returns group with its components', () => {
    const component1 = componentWrapper(stubTarget);
    const component2 = componentWrapper(stubTarget);

    const group = groupWrapper({
      component1,
      component2
    });

    expect(typeof group).toBe('object');
    expect(group).toStrictEqual({
      _sfType: SFIOC.ELEMENT,
      _sfElementType: ElementTypes.GROUP,
      elements: {
        component1: defaultComponent,
        component2: defaultComponent
      }
    });
  });

  it('deal with nested groups', () => {
    const nestedComponent1 = componentWrapper(stubTarget);
    const nestedComponent2 = componentWrapper(stubTarget);
    const component1 = componentWrapper(stubTarget);
    const component2 = componentWrapper(stubTarget);

    const nestedGroup = groupWrapper({
      nestedComponent1,
      nestedComponent2
    });

    const group = groupWrapper({
      component1,
      component2,
      nestedGroup
    });

    expect(typeof group).toBe('object');
    expect(group).toStrictEqual({
      _sfType: SFIOC.ELEMENT,
      _sfElementType: ElementTypes.GROUP,
      elements: {
        component1: defaultComponent,
        component2: defaultComponent,
        nestedGroup: {
          _sfType: SFIOC.ELEMENT,
          _sfElementType: ElementTypes.GROUP,
          elements: {
            nestedComponent1: defaultComponent,
            nestedComponent2: defaultComponent
          }
        }
      }
    });
  });

  it('throws an SfiocTypeError when called without params', () => {
    let error;
    try {
      groupWrapper();
    } catch(e) {
      error = e;
    }

    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('undefined');
  });

  it('throws an SfiocTypeError when called with wrong params', () => {
    let error;
    try {
      groupWrapper('wrongParam');
    } catch(e) {
      error = e;
    }

    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('wrongParam');
  });
});

const { catchError } = require('../utils');
const { SfiocTypeError } = require('../errors');
const { groupWrapper } = require('../group');
const { componentWrapper } = require('../component');
const {
  ElementTypes,
  Lifetime,
  ComponentTypes,
  ELEMENT,
  COMPONENT_OPTIONS
} = require('../constants');

const stubTarget = jest.fn();

describe('groupWrapper', () => {
  it('returns a group with its components', () => {
    const component1 = componentWrapper(stubTarget);
    const component2 = componentWrapper(stubTarget);
    const group = groupWrapper({ component1, component2 });

    expect(typeof group).toBe('object');
    expect(group._sfType).toEqual(ELEMENT);
    expect(group._sfElementType).toEqual(ElementTypes.GROUP);
    expect(group.elements).toStrictEqual({
      component1,
      component2
    });
  });

  it('deals with nested groups', () => {
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
    expect(group.elements).toStrictEqual({
      component1,
      component2,
      nestedGroup
    });
  });

  it('throws an SfiocTypeError when called without params', () => {
    const error = catchError(() => groupWrapper());

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('undefined');
  });

  it('throws an SfiocTypeError when called with wrong params', () => {
    const error = catchError(() => groupWrapper('wrongParam'));

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('wrongParam');
  });

  it(`lets me setup '${COMPONENT_OPTIONS}' without builders`, () => {
    const component1 = componentWrapper(228).value().class();
    const component2 = componentWrapper(stubTarget).class();

    const group = groupWrapper({
      component1,
      component2
    }, {
      lifetime: Lifetime.SINGLETON,
      type: ComponentTypes.FUNCTION
    });

    expect(group[COMPONENT_OPTIONS].lifetime).toEqual(Lifetime.SINGLETON);
    expect(group[COMPONENT_OPTIONS].type).toEqual(ComponentTypes.FUNCTION);
  });
});

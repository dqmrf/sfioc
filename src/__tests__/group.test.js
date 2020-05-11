const { catchError } = require('../utils');
const { SfiocTypeError } = require('../errors');
const { groupWrapper } = require('../group');
const { componentWrapper } = require('../component');
const { ElementTypes, Lifetime, ComponentTypes, SFIOC } = require('../constants');

const stubTarget = jest.fn();

describe('groupWrapper', () => {
  it('returns a group with its components', () => {
    const component1 = componentWrapper(stubTarget);
    const component2 = componentWrapper(stubTarget);
    const group = groupWrapper({ component1, component2 });

    expect(typeof group).toBe('object');
    expect(group._sfType).toEqual(SFIOC.ELEMENT);
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

  describe('builder options', () => {
    it(`changes all nested components attributes properly`, () => {
      const nestedComponent1 = componentWrapper(stubTarget).transient();
      const nestedComponent2 = componentWrapper(stubTarget).transient();
      const component1 = componentWrapper(stubTarget).transient();
      const component2 = componentWrapper(stubTarget).transient();

      const nestedGroup = groupWrapper({ nestedComponent1, nestedComponent2 }).transient();
      const group = groupWrapper({ component1, component2, nestedGroup }).singleton();

      const elements = group.elements;
      const nestedElements = elements.nestedGroup.elements;

      expect(elements.component1.lifetime).toEqual(Lifetime.SINGLETON);
      expect(elements.component2.lifetime).toEqual(Lifetime.SINGLETON);
      expect(nestedElements.nestedComponent1.lifetime).toEqual(Lifetime.SINGLETON);
      expect(nestedElements.nestedComponent2.lifetime).toEqual(Lifetime.SINGLETON);
    });

    it(`don't mutate other options of nested elements`, () => {
      const nestedComponent1 = componentWrapper(class Lol {}).class();
      const nestedComponent2 = componentWrapper(stubTarget);
      const component1 = componentWrapper(228).value();
      const component2 = componentWrapper(stubTarget);

      const nestedGroup = groupWrapper({ nestedComponent1, nestedComponent2 }).transient();
      const group = groupWrapper({ component1, component2, nestedGroup }).singleton();

      const elements = group.elements;
      const nestedElements = elements.nestedGroup.elements;

      expect(elements.component1.type).toEqual(ComponentTypes.VALUE);
      expect(nestedElements.nestedComponent1.type).toEqual(ComponentTypes.CLASS);
    });
  });
});

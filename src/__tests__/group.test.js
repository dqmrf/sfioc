const { catchError } = require('../utils');
const { SfiocTypeError } = require('../errors');
const { groupWrapper, Group } = require('../group');
const { componentWrapper } = require('../component');
const { ElementTypes, SFIOC } = require('../constants');

const stubTarget = jest.fn();

const groupPrivateAttrs = {
  _sfType: SFIOC.ELEMENT,
  _sfElementType: ElementTypes.GROUP,
}

describe('groupWrapper', () => {
  it('returns a group with its components', () => {
    const component1 = componentWrapper(stubTarget);
    const component2 = componentWrapper(stubTarget);
    const group = groupWrapper({ component1, component2 });

    expect(typeof group).toBe('object');
    expect(group).toEqual(expect.any(Group));
    expect(group).toEqual({
      ...groupPrivateAttrs,
      elements: {
        component1,
        component2
      }
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
    expect(group).toEqual(expect.any(Group));
    expect(group).toEqual({
      ...groupPrivateAttrs,
      elements: {
        component1,
        component2,
        nestedGroup: {
          ...groupPrivateAttrs,
          elements: {
            nestedComponent1,
            nestedComponent2
          }
        }
      }
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
});

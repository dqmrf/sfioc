const { catchError } = require('../utils');
const { SfiocTypeError } = require('../errors');
const { createRegistration } = require('../registration');
const { componentWrapper } = require('../component');
const { ComponentTypes, Lifetime, REGISTRATION } = require('../constants');

const stubTarget = jest.fn();

describe('createRegistration', () => {
  it('returns a registration', () => {
    const options = {
      type: ComponentTypes.FUNCTION,
      lifetime: Lifetime.SINGLETON,
      dependsOn: ['dependency1', 'dependency2']
    }
    const component = componentWrapper(stubTarget, options);
    const registration = createRegistration(component);

    expect(typeof registration).toBe('object');
    expect(registration._sfType).toEqual(REGISTRATION);
    expect(registration.lifetime).toEqual(options.lifetime);
    expect(registration.dependencies).toEqual(options.dependsOn);
  });

  it('wraps components target function correctly', () => {
    const component = componentWrapper(() => 228).fn();
    const registration = createRegistration(component);

    expect(typeof registration.target).toBe('function');
    expect(registration.target()).toBe(228);
  });

  it('wraps components target value correctly', () => {
    const component = componentWrapper(228).value();
    const registration = createRegistration(component);

    expect(typeof registration.target).toBe('function');
    expect(registration.target()).toBe(228);
  });

  it('wraps components target class correctly', () => {
    class TestClass { getValue = () => 228; }
    const component = componentWrapper(TestClass).class();
    const registration = createRegistration(component);

    expect(typeof registration.target).toBe('function');
    expect(new registration.target().getValue()).toBe(228);
  });

  it('throws an SfiocTypeError when the component target doesn\'t match its type', () => {
    const component = componentWrapper('wrongTarget').fn();
    const error = catchError(() => createRegistration(component));

    expect(error).toBeTruthy();
    expect(error).toBeInstanceOf(SfiocTypeError);
    expect(error.message).toContain('wrongTarget');
  });
});

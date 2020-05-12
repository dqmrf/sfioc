const { catchError } = require('../utils');
const { createContainer } = require('../container');
const { groupWrapper } = require('../group');
const { componentWrapper } = require('../component');
const { SfiocResolutionError, SfiocTypeError } = require('../errors');
const { ComponentTypes, Lifetime, COMPONENT_OPTIONS } = require('../constants');

const testValue = 228;
const testValueGetterProvider = ({ testValue }) => () => testValue;
const stubTarget = jest.fn();

describe('createContainer', () => {
  it('returns an object', () => {
    let container = createContainer();
    expect(typeof container).toBe('object');
  });
});

describe('container', () => {
  it('lets me register components and resolve them', () => {
    let container = createContainer();

    const testValueComponent = componentWrapper(testValue, {
      type: ComponentTypes.VALUE
    });

    const getTestValueComponent = componentWrapper(
      testValueGetterProvider, {
      type: ComponentTypes.FUNCTION,
      dependsOn: ['testValue']
    });

    container.register({
      testValue: testValueComponent,
      getTestValue: getTestValueComponent
    });

    const getTestValue = container.resolve('getTestValue');
    expect(getTestValue).toBeTruthy();
    expect(getTestValue()).toBe(testValue);
  });


  it('lets me register components with groups and resolve them', () => {
    let container = createContainer();

    let store = {
      loggedIn: false,
      anotherValue: false
    }

    const loginOperation = () => {
      return () => {
        store.loggedIn = true;
      }
    }

    const anotherOperation = () => {
      return () => {
        store.anotherValue = true;
      }
    }

    const app = ({ operations }) => ({
      run() {
        operations.login();
        if (store.loggedIn) {
          operations.another();
        }
      }
    });

    container.register({
      app: componentWrapper(app, {
        dependsOn: ['operations.login', 'operations.another']
      }),
      operations: groupWrapper({
        login: componentWrapper(loginOperation),
        another: componentWrapper(anotherOperation)
      })
    });

    const resolvedApp = container.resolve('app');
    expect(resolvedApp).toBeTruthy();
    expect(typeof resolvedApp).toBe('object');
    expect(resolvedApp).toHaveProperty('run');

    resolvedApp.run();
    expect(store).toStrictEqual({
      loggedIn: true,
      anotherValue: true
    });
  });

  describe('register', () => {
    let container;
    beforeEach(() => {
      container = createContainer();
    });

    it('lets me register registrations in multiple calls', () => {
      container.register({
        testValue: componentWrapper(testValue, {
          type: ComponentTypes.VALUE
        })
      });

      container.register({
        getTestValue: componentWrapper(
          testValueGetterProvider, {
          type: ComponentTypes.FUNCTION,
          dependsOn: ['testValue']
        })
      });

      expect(Object.keys(container.registrations).length).toBe(2);

      const getTestValue = container.resolve('getTestValue');
      expect(getTestValue).toBeTruthy();
      expect(getTestValue()).toBe(testValue);
    });

    it('accepts a single dependency as a string', () => {
      container.register({
        testValue: componentWrapper(testValue, {
          type: ComponentTypes.VALUE
        }),
        getTestValue: componentWrapper(
          testValueGetterProvider, {
          type: ComponentTypes.FUNCTION,
          dependsOn: 'testValue'
        })
      });

      expect(Object.keys(container.registrations).length).toBe(2);

      const getTestValue = container.resolve('getTestValue');
      expect(getTestValue).toBeTruthy();
      expect(getTestValue()).toBe(testValue);
    });

    it('supports classes', () => {
      class TestApp {
        constructor({ repo }) {
          this.repo = repo;
        }

        stuff() {
          return this.repo.getStuff();
        }
      }

      class TestRepo {
        getStuff() {
          return 'stuff';
        }
      }

      container.register({
        app: componentWrapper(TestApp, {
          type: ComponentTypes.CLASS,
          dependsOn: ['repo']
        }),
        repo: componentWrapper(TestRepo, {
          type: ComponentTypes.CLASS
        })
      })

      const app = container.resolve('app');
      expect(app.stuff()).toBe('stuff');
    });

    it(`overwrites '${COMPONENT_OPTIONS}' of groups nested components`, () => {
      const component1 = componentWrapper(stubTarget).transient();
      const component2 = componentWrapper(stubTarget).transient();

      const group = groupWrapper(
        { component1, component2 },
        { lifetime: Lifetime.SINGLETON }
      );

      container.register({ group });
      const { registrations } = container;

      Object.values(registrations).forEach(registration => {
        expect(registration.lifetime).toEqual(Lifetime.SINGLETON);
      });
    });

    it(`overwrites '${COMPONENT_OPTIONS}' of groups nested groups with its components`, () => {
      const nestedComponent1 = componentWrapper(stubTarget).transient();
      const nestedComponent2 = componentWrapper(stubTarget).class();
      const component1 = componentWrapper(stubTarget).value().singleton();
      const component2 = componentWrapper(stubTarget).class().singleton();

      const nestedGroup = groupWrapper({
        nestedComponent1,
        nestedComponent2
      }).transient();

      const group = groupWrapper({
        component1,
        component2,
        nestedGroup
      }).singleton().fn();

      container.register({ group });
      const { registrations } = container;

      Object.values(registrations).forEach(registration => {
        expect(registration.lifetime).toEqual(Lifetime.SINGLETON);
      });
    });

    it(`overwrites '${COMPONENT_OPTIONS}' of groups nested components`, () => {
      const component1 = componentWrapper(stubTarget).transient();
      const component2 = componentWrapper(stubTarget).transient();

      const group = groupWrapper(
        { component1, component2 },
        { lifetime: Lifetime.SINGLETON }
      );

      container.register({ group });
      const { registrations } = container;

      Object.values(registrations).forEach(registration => {
        expect(registration.lifetime).toEqual(Lifetime.SINGLETON);
      });
    });

    it(`lets global '${COMPONENT_OPTIONS}' overwrite '${COMPONENT_OPTIONS}' of all of it's children`, () => {
      container = createContainer({ lifetime: Lifetime.SINGLETON });

      const nestedComponent1 = componentWrapper(stubTarget).transient();
      const nestedComponent2 = componentWrapper(stubTarget).class();
      const component1 = componentWrapper(stubTarget).value().singleton();
      const component2 = componentWrapper(stubTarget).class().transient();

      const nestedGroup = groupWrapper({
        nestedComponent1,
        nestedComponent2
      });

      const group = groupWrapper({
        component1,
        component2,
        nestedGroup
      }).transient().fn();

      container.register({ group });
      const { registrations } = container;

      Object.values(registrations).forEach(registration => {
        expect(registration.lifetime).toEqual(Lifetime.SINGLETON);
      });
    });
  });

  describe('resolve', () => {
    let container;
    beforeEach(() => {
      container = createContainer();
    });

    describe('dealing with "dependsOn" callback', () => {
      it('calls the callback once', () => {
        let callback = jest.fn((DP) => (DP.testValue));

        container.register({
          testValue: componentWrapper(testValue, {
            type: ComponentTypes.VALUE
          }),
          getTestValue: componentWrapper(
            testValueGetterProvider, {
            type: ComponentTypes.FUNCTION,
            dependsOn: callback
          })
        });

        container.resolve('getTestValue');

        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls.length).toBe(1);
      });

      it('injects selectors (all but its own) inside callback', () => {
        let callback = jest.fn((DP) => (DP.testValue));

        container.register({
          testValue: componentWrapper(testValue, {
            type: ComponentTypes.VALUE
          }),
          getTestValue: componentWrapper(
            testValueGetterProvider, {
            type: ComponentTypes.FUNCTION,
            dependsOn: callback
          })
        });

        container.resolve('getTestValue');
        expect(callback).toHaveBeenCalledWith({
          testValue: "testValue"
        });
      });

      it('resolve dependencies if callback returns a String with a single existing dependency', () => {
        container.register({
          testValue: componentWrapper(testValue, {
            type: ComponentTypes.VALUE
          }),
          getTestValue: componentWrapper(
            testValueGetterProvider, {
            type: ComponentTypes.FUNCTION,
            dependsOn: (DP) => (DP.testValue)
          })
        });

        const getTestValue = container.resolve('getTestValue');
        expect(getTestValue).toBeTruthy();
        expect(getTestValue()).toBe(testValue);
      });

      it('resolve dependencies if callback returns an Array with a single existing dependency', () => {
        container.register({
          testValue: componentWrapper(testValue, {
            type: ComponentTypes.VALUE
          }),
          getTestValue: componentWrapper(
            testValueGetterProvider, {
            type: ComponentTypes.FUNCTION,
            dependsOn: (DP) => ([DP.testValue])
          })
        });

        const getTestValue = container.resolve('getTestValue');
        expect(getTestValue).toBeTruthy();
        expect(getTestValue()).toBe(testValue);
      });

      it('throws an SfiocTypeError if callback returns an Function', () => {
        container.register({
          getTestValue: componentWrapper(
            testValueGetterProvider, {
            dependsOn: () => (() => {})
          })
        });

        const error = catchError(() => {
          container.resolve('getTestValue');
        });

        expect(error).toBeInstanceOf(SfiocTypeError);
        expect(error.message).toContain('Function');
      });

      it('does not inject any dependencies if callback returns an empty Array. ', () => {
        let callback = jest.fn();

        container.register({
          getTestValue: componentWrapper(callback, {
            dependsOn: () => ([])
          })
        });

        container.resolve('getTestValue');

        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls).toContainEqual([]);
      });

      it('throws an SfiocTypeError if callback returns an Array with empty values', () => {
        container.register({
          getTestValue: componentWrapper(
            testValueGetterProvider, {
            dependsOn: () => (['', ''])
          })
        });

        const error = catchError(() => {
          container.resolve('getTestValue');
        });

        expect(error).toBeInstanceOf(SfiocTypeError);
        expect(error.message).toContain('Array');
      });
    });

    it('throws an SfiocResolutionError when there are unregistered dependencies', () => {
      const error = catchError(() => {
        container.resolve('nope');
      });

      expect(error).toBeInstanceOf(SfiocResolutionError);
      expect(error.message).toMatch(/nope/i);
    });

    it('throws an SfiocResolutionError with a resolution path when resolving an unregistered dependency', () => {
      const first = ({ second }) => second;
      const second = ({ third }) => third;
      const third = ({ unregistered }) => unregistered;

      container.register({
        first: componentWrapper(first, { dependsOn: 'second' }),
        second: componentWrapper(second, { dependsOn: 'third' }),
        third: componentWrapper(third, { dependsOn: 'unregistered' }),
      });

      const error = catchError(() => {
        container.resolve('first');
      });

      expect(error).toBeInstanceOf(SfiocResolutionError);
      expect(error.message).toContain('first -> second -> third');
    });

    describe('lifetime', () => {
      let root, store, acc;
      beforeEach(() => {
        root = ({ accumulator, store }) => {
          accumulator.increment();
          return store.getCounter();
        };

        store = ({ accumulator }) => ({
          getCounter() { return accumulator.getCounter(); }
        });

        acc = () => {
          let counter = 0;
          return {
            increment() { return ++counter },
            getCounter() { return counter }
          }
        }
      });

      it('supports singleton lifetime', () => {
        container.register({
          root: componentWrapper(root, {
            dependsOn: ['accumulator', 'store']
          }),
          store: componentWrapper(store, {
            dependsOn: 'accumulator'
          }),
          accumulator: componentWrapper(acc, {
            lifetime: Lifetime.SINGLETON
          })
        });

        const counter = container.resolve('root');
        expect(counter).toBe(1);
      });

      it('supports transient lifetime', () => {
        container.register({
          root: componentWrapper(root, {
            dependsOn: ['accumulator', 'store']
          }),
          store: componentWrapper(store, {
            dependsOn: 'accumulator'
          }),
          accumulator: componentWrapper(acc, {
            lifetime: Lifetime.TRANSIENT
          })
        });

        const counter = container.resolve('root');
        expect(counter).toBe(0);
      });
    });

    it('throws an SfiocResolutionError when there are cyclic dependencies', () => {
      const first = ({ second }) => second;
      const second = ({ third }) => third;
      const third = ({ second }) => second;

      container.register({
        first: componentWrapper(first, { dependsOn: 'second' }),
        second: componentWrapper(second, { dependsOn: 'third' }),
        third: componentWrapper(third, { dependsOn: 'second' }),
      });

      const error = catchError(() => {
        container.resolve('first');
      });

      expect(error).toBeInstanceOf(SfiocResolutionError);
      expect(error.message).toContain('first -> second -> third -> second');
    });
  });
});

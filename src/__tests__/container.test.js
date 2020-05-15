const { catchError } = require('../utils');
const { createContainer } = require('../container');
const { createGroup } = require('../group');
const { createComponent } = require('../component');
const { SfiocResolutionError, SfiocTypeError } = require('../errors');
const {
  InjectionMode,
  ResolveAs,
  Lifetime,
  COMPONENT_OPTIONS
} = require('../constants');

const testValue = 228;
const getTestValue = jest.fn(({ testValue }) => () => testValue);
const stubTarget = jest.fn();
const stubComponent = (options) => createComponent(stubTarget, options);

describe('createContainer', () => {
  it('returns an object', () => {
    let container = createContainer();
    expect(typeof container).toBe('object');
  });
});

describe('container', () => {
  it('lets me register components and resolve them', () => {
    let container = createContainer();

    container.register({
      testValue: createComponent(testValue, {
        resolveAs: ResolveAs.VALUE
      }),
      getTestValue: createComponent(getTestValue, {
        resolveAs: ResolveAs.FUNCTION,
        dependsOn: ['testValue']
      })
    });

    const rootFactory = container.resolve('getTestValue');

    expect(rootFactory).toBeTruthy();
    expect(rootFactory()).toBe(testValue);
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
      app: createComponent(app, {
        dependsOn: ['operations.login', 'operations.another']
      }),
      operations: createGroup({
        login: createComponent(loginOperation),
        another: createComponent(anotherOperation)
      })
    });

    const rootFactory = container.resolve('app');

    expect(rootFactory).toBeTruthy();
    expect(typeof rootFactory).toBe('object');
    expect(rootFactory).toHaveProperty('run');

    rootFactory.run();

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
        testValue: createComponent(testValue, {
          resolveAs: ResolveAs.VALUE
        })
      });

      container.register({
        getTestValue: createComponent(getTestValue, {
          resolveAs: ResolveAs.FUNCTION,
          dependsOn: ['testValue']
        })
      });

      expect(Object.keys(container.registrations).length).toBe(2);

      const rootFactory = container.resolve('getTestValue');

      expect(rootFactory).toBeTruthy();
      expect(rootFactory()).toBe(testValue);
    });

    it('accepts a single dependency as a string', () => {
      container.register({
        testValue: createComponent(testValue, {
          resolveAs: ResolveAs.VALUE
        }),
        getTestValue: createComponent(getTestValue, {
          resolveAs: ResolveAs.FUNCTION,
          dependsOn: 'testValue'
        })
      });

      expect(Object.keys(container.registrations).length).toBe(2);

      const rootFactory = container.resolve('getTestValue');

      expect(rootFactory).toBeTruthy();
      expect(rootFactory()).toBe(testValue);
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
        app: createComponent(TestApp, {
          resolveAs: ResolveAs.CLASS,
          dependsOn: ['repo']
        }),
        repo: createComponent(TestRepo, {
          resolveAs: ResolveAs.CLASS
        })
      })

      const rootFactory = container.resolve('app');
      expect(rootFactory.stuff()).toBe('stuff');
    });

    it(`overwrites '${COMPONENT_OPTIONS}' of groups nested components properly`, () => {
      const component1 = stubComponent();
      const component2 = stubComponent().transient();

      const group = createGroup(
        { component1, component2 },
        { lifetime: Lifetime.SINGLETON }
      );

      container.register({ group });
      const { registrations } = container;

      expect(registrations['group.component1'].lifetime).toEqual(Lifetime.SINGLETON);
      expect(registrations['group.component2'].lifetime).toEqual(Lifetime.TRANSIENT);
    });

    it(`overwrites '${COMPONENT_OPTIONS}' of groups nested groups with its components properly`, () => {
      const nestedComponent1 = stubComponent().singleton();
      const nestedComponent2 = stubComponent().class();
      const component1 = stubComponent().value();
      const component2 = stubComponent().transient();

      const nestedGroup = createGroup({
        nestedComponent1,
        nestedComponent2
      }).transient();

      const group = createGroup({
        component1,
        component2,
        nestedGroup
      }).singleton().class();

      container.register({ group });
      const { registrations } = container;

      expect(registrations['group.component1'].lifetime).toEqual(Lifetime.SINGLETON);
      expect(registrations['group.component2'].lifetime).toEqual(Lifetime.TRANSIENT);

      expect(registrations['group.nestedGroup.nestedComponent1'].lifetime).toEqual(Lifetime.SINGLETON);
      expect(registrations['group.nestedGroup.nestedComponent2'].lifetime).toEqual(Lifetime.TRANSIENT);
    });

    it(`lets global '${COMPONENT_OPTIONS}' overwrite '${COMPONENT_OPTIONS}' of all of it's children properly`, () => {
      container = createContainer({ lifetime: Lifetime.SINGLETON });

      const nestedComponent1 = stubComponent().transient();
      const nestedComponent2 = stubComponent();
      const component1 = stubComponent();
      const component2 = stubComponent().transient();

      const nestedGroup = createGroup({
        nestedComponent1,
        nestedComponent2
      });

      const group = createGroup({
        component1,
        component2,
        nestedGroup
      });

      container.register({ group });
      const { registrations } = container;

      expect(registrations['group.component1'].lifetime).toEqual(Lifetime.SINGLETON);
      expect(registrations['group.component2'].lifetime).toEqual(Lifetime.TRANSIENT);

      expect(registrations['group.nestedGroup.nestedComponent1'].lifetime).toEqual(Lifetime.TRANSIENT);
      expect(registrations['group.nestedGroup.nestedComponent2'].lifetime).toEqual(Lifetime.SINGLETON);
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
          testValue: createComponent(testValue, {
            resolveAs: ResolveAs.VALUE
          }),
          getTestValue: createComponent(getTestValue, {
            resolveAs: ResolveAs.FUNCTION,
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
          testValue: createComponent(testValue, {
            resolveAs: ResolveAs.VALUE
          }),
          getTestValue: createComponent(getTestValue, {
            resolveAs: ResolveAs.FUNCTION,
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
          testValue: createComponent(testValue, {
            resolveAs: ResolveAs.VALUE
          }),
          getTestValue: createComponent(getTestValue, {
            resolveAs: ResolveAs.FUNCTION,
            dependsOn: (DP) => (DP.testValue)
          })
        });

        const rootFactory = container.resolve('getTestValue');

        expect(rootFactory).toBeTruthy();
        expect(rootFactory()).toBe(testValue);
      });

      it('resolve dependencies if callback returns an Array with a single existing dependency', () => {
        container.register({
          testValue: createComponent(testValue, {
            resolveAs: ResolveAs.VALUE
          }),
          getTestValue: createComponent(getTestValue, {
            resolveAs: ResolveAs.FUNCTION,
            dependsOn: (DP) => ([DP.testValue])
          })
        });

        const rootFactory = container.resolve('getTestValue');

        expect(rootFactory).toBeTruthy();
        expect(rootFactory()).toBe(testValue);
      });

      it('throws an SfiocTypeError if callback returns an Function', () => {
        container.register({
          getTestValue: createComponent(getTestValue, {
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
          getTestValue: createComponent(callback, {
            dependsOn: () => ([])
          })
        });

        container.resolve('getTestValue');

        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls).toContainEqual([]);
      });

      it('throws an SfiocTypeError if callback returns an Array with empty values', () => {
        container.register({
          getTestValue: createComponent(getTestValue, {
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
        first: createComponent(first, { dependsOn: 'second' }),
        second: createComponent(second, { dependsOn: 'third' }),
        third: createComponent(third, { dependsOn: 'unregistered' }),
      });

      const error = catchError(() => {
        container.resolve('first');
      });

      expect(error).toBeInstanceOf(SfiocResolutionError);
      expect(error.message).toContain('first -> second -> third');
    });

    it('throws an SfiocResolutionError when there are cyclic dependencies', () => {
      const first = ({ second }) => second;
      const second = ({ third }) => third;
      const third = ({ second }) => second;

      container.register({
        first: createComponent(first, { dependsOn: 'second' }),
        second: createComponent(second, { dependsOn: 'third' }),
        third: createComponent(third, { dependsOn: 'second' }),
      });

      const error = catchError(() => {
        container.resolve('first');
      });

      expect(error).toBeInstanceOf(SfiocResolutionError);
      expect(error.message).toContain('first -> second -> third -> second');
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
          root: createComponent(root, {
            dependsOn: ['accumulator', 'store']
          }),
          store: createComponent(store, {
            dependsOn: 'accumulator'
          }),
          accumulator: createComponent(acc, {
            lifetime: Lifetime.SINGLETON
          })
        });

        const counter = container.resolve('root');
        expect(counter).toBe(1);
      });

      it('supports transient lifetime', () => {
        container.register({
          root: createComponent(root, {
            dependsOn: ['accumulator', 'store']
          }),
          store: createComponent(store, {
            dependsOn: 'accumulator'
          }),
          accumulator: createComponent(acc, {
            lifetime: Lifetime.TRANSIENT
          })
        });

        const counter = container.resolve('root');
        expect(counter).toBe(0);
      });
    });

    it(`lets me resolve dependencies via 'get' proxy`, () => {
      container.register({
        testValue: createComponent(testValue).value(),
        getTestValue: createComponent(getTestValue, {
          dependsOn: 'testValue'
        })
      });

      const rootFactory = container.get.getTestValue;

      expect(rootFactory).toBeTruthy();
      expect(rootFactory()).toBe(testValue);
    });

    describe(`'PROXY' injection mode`, () => {
      beforeEach(() => {
        container = createContainer({
          injectionMode: InjectionMode.PROXY
        });
      });

      it('lets me resolve dependencies via proxy', () => {
        container.register({
          testValue: createComponent(testValue).value(),
          getTestValue: createComponent(getTestValue, {
            dependsOn: 'testValue'
          })
        });

        const rootFactory = container.resolve('getTestValue');

        expect(rootFactory).toBeTruthy();
        expect(rootFactory()).toBe(testValue);
      });

      it('lets me register components with groups and resolve them', () => {
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
          app: createComponent(app, {
            dependsOn: ['operations.login', 'operations.another']
          }),
          operations: createGroup({
            login: createComponent(loginOperation),
            another: createComponent(anotherOperation)
          })
        });

        const rootFactory = container.resolve('app');

        expect(rootFactory).toBeTruthy();
        expect(typeof rootFactory).toBe('object');
        expect(rootFactory).toHaveProperty('run');

        rootFactory.run();

        expect(store).toStrictEqual({
          loggedIn: true,
          anotherValue: true
        });
      });
    });
  });
});

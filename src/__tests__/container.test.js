const { createContainer } = require('../container');
const { component, group } = require('../elementWrappers');
const { ComponentTypes, Lifetime } = require('../constants');
const { SfiocResolutionError, SfiocTypeError } = require('../errors');

const testValue = 228;
const testValueGetterProvider = ({ testValue }) => () => testValue;

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
      testValue: component(testValue, {
        type: ComponentTypes.VALUE
      }),
      getTestValue: component(testValueGetterProvider, {
        type: ComponentTypes.FUNCTION,
        dependsOn: ['testValue']
      })
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
      app: component(app, {
        dependsOn: ['operations.login', 'operations.another']
      }),
      operations: group({
        login: component(loginOperation),
        another: component(anotherOperation)
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
        testValue: component(testValue, {
          type: ComponentTypes.VALUE
        })
      });

      container.register({
        getTestValue: component(testValueGetterProvider, {
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
        testValue: component(testValue, {
          type: ComponentTypes.VALUE
        }),
        getTestValue: component(testValueGetterProvider, {
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
        app: component(TestApp, {
          type: ComponentTypes.CLASS,
          dependsOn: ['repo']
        }),
        repo: component(TestRepo, {
          type: ComponentTypes.CLASS
        })
      })

      const app = container.resolve('app');
      expect(app.stuff()).toBe('stuff');
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
          testValue: component(testValue, {
            type: ComponentTypes.VALUE
          }),
          getTestValue: component(testValueGetterProvider, {
            type: ComponentTypes.FUNCTION,
            dependsOn: callback
          })
        });

        container.resolve('getTestValue');

        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls.length).toBe(1);
      });

      it('injects selectors inside callback', () => {
        let callback = jest.fn((DP) => (DP.testValue));

        container.register({
          testValue: component(testValue, {
            type: ComponentTypes.VALUE
          }),
          getTestValue: component(testValueGetterProvider, {
            type: ComponentTypes.FUNCTION,
            dependsOn: callback
          })
        });

        container.resolve('getTestValue');
        expect(callback).toHaveBeenCalledWith({
          testValue: "testValue",
          getTestValue: "getTestValue"
        });
      });

      it('resolve dependencies if callback returns a String with a single existing dependency', () => {
        container.register({
          testValue: component(testValue, {
            type: ComponentTypes.VALUE
          }),
          getTestValue: component(testValueGetterProvider, {
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
          testValue: component(testValue, {
            type: ComponentTypes.VALUE
          }),
          getTestValue: component(testValueGetterProvider, {
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
          getTestValue: component(testValueGetterProvider, {
            dependsOn: () => (() => {})
          })
        });

        let error;
        try {
          container.resolve('getTestValue');
        } catch(e) {
          error = e;
        }

        expect(error).toBeInstanceOf(SfiocTypeError);
        expect(error.message).toContain('Function');
      });

      it('does not inject any dependencies if callback returns an empty Array. ', () => {
        let callback = jest.fn();

        container.register({
          getTestValue: component(callback, {
            dependsOn: () => ([])
          })
        });

        container.resolve('getTestValue');

        expect(callback).toHaveBeenCalled();
        expect(callback.mock.calls).toContainEqual([]);
      });

      it('throws an SfiocTypeError if callback returns an Array with empty values', () => {
        container.register({
          getTestValue: component(testValueGetterProvider, {
            dependsOn: () => (['', ''])
          })
        });

        let error;
        try {
          container.resolve('getTestValue');
        } catch(e) {
          error = e;
        }

        expect(error).toBeInstanceOf(SfiocTypeError);
        expect(error.message).toContain('Array');
      });
    });

    it('throws an SfiocResolutionError when there are unregistered dependencies', () => {
      let error;
      try {
        container.resolve('nope');
      } catch(e) {
        error = e;
      }

      expect(error).toBeInstanceOf(SfiocResolutionError);
      expect(error.message).toMatch(/nope/i);
    });

    it('throws an SfiocResolutionError with a resolution path when resolving an unregistered dependency', () => {
      const first = ({ second }) => second;
      const second = ({ third }) => third;
      const third = ({ unregistered }) => unregistered;

      container.register({
        first: component(first, { dependsOn: 'second' }),
        second: component(second, { dependsOn: 'third' }),
        third: component(third, { dependsOn: 'unregistered' }),
      });

      let error;
      try {
        container.resolve('first');
      } catch(e) {
        error = e;
      }

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
          root: component(root, {
            dependsOn: ['accumulator', 'store']
          }),
          store: component(store, {
            dependsOn: 'accumulator'
          }),
          accumulator: component(acc, {
            lifetime: Lifetime.SINGLETON
          })
        });

        const counter = container.resolve('root');
        expect(counter).toBe(1);
      });

      it('supports transient lifetime', () => {
        container.register({
          root: component(root, {
            dependsOn: ['accumulator', 'store']
          }),
          store: component(store, {
            dependsOn: 'accumulator'
          }),
          accumulator: component(acc, {
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
        first: component(first, { dependsOn: 'second' }),
        second: component(second, { dependsOn: 'third' }),
        third: component(third, { dependsOn: 'second' }),
      });

      let error;
      try {
        container.resolve('first');
      } catch(e) {
        error = e;
      }

      expect(error).toBeInstanceOf(SfiocResolutionError);
      expect(error.message).toContain('first -> second -> third -> second');
    });
  });
});

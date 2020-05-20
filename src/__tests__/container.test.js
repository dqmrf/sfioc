import { catchError } from '../utils'
import { createGroup } from '../group'
import { createContainer } from '../container'
import { createComponent } from '../component'
import { SfiocResolutionError, SfiocTypeError } from '../errors'
import {
  InjectionMode,
  ResolveAs,
  Lifetime,
  COMPONENT_OPTIONS
} from '../constants'

const testValue = 228
const getTestValue = jest.fn(({ testValue }) => () => testValue)
const stubTarget = jest.fn()
const stubComponent = (options) => createComponent(stubTarget, options)

describe('createContainer', () => {
  it('returns an object', () => {
    let container = createContainer()
    expect(typeof container).toBe('object')
  })
})

describe('container', () => {
  it('lets me register components and resolve them', () => {
    let container = createContainer()

    container.register({
      testValue: createComponent(testValue, {
        resolveAs: ResolveAs.VALUE
      }),
      getTestValue: createComponent(getTestValue, {
        resolveAs: ResolveAs.FUNCTION,
        dependsOn: ['testValue']
      })
    })

    const rootFactory = container.resolve('getTestValue')

    expect(rootFactory).toBeTruthy()
    expect(rootFactory()).toBe(testValue)
  })


  it('lets me register components with groups and resolve them', () => {
    let container = createContainer()

    let store = {
      loggedIn: false,
      anotherValue: false
    }

    const loginOperation = () => {
      return () => {
        store.loggedIn = true
      }
    }

    const anotherOperation = () => {
      return () => {
        store.anotherValue = true
      }
    }

    const app = ({ operations }) => ({
      run() {
        operations.login()
        if (store.loggedIn) {
          operations.another()
        }
      }
    })

    container.register({
      app: createComponent(app, {
        dependsOn: ['operations.login', 'operations.another']
      }),
      operations: createGroup({
        login: createComponent(loginOperation),
        another: createComponent(anotherOperation)
      })
    })

    const rootFactory = container.resolve('app')

    expect(rootFactory).toBeTruthy()
    expect(typeof rootFactory).toBe('object')
    expect(rootFactory).toHaveProperty('run')

    rootFactory.run()

    expect(store).toStrictEqual({
      loggedIn: true,
      anotherValue: true
    })
  })

  describe('register', () => {
    let container, expContainer

    beforeEach(() => {
      container = createContainer()
    })

    describe('input parameters', () => {
      let component1, component2, component3, component4

      beforeEach(() => {
        container = createContainer()
        expContainer = createContainer()

        component1 = createComponent(42)
                      .value()
                      .singleton()
                      .dependsOn(['c1d1', 'c1d2'])
                      .singleton()
        component2 = createComponent(() => 42)
                      .fn()
                      .dependsOn('c2d1')
        component3 = createComponent(class C3 {})
                      .class()
                      .dependsOn(['c3d1', 'c3d2'])
        component4 = createComponent(() => 255)
                      .fn()
                      .dependsOn('c4d1')
                      .singleton()
      })

      it(`may be a 'Sfioc.group' element as the first arg`, () => {
        const group = createGroup({ component1, component2 })

        expContainer.register({ component1, component2 })
        container.register(group)
      })

      it(`may be a 'String' as the first arg, 'Component' as the second arg`, () => {
        expContainer.register({ component1, component2 })

        container.register('component1', component1)
        container.register('component2', component2)
      })

      it(`may be a 'String' as the first arg, 'Group' as the second arg`, () => {
        expContainer.register({
          namespace: createGroup({ component1, component2 })
        })

        container.register('namespace', createGroup({ component1, component2 }))
      })

      it(`may be a 'String' as the first arg, 'Elements' as the second arg`, () => {
        expContainer.register({
          namespace: createGroup({ component1, component2 })
        })

        container.register('namespace', { component1, component2 })
      })

      it(`may be a 'String' as the first arg, 'Array<Group>' as the second arg`, () => {
        const group1 = createGroup({ component1, component2 })
        const group2 = createGroup({ component3, component4 })

        container.register('namespace', [group1, group2])

        expContainer.register({
          namespace: createGroup({
            component1,
            component2,
            component3,
            component4
          })
        })
      })

      it(`may be an 'Array<[String, Element]>' as the first arg`, () => {
        expContainer.register({
          component1,
          component2: component2.singleton(),
          component3,
        }, { lifetime: Lifetime.TRANSIENT })

        container.register([
          ['component1', component1],
          ['component2', component2, { lifetime: Lifetime.SINGLETON }],
          ['component3', component3]
        ], { lifetime: Lifetime.TRANSIENT })
      })

      it(`may be an 'Array<Elements>' as the first arg`, () => {
        expContainer.register({
          component1,
          component2,
          component3,
          component4
        })

        container.register([
          { component1, component2 },
          { component3 },
          { component4 }
        ])
      })

      it(`may be an 'Array<Group | Elements>' as the first arg`, () => {
        const group = createGroup({ component1, component2 })

        expContainer.register({
          component1,
          component2,
          component3,
          component4
        })

        container.register([
          group,
          { component3 },
          { component4 }
        ])
      })

      afterEach(() => {
        const registrations = container.registrations
        const expRegistrations = expContainer.registrations

        for (let id in expRegistrations) {
          const registration = registrations[id]
          const expRegistration = expRegistrations[id]

          expect(registration.id).toEqual(expRegistration.id)
          expect(registration.groupId).toEqual(expRegistration.groupId)
          expect(registration.lifetime).toEqual(expRegistration.lifetime)
          expect(registration.dependencies).toEqual(expRegistration.dependencies)
        }
      })
    })

    describe('input options', () => {
      let component1, component2, component3, component4

      beforeEach(() => {
        component1 = stubComponent().value()
        component2 = stubComponent().transient()
        component3 = stubComponent().singleton()
        component4 = stubComponent()
      })

      it('are valid when passed as the second argument', () => {
        const group = createGroup({ component3, component4 }).transient()

        container.register({
          component1, component2, group
        }, {
          lifetime: Lifetime.SINGLETON
        })
      })

      it('are valid when passed as the third argument with String as first argument', () => {
        const group = createGroup({ component3, component4 }).transient()

        container.register('component1', component1, { lifetime: Lifetime.SINGLETON})
        container.register('component2', component2, { lifetime: Lifetime.SINGLETON})
        container.register('group', group, { lifetime: Lifetime.SINGLETON})
      })

      afterEach(() => {
        const { registrations } = container

        expect(registrations.component1.lifetime).toBe(Lifetime.SINGLETON)
        expect(registrations.component2.lifetime).toBe(Lifetime.TRANSIENT)
        expect(registrations['group.component3'].lifetime).toBe(Lifetime.SINGLETON)
        expect(registrations['group.component4'].lifetime).toBe(Lifetime.TRANSIENT)
      })
    })

    it('throws a SfiocTypeError when invalid first argument (Number) was passed', () => {
      const error = catchError(() => container.register(42))

      expect(error).toBeInstanceOf(SfiocTypeError)
      expect(error.message).toContain('42')
    })

    it('throws a SfiocTypeError when invalid first argument (empty String) was passed', () => {
      const error = catchError(() => container.register(''))

      expect(error).toBeInstanceOf(SfiocTypeError)
      expect(error.message).toContain('""')
    })

    it('throws a SfiocTypeError when the first and second arguments are String arguments', () => {
      const error = catchError(() => container.register('namespace', 'wtf'))

      expect(error).toBeInstanceOf(SfiocTypeError)
      expect(error.message).toContain('namespace, wtf')
    })

    it('throws a SfiocTypeError when invalid first argument (empty Array) was passed', () => {
      const error = catchError(() => container.register([]))

      expect(error).toBeInstanceOf(SfiocTypeError)
      expect(error.message).toContain('""')
    })

    it('throws a SfiocTypeError when invalid first argument (Array<[String, Number]>) was passed', () => {
      const error = catchError(() => container.register(['dep1', 228]))

      expect(error).toBeInstanceOf(SfiocTypeError)
      expect(error.message).toContain('228')
    })

    it('throws a SfiocTypeError when invalid first argument (Array<[Number]>) was passed', () => {
      const error = catchError(() => container.register([42]))

      expect(error).toBeInstanceOf(SfiocTypeError)
      expect(error.message).toContain('42')
    })

    it('throws a SfiocTypeError when invalid first argument (Array<[String]>) was passed', () => {
      const error = catchError(() => container.register(['idWithoutValue']))

      expect(error).toBeInstanceOf(SfiocTypeError)
      expect(error.message).toContain('undefined')
    })

    it('throws a SfiocTypeError when invalid first argument (Array<[Invalid object]>) was passed', () => {
      const error = catchError(() => container.register([{ lol: { q: '42' } }]))

      expect(error).toBeInstanceOf(SfiocTypeError)
      expect(error.message).toContain('[object Object]')
    })

    it('lets me register registrations in multiple calls', () => {
      container.register({
        testValue: createComponent(testValue, {
          resolveAs: ResolveAs.VALUE
        })
      })

      container.register({
        getTestValue: createComponent(getTestValue, {
          resolveAs: ResolveAs.FUNCTION,
          dependsOn: ['testValue']
        })
      })

      expect(Object.keys(container.registrations)).toHaveLength(2)

      const rootFactory = container.resolve('getTestValue')

      expect(rootFactory).toBeTruthy()
      expect(rootFactory()).toBe(testValue)
    })

    it('accepts a single dependency as a string', () => {
      container.register({
        testValue: createComponent(testValue, {
          resolveAs: ResolveAs.VALUE
        }),
        getTestValue: createComponent(getTestValue, {
          resolveAs: ResolveAs.FUNCTION,
          dependsOn: 'testValue'
        })
      })

      expect(Object.keys(container.registrations)).toHaveLength(2)

      const rootFactory = container.resolve('getTestValue')

      expect(rootFactory).toBeTruthy()
      expect(rootFactory()).toBe(testValue)
    })

    it('supports classes', () => {
      class TestApp {
        constructor({ repo }) {
          this.repo = repo
        }

        stuff() {
          return this.repo.getStuff()
        }
      }

      class TestRepo {
        getStuff() {
          return 'stuff'
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

      const rootFactory = container.resolve('app')
      expect(rootFactory.stuff()).toBe('stuff')
    })

    it(`overwrites '${COMPONENT_OPTIONS}' of groups nested components properly`, () => {
      const component1 = stubComponent()
      const component2 = stubComponent().transient()

      const group = createGroup(
        { component1, component2 },
        { lifetime: Lifetime.SINGLETON }
      )

      container.register({ group })
      const { registrations } = container

      expect(registrations['group.component1'].lifetime).toEqual(Lifetime.SINGLETON)
      expect(registrations['group.component2'].lifetime).toEqual(Lifetime.TRANSIENT)
    })

    it(`overwrites '${COMPONENT_OPTIONS}' of groups nested groups with its components properly`, () => {
      const nestedComponent1 = stubComponent().singleton()
      const nestedComponent2 = stubComponent().class()
      const component1 = stubComponent().value()
      const component2 = stubComponent().transient()

      const nestedGroup = createGroup({
        nestedComponent1,
        nestedComponent2
      }).transient()

      const group = createGroup({
        component1,
        component2,
        nestedGroup
      }).singleton().class()

      container.register({ group })
      const { registrations } = container

      expect(registrations['group.component1'].lifetime).toEqual(Lifetime.SINGLETON)
      expect(registrations['group.component2'].lifetime).toEqual(Lifetime.TRANSIENT)

      expect(registrations['group.nestedGroup.nestedComponent1'].lifetime).toEqual(Lifetime.SINGLETON)
      expect(registrations['group.nestedGroup.nestedComponent2'].lifetime).toEqual(Lifetime.TRANSIENT)
    })

    it(`lets global '${COMPONENT_OPTIONS}' overwrite '${COMPONENT_OPTIONS}' of all of it's children properly`, () => {
      container = createContainer({ lifetime: Lifetime.SINGLETON })

      const nestedComponent1 = stubComponent().transient()
      const nestedComponent2 = stubComponent()
      const component1 = stubComponent()
      const component2 = stubComponent().transient()

      const nestedGroup = createGroup({
        nestedComponent1,
        nestedComponent2
      })

      const group = createGroup({
        component1,
        component2,
        nestedGroup
      })

      container.register({ group })
      const { registrations } = container

      expect(registrations['group.component1'].lifetime).toEqual(Lifetime.SINGLETON)
      expect(registrations['group.component2'].lifetime).toEqual(Lifetime.TRANSIENT)

      expect(registrations['group.nestedGroup.nestedComponent1'].lifetime).toEqual(Lifetime.TRANSIENT)
      expect(registrations['group.nestedGroup.nestedComponent2'].lifetime).toEqual(Lifetime.SINGLETON)
    })
  })

  describe('resolve', () => {
    let container

    beforeEach(() => {
      container = createContainer()
    })

    describe('dealing with "dependsOn" callback', () => {
      it('calls the callback once', () => {
        let callback = jest.fn((DP) => (DP.testValue))

        container.register({
          testValue: createComponent(testValue, {
            resolveAs: ResolveAs.VALUE
          }),
          getTestValue: createComponent(getTestValue, {
            resolveAs: ResolveAs.FUNCTION,
            dependsOn: callback
          })
        })

        container.resolve('getTestValue')

        expect(callback).toHaveBeenCalled()
        expect(callback.mock.calls).toHaveLength(1)
      })

      it('injects selectors (all but its own) inside callback', () => {
        let callback = jest.fn((DP) => (DP.testValue))

        container.register({
          testValue: createComponent(testValue, {
            resolveAs: ResolveAs.VALUE
          }),
          getTestValue: createComponent(getTestValue, {
            resolveAs: ResolveAs.FUNCTION,
            dependsOn: callback
          })
        })

        container.resolve('getTestValue')

        expect(callback).toHaveBeenCalledWith({
          testValue: "testValue"
        })
      })

      it('resolve dependencies if callback returns a String with a single existing dependency', () => {
        container.register({
          testValue: createComponent(testValue, {
            resolveAs: ResolveAs.VALUE
          }),
          getTestValue: createComponent(getTestValue, {
            resolveAs: ResolveAs.FUNCTION,
            dependsOn: (DP) => (DP.testValue)
          })
        })

        const rootFactory = container.resolve('getTestValue')

        expect(rootFactory).toBeTruthy()
        expect(rootFactory()).toBe(testValue)
      })

      it('resolve dependencies if callback returns an Array with a single existing dependency', () => {
        container.register({
          testValue: createComponent(testValue, {
            resolveAs: ResolveAs.VALUE
          }),
          getTestValue: createComponent(getTestValue, {
            resolveAs: ResolveAs.FUNCTION,
            dependsOn: (DP) => ([DP.testValue])
          })
        })

        const rootFactory = container.resolve('getTestValue')

        expect(rootFactory).toBeTruthy()
        expect(rootFactory()).toBe(testValue)
      })

      it('throws a SfiocTypeError if callback returns an Function', () => {
        container.register({
          getTestValue: createComponent(getTestValue, {
            dependsOn: () => (() => {})
          })
        })

        const error = catchError(() => {
          container.resolve('getTestValue')
        })

        expect(error).toBeInstanceOf(SfiocTypeError)
        expect(error.message).toContain('Function')
      })

      it('does not inject any dependencies if callback returns an empty Array. ', () => {
        let callback = jest.fn()

        container.register({
          getTestValue: createComponent(callback, {
            dependsOn: () => ([])
          })
        })

        container.resolve('getTestValue')

        expect(callback).toHaveBeenCalled()
        expect(callback.mock.calls).toContainEqual([])
      })

      it('throws a SfiocTypeError if callback returns an Array with empty values', () => {
        container.register({
          getTestValue: createComponent(getTestValue, {
            dependsOn: () => (['', ''])
          })
        })

        const error = catchError(() => {
          container.resolve('getTestValue')
        })

        expect(error).toBeInstanceOf(SfiocTypeError)
        expect(error.message).toContain('Array')
      })
    })

    it('throws a SfiocResolutionError when there are unregistered dependencies', () => {
      const error = catchError(() => {
        container.resolve('nope')
      })

      expect(error).toBeInstanceOf(SfiocResolutionError)
      expect(error.message).toMatch(/nope/i)
    })

    it('throws a SfiocResolutionError with a resolution path when resolving an unregistered dependency', () => {
      const first = ({ second }) => second
      const second = ({ third }) => third
      const third = ({ unregistered }) => unregistered

      container.register({
        first: createComponent(first, { dependsOn: 'second' }),
        second: createComponent(second, { dependsOn: 'third' }),
        third: createComponent(third, { dependsOn: 'unregistered' })
      })

      const error = catchError(() => {
        container.resolve('first')
      })

      expect(error).toBeInstanceOf(SfiocResolutionError)
      expect(error.message).toContain('first -> second -> third')
    })

    it('throws a SfiocResolutionError when there are cyclic dependencies', () => {
      const first = ({ second }) => second
      const second = ({ third }) => third
      const third = ({ second }) => second

      container.register({
        first: createComponent(first, { dependsOn: 'second' }),
        second: createComponent(second, { dependsOn: 'third' }),
        third: createComponent(third, { dependsOn: 'second' }),
      })

      const error = catchError(() => {
        container.resolve('first')
      })

      expect(error).toBeInstanceOf(SfiocResolutionError)
      expect(error.message).toContain('first -> second -> third -> second')
    })

    it('throws a SfiocResolutionError when the lifetime of the input registration is unknown', () => {
      container.register({ component: stubComponent() })
      container.registrations.component.lifetime = 'wrongLifetime'

      const error = catchError(() => {
        container.resolve('component')
      })

      expect(error).toBeInstanceOf(SfiocResolutionError)
      expect(error.message).toMatch(/wrongLifetime/i)
    })

    it('throws a SfiocResolutionError when the container injection mode is unknown', () => {
      container.register({ component: stubComponent() })
      container.options.injectionMode = 'WRONG'

      const error = catchError(() => {
        container.resolve('component')
      })

      expect(error).toBeInstanceOf(SfiocResolutionError)
      expect(error.message).toMatch(/Unknown injection mode/i)
    })

    describe('lifetime', () => {
      let root, store, acc

      beforeEach(() => {
        root = ({ accumulator, store }) => {
          accumulator.increment()
          return store.getCounter()
        }

        store = ({ accumulator }) => ({
          getCounter() { return accumulator.getCounter() }
        })

        acc = () => {
          let counter = 0
          return {
            increment() { return ++counter },
            getCounter() { return counter }
          }
        }
      })

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
        })

        const counter = container.resolve('root')
        expect(counter).toBe(1)
      })

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
        })

        const counter = container.resolve('root')
        expect(counter).toBe(0)
      })
    })

    it(`lets me specify dependencies using selectors`, () => {
      container.register({
        testValue: createComponent(testValue).value(),
        getTestValue: createComponent(getTestValue, {
          dependsOn: (({ testValue }) => [testValue])
        })
      })

      const rootFactory = container.resolve('getTestValue')

      expect(rootFactory).toBeTruthy()
      expect(rootFactory()).toBe(testValue)
    })

    it(`lets me resolve dependencies via 'get' proxy`, () => {
      container.register({
        testValue: createComponent(testValue).value(),
        getTestValue: createComponent(getTestValue, {
          dependsOn: 'testValue'
        })
      })

      const rootFactory = container.get.getTestValue

      expect(rootFactory).toBeTruthy()
      expect(rootFactory()).toBe(testValue)
    })

    describe(`'PROXY' injection mode`, () => {
      beforeEach(() => {
        container = createContainer({
          injectionMode: InjectionMode.PROXY
        })
      })

      it('lets me resolve dependencies via proxy', () => {
        container.register({
          testValue: createComponent(testValue).value(),
          getTestValue: createComponent(getTestValue, {
            dependsOn: 'testValue'
          })
        })

        const rootFactory = container.resolve('getTestValue')

        expect(rootFactory).toBeTruthy()
        expect(rootFactory()).toBe(testValue)
      })

      it('lets me register components with groups and resolve them', () => {
        let store = {
          loggedIn: false,
          anotherValue: false
        }

        const loginOperation = () => {
          return () => {
            store.loggedIn = true
          }
        }

        const anotherOperation = () => {
          return () => {
            store.anotherValue = true
          }
        }

        const app = ({ operations }) => ({
          run() {
            operations.login()
            if (store.loggedIn) {
              operations.another()
            }
          }
        })

        container.register({
          app: createComponent(app, {
            dependsOn: ['operations.login', 'operations.another']
          }),
          operations: createGroup({
            login: createComponent(loginOperation),
            another: createComponent(anotherOperation)
          })
        })

        const rootFactory = container.resolve('app')

        expect(rootFactory).toBeTruthy()
        expect(typeof rootFactory).toBe('object')
        expect(rootFactory).toHaveProperty('run')

        rootFactory.run()

        expect(store).toStrictEqual({
          loggedIn: true,
          anotherValue: true
        })
      })

      it('throws a SfiocResolutionError when there are unregistered dependencies', () => {
        const wrongComponent = ({ wrongValue }) => (wrongValue)

        container.register({
          testValue: createComponent(testValue).value(),
          wrongComponent: createComponent(wrongComponent)
        })

        const error = catchError(() => {
          container.resolve('wrongComponent')
        })

        expect(error).toBeInstanceOf(SfiocResolutionError)
        expect(error.message).toMatch(/wrongComponent -> wrongValue/i)
      })
    })
  })
})

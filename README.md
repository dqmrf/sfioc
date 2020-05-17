# Sfioc
Inversion of Control container for Node.JS. Inspired by [awilix](http://github.com/jeffijoe/awilix).


# Usage
The main idea is that you need to create container, register your dependencies
in it, and then resolve the dependency you need.

```js
// Here is an example application code.
import sf from 'sfioc'

// Imagine that our app has an internal store...
const appInternalStore = {
  isLoggedIn: false,
  currentUser: null
}

// ... and we have a database that we will connect to.
const ourDatabase = {
  users: [
    { id: 1, name: `Lieutenant` },
    { id: 2, name: 'Colonel' }
  ],
  secretData: 42
}

// Let's create repo that depends on our database...
class Repo {
  // Dependencies will be injected in the constructor.
  constructor({ database }) {
    this.db = database
  }

  findUser(id) {
    const user = this.db.users.find(dbUser => {
      if (dbUser.id === id) return dbUser
    })

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        user ? resolve(user): reject('Could not find user!')
      }, 500)
    })
  }

  getSecretData() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.db.secretData), 500)
    })
  }
}

// ... create some app operations that depends on our Repo and store.
// Here dependencies will be injected inside the function.
const login = ({ store, repo }) => {
  // This nested function will be used by our 'app' module after resolving...
  return (userId) => (new Promise((resolve, reject) => {
    // ... and we will be able to access the dependencies from here.
    repo.findUser(userId)
      .then(user => {
        store.isLoggedIn = true
        store.currentUser = user
        resolve(user)
      })
      .catch(err => reject(err))
  }))
}

// One more operation.
const showSecretData = ({ repo }) => {
  return () => {
    repo.getSecretData()
      .then(data => {
        console.log(`Your secret data is: ${data}`)
      })
      .catch(err => {
        console.log(err)
      })
  }
}

// Finally let's create a factory function with our entry point.
const appFactory = ({ store, login, showSecretData }) => {
  return { start }

  async function start(userId) {
    if (!store.isLoggedIn) {
      try {
        await login(userId)
      } catch (err) {
        console.log(err)
        return
      }
    }

    console.log(`Welcome, ${store.currentUser.name}!`)
    showSecretData()
  }
}

// Create the container.
const container = sf.createContainer()

// Register our app modules in the container.
container.register({
  // Here we specify how to resolve our 'store' module.
  // It has no dependencies, we don't need to call it as a function,
  // we only need the data inside. So we can register our store as 'value'.
  store: sf.component(appInternalStore).value(),
  // Same for database.
  database: sf.component(ourDatabase).value(),
  // Here we have a class that have dependencies.
  // We need to specify which module it will depend on.
  // In this case, it's a database.
  repo: sf.component(Repo, { dependsOn: 'database' }).class(),
  // Everything is the same for this module.
  // Sfioc resolves all modules as a function by default.
  // So we don't need to specify how to resolve it...
  login: sf.component(login, { dependsOn: ['store', 'repo']}),
  // ... but is you want, you may specify it by calling a '.fn()' option...
  showSecretData: sf.component(showSecretData, { dependsOn: 'repo' }).fn(),
  // ... but we can do it in a different way...
  app: sf.component(appFactory, {
    // ... by specifying through the 'resolveAs' option.
    // This is the same as calling the '.fn()' option on our component
    resolveAs: sf.ResolveAs.FUNCTION,
    dependsOn: ['store', 'login', 'showSecretData']
  })
})

// We've set everything up. Let's resolve our 'app' module.
const app = container.resolve('app')
// Same as:
// const app = container.get.app

// Welcome, Lieutenant!
// Your secret data is: 42
const userId = 1
app.start(userId)

// Could not find user!
const wrongUserId = 42
app.start(wrongUserId)
```

# Injection modes
The injection mode determines how a function/constructor receives its dependencies.
Sfioc supports two injection modes: `CLASSIC` and `PROXY`.
- `InjectionMode.CLASSIC`: In this case you need to explicitly specify which
  components each component depends on using `dependsOn` option.
  ```js
  class UserService {
    constructor({ emailService, logger }) {
      this.emailService = emailService
      this.logger = logger
    }
  }

  container.register({
    userService: sf.component(UserService, {
      resolveAs: sf.ResolveAs.CLASS,
      dependsOn: ['emailService', 'logger']
    }),
    emailService: // ...
    logger: // ...
  })
  ```

- `InjectionMode.PROXY`: Injects a proxy to functions/constructors which looks
  like a regular object. In this case you don't need to explicitly specify
  dependencies.
  ```js
  class UserService {
    constructor({ emailService, logger }) {
      this.emailService = emailService
      this.logger = logger
    }
  }

  container.register({
    userService: sf.component(UserService).class(),
    emailService: // ...
    logger: // ...
  })
  ```
`CLASSIC` mode is slightly faster than `PROXY` because it only reads the
dependencies from the constructor/function once, whereas accessing dependencies
on the Proxy may incur slight overhead for each resolve.


# Lifetime management
Sfioc supports managing the lifetime of components. You can control whether
objects are resolved and used once or cached for the lifetime of the process.

There are 2 lifetime types available.

- `Lifetime.TRANSIENT`: This is the default. The registration is resolved every
  time it is needed. This means if you resolve a class more than once, you will
  get back a new instance every time.
- `Lifetime.SINGLETON`: The registration is always reused no matter what - that
  means that the resolved value is cached in the root container.

To register a module with a specific lifetime:

```js
import { component, Lifetime } from 'sfioc'

class SomeService() {}

container.register({
  someService: component(SomeService, { lifetime: Lifetime.SINGLETON })
})

// this is the same
container.register({
  someService: component(SomeService).setLifetime(Lifetime.SINGLETON)
})

// or even shorter
container.register({
  someService: component(SomeService).singleton()
})
```


# Components
Component is needed in order to wrap your module, specify options for it, and
store them inside. This method is used to wrap modules and prepare them for
further registration.


# Groups
In addition to components you also have the ability to use groups. It's used
to combine components and other groups, specify common parameters or/and namespace
for them.

Imagine that you have some modules that can be assigned to the same group.
For example: operations.

```js
import sf from 'sfioc'

class MockRepo {}
class MailService {}

// Our operations
const getUser = ({ mockRepo }) => (id) => {
  return mockRepo.getUser(id)
}

const sendGreetToUser = ({ mailService }) => (name) => {
  return mailService.send(`Hello, ${name}!`)
}

// Some controller that depends on operations
class UserController {
  // Sfioc generated a namespace for operations
  constructor({ operations }) {
    this.operations = operations;
  }

  spamToUser(id) {
    // You can access any operation through this namespace
    const user = this.operations.getUser(id)
    this.operations.sendGreetToUser(user.name)
  }
}

const container = sf.createContainer({
  injectionMode: sf.InjectionMode.PROXY
})

container.register({
  mockRepo: // ...
  mailService: // ...
  userController: sf.component(UserController).class(),
  // So if you assign the group for 'operations' property, it will be used as
  // a namespace for all nested components.
  operations: sf.group({
    getUser: sf.component(getUser)
    sendGreetToUser: sf.component(sendGreetToUser)
  })
})

```

It's also possible to specify default options for nested components as well.

```js
container.register({
  //...
  operations: sf.group({
    getUser: sf.component(getUser)
    sendGreetToUser: sf.component(sendGreetToUser)
  }, {
    lifetime: sf.Lifetime.SINGLETON
  })

  // The same thing:
  operations: sf.group({
    getUser: sf.component(getUser)
    sendGreetToUser: sf.component(sendGreetToUser)
  }).singleton()
})

container.registrations['operations.getUser'].lifetime // SINGLETON
container.registrations['operations.sendGreetToUser'].lifetime // SINGLETON
```

Note: group options do not overwrite options of nested components, if they are
specified.

```js
container.register({
  //...
  operations: sf.group({
    getUser: sf.component(getUser).transient() // Specified TRANSIENT lifetime.
    sendGreetToUser: sf.component(sendGreetToUser)
  }, {
    lifetime: sf.Lifetime.SINGLETON
  })
})

container.registrations['operations.getUser'].lifetime // TRANSIENT
container.registrations['operations.sendGreetToUser'].lifetime // SINGLETON
```

You can register other groups within group as well.


# API

## The `sfioc` object

When importing `sfioc`, you get the following top-level API:

- `createContainer`
- `component`
- `group`
- `Lifetime`
- `ResolveAs`
- `InjectionMode`

## `createContainer`

Creates a new Sfioc container.

Args:
- `options`: Options object. Optional.
  - `options.injectionMode`: Determines the method for resolving dependencies.
    Valid modes are:
    - `CLASSIC`: (default) Dependencies must be explicitly specified via
      `dependsOn` option.
    - `PROXY`: Injects a proxy object in module that is able to resolve its
      dependencies.
  - `options.componentOptions`: Global options for all components. They can be
      overwrited by `container.register`, `sfioc.group` and  `sfioc.component`
      methods.

## `component`

Used with `container.register({ moduleName: component(module) })`. Wraps
dependencies and prepares them for further registration.

Args:
- `target`: Your dependency.
- `options`: Options onject. Optional.
  - `options.resolveAs`: tells Sfioc hot to resolve given module. Valid params:
    `ResolveAs.FUNCTION`, `ResolveAs.CLASS`, `ResolveAs.VALUE`.
  - `options.lifetime`: sets the target's lifetime. Valid params: `Lifetime.SINGLETON`,
  `Lifetime.TRANSIENT`.
  - `options.dependsOn`: sets the component dependencies. Accepts the string with
    dependency name, or array with dependency names. `dependsOn` also accepts a
    callback that must return the dependency name, or an array of dependency names.
    Sfioc injects selectors with the names of registered modules in this callback.
    So if you registered, for example `first` and `second` modules, you can specify
    a dependency on them in this way:
    ```js
    component(third).dependsOn((DP) => ([DP.first, DP.second]))
    // is the same as:
    component(third).dependsOn('first', 'second')
    ```
    **Note**: use this option only when the `CLASSIC` injection mode is selected.
    Otherwise this options is useless.


The returned component has the following chainable API:

- `component(module).resolveAs(resolveAs: string)`: same as the `resolveAs` option.
- `component(module).fn()`: same as `component(module).resolveAs(ResolveAs.FUNCTION)`
- `component(module).class()`: same as `component(module).resolveAs(ResolveAs.CLASS)`
- `component(module).value()`: same as `component(module).resolveAs(ResolveAs.VALUE)`
- `component(module).setLifetime(lifetime: string)`: same as the `lifetime` option.
- `component(module).transient()`: same as `component(module).setLifetime(Lifetime.TRANSIENT)`
- `component(module).singleton()`: same as `component(module).setLifetime(Lifetime.SINGLETON)`
- `component(module).dependsOn(dependencies: string | array | function)`: same as
  the `dependsOn` option.

## `group`

Used with:
```js
container.register({
  namespace: group({
    component1: component(module1)
    component2: component(module2)
  })
})
```

Combines components, specify common parameters or/and namespace for them.

Args:
- `elements`: An object with components or/and groups.
- `options`: Default options for nested components and groups. (Same as component
  options)

The returned group has the following chainable API:

- `group(components).resolveAs(resolveAs: string)`: same as the `resolveAs` option.
- `group(components).fn()`: same as `group(components).resolveAs(ResolveAs.FUNCTION)`
- `group(components).class()`: same as `group(components).resolveAs(ResolveAs.CLASS)`
- `group(components).value()`: same as `group(components).resolveAs(ResolveAs.VALUE)`
- `group(components).setLifetime(lifetime: string)`: same as the `lifetime` option.
- `group(components).transient()`: same as `group(components).setLifetime(Lifetime.TRANSIENT)`
- `group(components).singleton()`: same as `group(components).setLifetime(Lifetime.SINGLETON)`

## `Lifetime`

Constant used with `lifetime` component options and related. It contains two
values: `TRANSIENT` and `SINGLETON`.

## `ResolveAs`

Constant used with `resolveAs` component options and related. It contains three
values: `FUNCTION`, `CLASS` and `VALUE`.

## `InjectionMode`

Constant used with `sfioc.container` options. It contains two values: `CLASSIC`
and `PROXY`.

## The `sfioc.container` object

The container returned from `createContainer` has some methods and properties.

### `container.get`

The `get` is a proxy, and all getters will trigger a `container.resolve`. The
`get` is actually being passed to the constructor/factory function, which is
how everything gets wired up.

### `container.registrations`

A read-only getter that returns the internal registrations.

### `container.cache`

Used internally for caching resolutions.

### `container.options`

Options passed to `createContainer` are stored here.

### `container.resolve`

Resolves the registration with the given name. Used by the `get`.

```js
container.register({ test: component(() => 42) })

container.resolve('test') === 42
container.get.test === 42
```

### `container.register`

Registers modules or/and groups in the container.

There are multiple syntaxes for this function, you can pick the one you like
the most, or combine them.

The `register` method also accepts options for nested components and group as the
last possible argument.

```js
// Register single component
container.register(
  'someOperationName',
  component(someOperationFactory),
  // I don't quite understand why you need to do this, but it's also possible:
  {
    lifetime: Lifetime.SINGLETON,
    resolveAs: ResolveAs.FUNCTION
  }
)

// Register single group
container.register('operations', group({
  login: component(loginFactory),
  signup: component(signupFactory)
}), { /* options */ })

// Same as above
container.register('operations', {
  login: component(loginFactory),
  signup: component(signupFactory)
}, { /* options */ })

// With single namespace
container.register('operations', [
  group({
    sendSpam: component(sendSpamFactory),
    sendGreet: component(sendGreetFactory)
  }),
  group({
    login: component(loginFactory),
    signup: component(signupFactory)
  })
], { /* options */ })

// Same as above
container.register('operations', [
  { sendSpam: component(sendSpamFactory) },
  { sendGreet: component(sendGreetFactory) }
  group({
    login: component(loginFactory),
    signup: component(signupFactory)
  })
], { /* options */ })

// Same as above
container.register({
  operations: group({
    login: component(loginFactory),
    signup: component(signupFactory)
    sendSpam: component(sendSpamFactory),
    sendGreet: component(sendGreetFactory)
  })
}, { /* options */ })

// Classic registration
container.register({
  login: component(loginFactory),
  signup: component(signupFactory)
}, { /* options */ })

// Same as above
container.register(group({
  login: component(loginFactory),
  signup: component(signupFactory)
}), { /* options */ })

container.register([
  'login', component(loginFactory),
  'signup', component(signupFactory)
], { /* options */ })
```


## TODO:
### Necessary
- ability to: register('namespace', Elements)
- leave resolveAs property in registration
- per module local injections
- add namespaces
- createContainer: move options related to components into componentOptions
  namespace

### Secondary
- Autoresolving.
- Group resolving implementation.
- Angular-like dependencies.
- Validator: expand 'struct' structure when t.handler throws an error.

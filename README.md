# Sfioc
Lightweight dependency injection library.

# Usage
The main idea is that you need to create container, register your dependencies in it,
and then resolve the dependency you need.

```javascript
// Here is an example application code.
const sf = require('sfioc');

// Imagine that our app has an internal store...
const appInternalStore = {
  isLoggedIn: false,
  currentUser: null
}

// ... and we have a database that we will connect to.
const ourDatabase = {
  users: [
    { id: 1, name: `Lieutenant ^` },
    { id: 2, name: 'Colonel ***' }
  ],
  secretData: '777'
}

// Let's create repo that depends on our database...
class Repo {
  // Dependencies will be injected in the constructor.
  constructor({ database }) {
    this.db = database;
  }

  findUser(id) {
    const user = this.db.users.find(dbUser => {
      if (dbUser.id === id) return dbUser;
    });

    return new Promise((resolve, reject) => {
      setTimeout(() => {
        user ? resolve(user): reject('Could not find user!');
      }, 500);
    });
  }

  getSecretData() {
    return new Promise((resolve) => {
      setTimeout(() => resolve(this.db.secretData), 500);
    });
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
        store.isLoggedIn = true;
        store.currentUser = user;
        resolve(user);
      })
      .catch(err => reject(err));
  }));
}

// One more operation.
const showSecretData = ({ repo }) => {
  return () => {
    repo.getSecretData()
      .then(data => {
        console.log(`Your secret data is: ${data}`);
      })
      .catch(err => {
        console.log(err);
      });
  };
}

// Finally let's create a factory function with our entry point.
const appFactory = ({ store, login, showSecretData }) => {
  return { start }

  async function start(userId) {
    if (!store.isLoggedIn) {
      try {
        await login(userId);
      } catch (err) {
        console.log(err);
        return;
      }
    }

    console.log(`Welcome, ${store.currentUser.name}!`)
    showSecretData();
  }
}

// Create the container.
const container = sf.createContainer();

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
    // ... by specifying the component type in the component options.
    // This is the same as calling the '.fn()' option on our component
    type: sf.ComponentTypes.FUNCTION,
    dependsOn: ['store', 'login', 'showSecretData']
  })
});

// We've set everything up. Let's resolve our 'app' module.
const app = container.resolve('app');

// Welcome, Lieutenant ^!
// Your secret data is: 777
const userId = 1;
app.start(userId);

// Could not find user!
const wrongUserId = 42;
app.start(wrongUserId);
```

## TODO:
### Necessary
- Create 'dependsOn' build option.
- Update component and group exports (and generally wherever possible).
- Rename container global options for components.
- Prettify 'resolve' method input params.

### Secondary
- Group resolving implementation.
- Proxy with dependencies. Nested proxies?
- Angular-like dependencies.
- Probably it's not needed to mutate container element inside 'updateComponentOptions' method.
- Validator: expand 'struct' structure when t.handler throws an error.
- Webpack + babel?
- Clean up* in tests.

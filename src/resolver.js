const { InjectionMode } = require('./constants');
const { SfiocResolutionError } = require('./errors');
const { classicResolver, proxyResolver } = require('./resolvers');

function createResolver(container) {
  return { resolve: resolver }

  function resolver(registration) {
    const { injectionMode } = container.options;

    let resolve;
    switch (injectionMode) {
      case InjectionMode.CLASSIC:
        resolve = classicResolver;
        break;
      case InjectionMode.PROXY:
        resolve = proxyResolver;
        break;
      default: {
        throw new SfiocResolutionError(
          registration.id,
          container.resolutionStack,
          `Unknown injection mode "${injectionMode}"`
        );
      }
    }

    return resolve(registration, container);
  }
}

module.exports = {
  createResolver
}

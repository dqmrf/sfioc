import { InjectionMode } from './constants'
import { SfiocResolutionError } from './errors'
import { classicResolver, proxyResolver } from './resolvers'

export function createResolver(container) {
  return { resolve: resolver }

  function resolver(registration) {
    const { injectionMode } = container.options

    let resolve
    switch (injectionMode) {
      case InjectionMode.CLASSIC:
        resolve = classicResolver
        break
      case InjectionMode.PROXY:
        resolve = proxyResolver
        break
      default: {
        throw new SfiocResolutionError(
          registration.id,
          container.resolutionStack,
          `Unknown injection mode "${injectionMode}"`
        )
      }
    }

    return resolve(registration, container)
  }
}

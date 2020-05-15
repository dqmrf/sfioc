export function proxyResolver(registration, container) {
  return registration.target(container.get)
}

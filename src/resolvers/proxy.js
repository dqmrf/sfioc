function proxyResolver(registration, container) {
  return registration.target(container.resolvers);
}

module.exports = {
  proxyResolver
}

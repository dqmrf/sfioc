const classic = require('./classic');
const proxy = require('./proxy');

module.exports = {
  ...classic,
  ...proxy
}

const tv = require('tcomb-validation');
const extensions = require('./extensions');

const extended = tv.mixin(tv, extensions);

module.exports = extended;

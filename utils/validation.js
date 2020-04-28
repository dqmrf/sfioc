const t = require('tcomb-validation');

module.exports = {
  validate
}

// Function validates subject and returns it back merged with defaults.
function validate(subject, validator) {
  const result = t.validate(subject, validator);
  if (!result.isValid()) throw new Error(result.firstError().message);
  return result.value;
}

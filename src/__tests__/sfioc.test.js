const sfioc = require('../sfioc');
const { createContainer } = require('../container');
const { component, group } = require('../elementWrappers');

describe('sfioc', () => {
  it('exists', () => {
    expect(sfioc).toBeDefined();
  });

  it(`has a 'createContainer' function`, () => {
    expect(sfioc).toHaveProperty('createContainer');
    expect(sfioc.createContainer).toBe(createContainer);
  });

  it(`has the 'component' and 'group' functions`, () => {
    expect(sfioc.component).toBe(component);
    expect(sfioc.group).toBe(group);
  });
});

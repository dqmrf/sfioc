const sfioc = require('../sfioc');
const { createContainer } = require('../container');
const { createGroup } = require('../group');
const { createComponent } = require('../component');

describe('sfioc', () => {
  it('exists', () => {
    expect(sfioc).toBeDefined();
  });

  it(`has a 'createContainer' function`, () => {
    expect(sfioc).toHaveProperty('createContainer');
    expect(sfioc.createContainer).toBe(createContainer);
  });

  it(`has a 'component' function`, () => {
    expect(sfioc).toHaveProperty('component');
    expect(sfioc.component).toBe(createComponent);
  });

  it(`has a 'group' function`, () => {
    expect(sfioc).toHaveProperty('group');
    expect(sfioc.group).toBe(createGroup);
  });
});

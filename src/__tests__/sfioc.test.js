const sfioc = require('../sfioc');
const { createContainer } = require('../container');
const { componentWrapper } = require('../component');
const { groupWrapper } = require('../group');

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
    expect(sfioc.component).toBe(componentWrapper);
  });

  it(`has a 'group' function`, () => {
    expect(sfioc).toHaveProperty('group');
    expect(sfioc.group).toBe(groupWrapper);
  });
});

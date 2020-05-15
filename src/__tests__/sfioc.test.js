import sfioc from '../sfioc'
import { createGroup } from '../group'
import { createComponent } from '../component'
import { createContainer } from '../container'

describe('sfioc', () => {
  it('exists', () => {
    expect(sfioc).toBeDefined()
  })

  it(`has a 'createContainer' function`, () => {
    expect(sfioc).toHaveProperty('createContainer')
    expect(sfioc.createContainer).toBe(createContainer)
  })

  it(`has a 'component' function`, () => {
    expect(sfioc).toHaveProperty('component')
    expect(sfioc.component).toBe(createComponent)
  })

  it(`has a 'group' function`, () => {
    expect(sfioc).toHaveProperty('group')
    expect(sfioc.group).toBe(createGroup)
  })
})

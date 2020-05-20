import * as U from '../utils'

describe('catchError', () => {
  it('catches an error and returns it', () => {
    const error = U.catchError(() => {
      throw new Error('Catched error')
    })

    expect(error).toBeTruthy()
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toContain('Catched error')
  })

  it(`returns 'null' if no errors were catched`, () => {
    const error = U.catchError(() => {})

    expect(error).toBe(null)
  })

  it(`throws an Error if no errors were catched, and the 'throwError' option has the 'true' value`, () => {
    let throwedError

    try {
      U.catchError(() => {}, { throwError: true })
    } catch (err) {
      throwedError = err
    }

    expect(throwedError).toBeTruthy()
    expect(throwedError).toBeInstanceOf(Error)
    expect(throwedError.message).toContain('This function was supposed to throw and error')
  })
})

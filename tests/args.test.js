import { validateArgs } from '../src/args/args'

describe('validateArgs', () => {
  test('validate args succesful', async () => {
    let args = ['node', '/usr/local/bin/scrappy', 'files/input.txt']
    let state = await validateArgs(args)
    expect(state).toEqual({
      isInputFile: true,
      inputFile: 'files/input.txt',
      outputFile: '',
      url: '',
      apiKey: '',
      tokenUsage: false,
      stream: false
    })
  })

  test('validate args with api key', async () => {
    let args = [
      'node',
      '/usr/local/bin/scrappy',
      'files/input.txt',
      '--api-key',
      '1234'
    ]
    let state = await validateArgs(args)
    expect(state).toEqual(false)
  })

  test('validate args with url', async () => {
    let args = [
      'node',
      '/usr/local/bin/scrappy',
      'files/input.txt',
      '--url',
      'https://example.com'
    ]
    let state = await validateArgs(args)
    expect(state).toEqual({
      isInputFile: false,
      inputFile: 'files/input.txt',
      outputFile: '',
      apiKey: '1234', // from the previous test
      tokenUsage: false,
      stream: false,
      url: 'https://example.com'
    })
  })

  test('validate args with -v', async () => {
    let args = ['node', '/usr/local/bin/scrappy', 'files/input.txt', '-v']
    let state = await validateArgs(args)
    expect(state).toEqual(false)
  })

  test('validate args with -h', async () => {
    let args = ['node', '/usr/local/bin/scrappy', 'files/input.txt', '-h']
    let state = await validateArgs(args)
    expect(state).toEqual(false)
  })

  test('validate args with -s and -t', async () => {
    let args = ['node', '/usr/local/bin/scrappy', 'files/input.txt', '-s', '-t']
    let state = await validateArgs(args)
    expect(state).toEqual({
      isInputFile: true,
      inputFile: 'files/input.txt',
      outputFile: '',
      apiKey: '1234', // from the previous test
      tokenUsage: true,
      stream: true,
      url: 'https://example.com'
    })
  })
})

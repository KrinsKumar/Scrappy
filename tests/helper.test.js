import { Groq } from 'groq-sdk'
import {
  updateState,
  getUrlBody,
  convertIntoMd,
  saveMd,
  getGroqResponse
} from '../src/args/helper.js'
import fs from 'fs'

const content =
  '```markdown\n# My Awesome Blog\n\nThis is a blog post about my awesome blog\n\n## Introduction\n\nThis is the introduction to my awesome blog\n\n## Body\n\nThis is the body of my awesome blog\n\n## Conclusion\n\nThis is the conclusion of my awesome blog\n```'

const mockGrokResponse = [
  {
    id: 'chatcmpl-id',
    object: 'chat.completion',
    created: 1812643254,
    model: 'llama3-8b-8192',
    choices: [
      {
        index: 0,
        delta: {
          role: 'assistant',
          content: content
        },
        logprobs: null,
        finish_reason: 'stop'
      }
    ],
    usage: {
      queue_time: 0.003841073,
      prompt_tokens: 297,
      prompt_time: 0.051556976,
      completion_tokens: 50,
      completion_time: 0.2,
      total_tokens: 347,
      total_time: 0.251556976
    },
    system_fingerprint: 'fp_b6828be2c9',
    x_groq: {
      id: 'req_01jbt022jge8jafg4egrcn3ed3'
    }
  }
]

describe('convertIntoMd', () => {
  test('convert the body into markdown', async () => {
    let groq = new Groq({ apiKey: '1234' })
    groq.chat = {
      completions: {
        create: jest.fn().mockResolvedValue(mockGrokResponse)
      }
    }
    let body = 'the body of the webpage'
    let md = await getGroqResponse(body, groq)
    expect(md).not.toBeNull()
    expect(md).toEqual(content)
  })
})

describe('Output File is created', () => {
  test('should create an output file', () => {
    let markdown = 'This is a test markdown'
    const file = './files/input.txt'
    const filePath = './files/input.txt.md'
    updateState({ outputFile: file })
    saveMd(markdown)
    const fileContent = fs.readFileSync(filePath, 'utf8')
    expect(fileContent).toEqual(markdown)
  })
})

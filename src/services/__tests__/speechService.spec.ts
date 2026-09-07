import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import MockAdapter from 'axios-mock-adapter'
import { apiClient } from '@/api/client'
import { speechService } from '../speechService'

describe('speechService', () => {
  const mock = new MockAdapter(apiClient)

  beforeEach(() => mock.reset())
  afterEach(() => mock.reset())

  it('uploads the audio as multipart form data and returns the unwrapped result', async () => {
    mock.onPost('/speech/transcriptions').reply((config) => {
      expect(config.data).toBeInstanceOf(FormData)
      const audio = (config.data as FormData).get('audio')
      expect(audio).toBeInstanceOf(Blob)
      expect((config.data as FormData).get('browserTranscript')).toBeNull()

      return [
        200,
        {
          success: true,
          data: {
            transcript: '통장을 잃어버렸어요',
            source: 'CLOVA_CSR',
            browserTranscript: null,
            sttConfidence: null,
            recheckNeeded: true,
          },
          error: null,
        },
      ]
    })

    const result = await speechService.transcribe(new Blob(['fake-audio'], { type: 'audio/wav' }))

    expect(result.transcript).toBe('통장을 잃어버렸어요')
    expect(result.source).toBe('CLOVA_CSR')
  })

  it('includes browserTranscript in the form data when provided', async () => {
    mock.onPost('/speech/transcriptions').reply((config) => {
      expect((config.data as FormData).get('browserTranscript')).toBe('임시 문장')

      return [
        200,
        {
          success: true,
          data: {
            transcript: '임시 문장',
            source: 'WEB_SPEECH_FALLBACK',
            browserTranscript: '임시 문장',
            sttConfidence: null,
            recheckNeeded: true,
          },
          error: null,
        },
      ]
    })

    const result = await speechService.transcribe(new Blob(['fake-audio'], { type: 'audio/wav' }), '임시 문장')

    expect(result.source).toBe('WEB_SPEECH_FALLBACK')
  })

  it('rejects with the backend message when CLOVA fails and there is no fallback', async () => {
    mock.onPost('/speech/transcriptions').reply(502, {
      success: false,
      data: null,
      error: { code: 'INTERNAL_ERROR', message: 'CLOVA CSR request failed' },
    })

    await expect(speechService.transcribe(new Blob(['fake-audio'], { type: 'audio/wav' }))).rejects.toThrow(
      'CLOVA CSR request failed',
    )
  })
})

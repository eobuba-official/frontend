import type { SpeechTranscriptionResult } from '@/api/types'
import { apiClient } from '@/api/client'

export const speechService = {
  async transcribe(audio: Blob, browserTranscript?: string | null): Promise<SpeechTranscriptionResult> {
    const formData = new FormData()
    formData.append('audio', audio, 'utterance.wav')
    if (browserTranscript) {
      formData.append('browserTranscript', browserTranscript)
    }

    const response = await apiClient.post<SpeechTranscriptionResult>('/speech/transcriptions', formData, {
      headers: { 'Content-Type': undefined },
    })
    return response.data
  },
}

import type { AnalyzeResult, SpeechTranscriptionResult } from '@/api/types'
import { consultationService } from './consultationService'
import { speechService } from './speechService'

export interface SpeechAnalysisResult {
  transcription: SpeechTranscriptionResult
  analysis: AnalyzeResult
}

export const speechAnalysisService = {
  async transcribeAndAnalyze(
    audio: Blob,
    browserTranscript?: string | null,
  ): Promise<SpeechAnalysisResult> {
    const transcription = await speechService.transcribe(audio, browserTranscript)
    const analysis = await consultationService.analyze({
      utterance: transcription.transcript,
      inputMethod: 'VOICE',
      sttConfidence: transcription.sttConfidence,
    })

    return { transcription, analysis }
  },
}

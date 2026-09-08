import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AnalyzeResult, SpeechTranscriptionResult } from '@/api/types'
import { consultationService } from '../consultationService'
import { speechAnalysisService } from '../speechAnalysisService'
import { speechService } from '../speechService'

const transcription: SpeechTranscriptionResult = {
  transcript: '통장을 일어버렸어요',
  source: 'CLOVA_CSR',
  browserTranscript: null,
  sttConfidence: null,
  recheckNeeded: true,
}

const analysis: AnalyzeResult = {
  consultationId: 'c1',
  status: 'TASK_CONFIRMED',
  fraudCheck: {
    detected: false,
    dismissible: false,
    patterns: [],
    safetyActions: [],
    guardianNotification: null,
  },
  classification: {
    status: 'CONFIRMED',
    originalUtterance: '통장을 일어버렸어요',
    correctedUtterance: '통장을 잃어버렸어요',
    correctionApplied: true,
    confidence: 0.93,
    task: {
      taskTypeCode: 'PASSBOOK_REISSUE',
      name: '통장 재발급',
      easyDescription: '통장을 새로 만드는 일',
    },
    candidates: [],
    sttRecheckNeeded: true,
  },
  visitDecision: null,
  guidance: null,
}

describe('speechAnalysisService', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls CLOVA transcription first and then analyzes its transcript with Gemini', async () => {
    const callOrder: string[] = []
    vi.spyOn(speechService, 'transcribe').mockImplementation(async () => {
      callOrder.push('transcription')
      return transcription
    })
    const analyze = vi.spyOn(consultationService, 'analyze').mockImplementation(async () => {
      callOrder.push('analysis')
      return analysis
    })
    const audio = new Blob(['fake-audio'], { type: 'audio/wav' })

    const result = await speechAnalysisService.transcribeAndAnalyze(audio)

    expect(callOrder).toEqual(['transcription', 'analysis'])
    expect(analyze).toHaveBeenCalledWith({
      utterance: '통장을 일어버렸어요',
      inputMethod: 'VOICE',
      sttConfidence: null,
    })
    expect(result).toEqual({ transcription, analysis })
  })

  it('does not call Gemini when transcription fails', async () => {
    vi.spyOn(speechService, 'transcribe').mockRejectedValue(new Error('CLOVA failed'))
    const analyze = vi.spyOn(consultationService, 'analyze')

    await expect(
      speechAnalysisService.transcribeAndAnalyze(new Blob(['fake-audio'], { type: 'audio/wav' })),
    ).rejects.toThrow('CLOVA failed')
    expect(analyze).not.toHaveBeenCalled()
  })
})

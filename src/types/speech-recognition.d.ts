// Minimal ambient types for the non-standard Web Speech API SpeechRecognition
// interface (not part of TypeScript's DOM lib), used for real-time voice
// capture on the home screen's mic button.
export {}

declare global {
  interface SpeechRecognitionResult {
    readonly [index: number]: { transcript: string; confidence: number }
    readonly length: number
  }

  interface SpeechRecognitionResultList {
    readonly [index: number]: SpeechRecognitionResult
    readonly length: number
  }

  interface SpeechRecognitionEvent extends Event {
    readonly results: SpeechRecognitionResultList
  }

  interface SpeechRecognition extends EventTarget {
    lang: string
    continuous: boolean
    interimResults: boolean
    maxAlternatives: number
    start(): void
    stop(): void
    abort(): void
    onresult: ((event: SpeechRecognitionEvent) => void) | null
    onerror: ((event: Event) => void) | null
    onend: ((event: Event) => void) | null
  }

  interface Window {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
}

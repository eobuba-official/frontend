import { describe, expect, it } from 'vitest'
import { encodeWav, mergeAudioChunks } from '../wavEncoder'

describe('mergeAudioChunks', () => {
  it('concatenates chunks in order', () => {
    const merged = mergeAudioChunks([new Float32Array([0.1, 0.2]), new Float32Array([0.3])])

    expect(Array.from(merged)).toEqual(Array.from(new Float32Array([0.1, 0.2, 0.3])))
  })

  it('returns an empty array when there are no chunks', () => {
    expect(mergeAudioChunks([]).length).toBe(0)
  })
})

describe('encodeWav', () => {
  it('writes a valid RIFF/WAVE header sized for the given samples', async () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1])
    const blob = encodeWav(samples, 16000)

    expect(blob.type).toBe('audio/wav')
    expect(blob.size).toBe(44 + samples.length * 2)

    const view = new DataView(await blob.arrayBuffer())
    expect(readString(view, 0, 4)).toBe('RIFF')
    expect(readString(view, 8, 4)).toBe('WAVE')
    expect(readString(view, 12, 4)).toBe('fmt ')
    expect(readString(view, 36, 4)).toBe('data')
    expect(view.getUint16(22, true)).toBe(1) // mono
    expect(view.getUint32(24, true)).toBe(16000) // sample rate
    expect(view.getUint16(34, true)).toBe(16) // bits per sample
    expect(view.getUint32(40, true)).toBe(samples.length * 2)
  })

  it('round-trips PCM samples within 16-bit quantization error', async () => {
    const samples = new Float32Array([0, 0.5, -0.5, 1, -1])
    const blob = encodeWav(samples, 16000)
    const view = new DataView(await blob.arrayBuffer())

    for (let i = 0; i < samples.length; i += 1) {
      const decoded = view.getInt16(44 + i * 2, true) / 0x8000
      expect(decoded).toBeCloseTo(samples[i], 3)
    }
  })
})

function readString(view: DataView, offset: number, length: number): string {
  let text = ''
  for (let i = 0; i < length; i += 1) {
    text += String.fromCharCode(view.getUint8(offset + i))
  }
  return text
}

// pitch-processor.js — Driftloop Tape Station "Reel"
// Granular / overlap-add pitch shifter. Changes pitch WITHOUT changing
// playback speed, so loops keep their length and stay in sync.
//
// Registered as 'pitch-shifter'. Stereo in/out (up to 2 channels each).
// Reads a per-render 'pitch' AudioParam in SEMITONES (-24..24, default 0)
// and converts to a resample ratio = 2^(semitones/12).
//
// Approach: a circular input buffer feeds two overlapping grain streams.
// Each grain reads the input at the pitch ratio, is Hann-windowed, and is
// laid down with ~50% overlap against the other stream. The two windowed
// streams sum to a near-constant envelope, so output stays click-free even
// while pitch glides. pitch=0 (ratio=1) is effectively transparent.

const GRAIN_MS = 100;        // grain length (~80-120ms range)
const MAX_CHANNELS = 2;

class PitchShifter extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [{
      name: 'pitch',
      defaultValue: 0,
      minValue: -24,
      maxValue: 24,
      automationRate: 'k-rate', // one value per render quantum is plenty
    }];
  }

  constructor() {
    super();

    this.grainSize = Math.max(256, Math.round(sampleRate * (GRAIN_MS / 1000)));
    this.hop = this.grainSize >> 1;          // 50% overlap
    // Generous circular buffer: room for the grain plus read drift.
    this.bufLen = this.grainSize * 4;

    // Per-channel circular input buffers.
    this.inBuf = [];
    for (let c = 0; c < MAX_CHANNELS; c++) {
      this.inBuf.push(new Float32Array(this.bufLen));
    }
    this.writePos = 0;       // where the next input sample is written
    this.samplesWritten = 0; // total samples seen (for warmup)

    // Two grain streams, each at its own phase (offset by half a grain).
    // readPos = fractional read position within the circular buffer.
    // pos     = position within the current grain [0, grainSize).
    this.streams = [
      { readPos: 0, pos: 0 },
      { readPos: 0, pos: this.hop },
    ];
    this.streamsInit = false;

    // Precompute the Hann window.
    this.window = new Float32Array(this.grainSize);
    for (let i = 0; i < this.grainSize; i++) {
      this.window[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / this.grainSize);
    }
  }

  // Linear-interpolated read from a channel's circular buffer.
  _read(buf, pos) {
    let p = pos % this.bufLen;
    if (p < 0) p += this.bufLen;
    const i0 = Math.floor(p);
    const i1 = (i0 + 1) % this.bufLen;
    const frac = p - i0;
    return buf[i0] * (1 - frac) + buf[i1] * frac;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!output || output.length === 0) return true;

    const frames = output[0].length;
    const chCount = Math.min(output.length, MAX_CHANNELS);
    const hasInput = input && input.length > 0 && input[0] && input[0].length > 0;

    const semis = parameters.pitch;
    // k-rate gives a length-1 array; support a-rate defensively too.
    const ratio = Math.pow(2, (semis.length === 1 ? semis[0] : semis[0]) / 12);

    // 1) Write this block's input into the circular buffers.
    for (let i = 0; i < frames; i++) {
      const w = (this.writePos + i) % this.bufLen;
      for (let c = 0; c < MAX_CHANNELS; c++) {
        const src = hasInput && input[c] ? input[c]
                  : (hasInput && input[0] ? input[0] : null);
        this.inBuf[c][w] = src ? src[i] : 0;
      }
    }
    this.writePos = (this.writePos + frames) % this.bufLen;
    this.samplesWritten += frames;

    // Lazily anchor the grain read positions a grain's-length behind the
    // write head, so grains read already-buffered audio.
    if (!this.streamsInit && this.samplesWritten >= this.grainSize) {
      const anchor = (this.writePos - this.grainSize + this.bufLen) % this.bufLen;
      this.streams[0].readPos = anchor;
      this.streams[1].readPos = anchor;
      this.streamsInit = true;
    }

    // Fast path: silent warmup before we have a grain of audio.
    if (!this.streamsInit) {
      for (let c = 0; c < chCount; c++) output[c].fill(0);
      return true;
    }

    // 2) Synthesize output sample-by-sample from the two grain streams.
    for (let i = 0; i < frames; i++) {
      for (let c = 0; c < chCount; c++) output[c][i] = 0;

      for (let s = 0; s < this.streams.length; s++) {
        const st = this.streams[s];
        const win = this.window[st.pos];

        for (let c = 0; c < chCount; c++) {
          output[c][i] += this._read(this.inBuf[c], st.readPos) * win;
        }

        // Advance read by the pitch ratio; advance grain position by 1.
        st.readPos += ratio;
        st.pos++;

        // Grain finished: restart it just behind the live write head so the
        // two streams stay anchored to current input and never run away.
        if (st.pos >= this.grainSize) {
          st.pos = 0;
          st.readPos = (this.writePos - this.grainSize + this.bufLen) % this.bufLen;
        }
      }
    }

    return true; // keep processor alive
  }
}

registerProcessor('pitch-shifter', PitchShifter);

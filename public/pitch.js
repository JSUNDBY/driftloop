// pitch.js — Driftloop Tape Station "Reel"
// One global: window.Pitcher. Loads the AudioWorklet module once (cached)
// and hands back ready-to-wire 'pitch-shifter' nodes.
//
// Host usage:
//   const p = await Pitcher.node(ac);          // null if unsupported
//   src.connect(p); p.connect(dest);
//   p.parameters.get('pitch').setValueAtTime(semis, ac.currentTime);
//
// Decoupling pitch from speed: keep bufferSource.playbackRate = 1 so the
// loop length / sync is preserved, and set the lane's pitch on the Pitcher
// node instead.

(function () {
  'use strict';

  // Resolve the module URL relative to this script so it works wherever
  // the site is served from.
  function moduleUrl() {
    try {
      if (document.currentScript && document.currentScript.src) {
        return new URL('pitch-processor.js', document.currentScript.src).href;
      }
    } catch (e) { /* fall through */ }
    return 'pitch-processor.js';
  }

  const Pitcher = {
    // Per-AudioContext cache of the addModule() promise so we only fetch +
    // register the processor once per context.
    _modules: new WeakMap(),

    _ensureModule(ac) {
      if (!ac || !ac.audioWorklet || typeof ac.audioWorklet.addModule !== 'function') {
        return Promise.reject(new Error('AudioWorklet not supported'));
      }
      let promise = this._modules.get(ac);
      if (!promise) {
        promise = ac.audioWorklet.addModule(moduleUrl());
        // If registration fails, drop the cache so a later call can retry.
        promise.catch(() => this._modules.delete(ac));
        this._modules.set(ac, promise);
      }
      return promise;
    },

    // Returns a new stereo AudioWorkletNode, or null if anything goes wrong
    // (unsupported browser, failed module load, etc.).
    async node(ac) {
      try {
        await this._ensureModule(ac);
        return new AudioWorkletNode(ac, 'pitch-shifter', {
          numberOfInputs: 1,
          numberOfOutputs: 1,
          outputChannelCount: [2],
        });
      } catch (e) {
        console.warn('[Pitcher] node() failed:', e);
        return null;
      }
    },

    // Convenience: true if this browser can host the worklet at all.
    get supported() {
      return typeof AudioWorkletNode !== 'undefined';
    },
  };

  window.Pitcher = Pitcher;
})();

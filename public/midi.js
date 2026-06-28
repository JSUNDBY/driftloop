/*
 * midi.js — Web MIDI module for the tape-station app.
 *
 * Exposes one global: window.LoopMIDI
 *
 * Lets the host map incoming MIDI Control Change (CC) messages to named
 * targets (e.g. "lvl0", "space") via a MIDI-learn flow, persists those
 * mappings to localStorage, and calls back with normalized values.
 *
 * No dependencies, no build step. Include with <script src="midi.js"></script>.
 */
(function () {
  "use strict";

  var STORAGE_KEY = "loopstation:midimap";

  // State
  var access = null;             // MIDIAccess object once granted
  var onCC = null;               // host callback: (targetId, value0to1, raw)
  var onStatus = null;           // host callback: (text)
  var learnTarget = null;        // targetId currently armed for learn, or null
  var mappings = {};             // targetId -> { cc, channel }

  // --- helpers ----------------------------------------------------------

  function status(text) {
    // Never let a host callback error escape.
    try { if (onStatus) onStatus(text); } catch (e) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        var parsed = JSON.parse(raw);
        if (parsed && typeof parsed === "object") mappings = parsed;
      }
    } catch (e) {
      mappings = {};
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
    } catch (e) {}
  }

  // Find which targetId (if any) a given cc/channel is bound to.
  function findTargetForCC(cc, channel) {
    for (var id in mappings) {
      if (!Object.prototype.hasOwnProperty.call(mappings, id)) continue;
      var m = mappings[id];
      if (m && m.cc === cc && m.channel === channel) return id;
    }
    return null;
  }

  // --- MIDI message handling -------------------------------------------

  function handleMessage(event) {
    try {
      var data = event.data;
      if (!data || data.length < 3) return;

      var statusByte = data[0];
      var type = statusByte & 0xf0;
      // Only Control Change messages (0xB0). Ignore everything else.
      if (type !== 0xb0) return;

      var channel = statusByte & 0x0f; // 0..15
      var cc = data[1];                // controller number
      var value = data[2];             // data2, 0..127

      if (learnTarget !== null) {
        // Capture this CC as the mapping for the armed target.
        var target = learnTarget;
        learnTarget = null;

        // Latest binding wins: if this CC was bound elsewhere, move it.
        var prev = findTargetForCC(cc, channel);
        if (prev !== null && prev !== target) delete mappings[prev];

        mappings[target] = { cc: cc, channel: channel };
        save();
        status("mapped CC" + cc + " → " + target);
        return;
      }

      // Not learning: route mapped CCs to the host.
      var id = findTargetForCC(cc, channel);
      if (id !== null) {
        try { if (onCC) onCC(id, value / 127, value); } catch (e) {}
      }
    } catch (e) {
      // Swallow — a malformed message must never throw.
    }
  }

  // Attach our handler to every current input, and report a device name.
  function attachInputs() {
    if (!access) return;
    var name = null;
    try {
      access.inputs.forEach(function (input) {
        input.onmidimessage = handleMessage;
        if (!name) name = input.name;
      });
    } catch (e) {}
    if (name) status("MIDI: " + name);
  }

  // --- public API -------------------------------------------------------

  var LoopMIDI = {
    init: function (opts) {
      opts = opts || {};
      onCC = typeof opts.onCC === "function" ? opts.onCC : null;
      onStatus = typeof opts.onStatus === "function" ? opts.onStatus : null;

      load();

      // Web MIDI may be missing entirely.
      if (!navigator || typeof navigator.requestMIDIAccess !== "function") {
        status("MIDI not available");
        return Promise.resolve();
      }

      try {
        return navigator.requestMIDIAccess().then(
          function (a) {
            access = a;
            attachInputs();
            // Re-scan when devices are plugged/unplugged so new ones work.
            try {
              access.onstatechange = function () { attachInputs(); };
            } catch (e) {}
          },
          function () {
            // Access denied or failed.
            status("no MIDI access");
          }
        ).catch(function () {
          status("MIDI not available");
        });
      } catch (e) {
        status("MIDI not available");
        return Promise.resolve();
      }
    },

    learn: function (targetId) {
      learnTarget = targetId;
      status("learn: move a control");
    },

    cancelLearn: function () {
      learnTarget = null;
      status("learn cancelled");
    },

    isLearning: function () {
      return learnTarget !== null;
    },

    clear: function (targetId) {
      try {
        if (Object.prototype.hasOwnProperty.call(mappings, targetId)) {
          delete mappings[targetId];
          save();
          status("cleared " + targetId);
        }
      } catch (e) {}
    },

    mappingLabel: function (targetId) {
      try {
        var m = mappings[targetId];
        if (m && typeof m.cc === "number") return "CC" + m.cc;
      } catch (e) {}
      return null;
    }
  };

  window.LoopMIDI = LoopMIDI;
})();

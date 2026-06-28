# Driftloop Tape Station — roadmap

## Done
- 6 loop lanes, source bank (8) + load-your-own per lane, per-lane PIT/LVL/TON/LEN.
- **Per-lane Mute / Solo** (mixer operation).
- **Output routing** — pick the device the app plays through (`AudioContext.setSinkId`), so the sound goes to Ableton via a virtual device instead of your speakers. See "Route to Ableton" below.
- Global tape: Space (reverb), Age (disintegration), Wow (flutter), Master. Reels, master VU, Randomize, Record.

## Route to Ableton (the "send the out + don't hear it twice" setup)
1. Install **BlackHole** (free virtual audio device): `brew install blackhole-2ch`.
2. In the app (desktop Chrome), click **OUT →** and pick **BlackHole 2ch**. The app now plays into BlackHole, your speakers go silent.
3. In Ableton: Preferences → Audio → Input = BlackHole. Add an Audio track, set its input to BlackHole, arm monitor. Now the loops come through Ableton, and you choose where they go / record them — no double audio.
   - To still hear it while producing, use a **Multi-Output Device** (Audio MIDI Setup: BlackHole + your speakers) or Ableton's monitoring.

## Next (queued, by member)
- **Patch — Web MIDI:** map a hardware controller's knobs/faders to lane LVL/PIT/TON and the global tape; optionally send MIDI clock/notes out so the station can drive Ableton instruments in time. (Chrome.)
- **Patch — cloud presets:** save a full rig as a shareable patch (his Cloudflare D1/KV) → a URL anyone can open. A small "patch gallery."
- **Console — dedicated channel faders + meters per strip**, drag-reorder lanes, a bigger waveform with draggable loop in/out points per lane.
- **Reel — true pitch-shift** (keep loop length while changing pitch, via an AudioWorklet/granular), per-lane reverse, per-lane reverb send + delay.
- **Reel — generative "Drift":** a toggle that slowly, musically re-tunes lanes through a scale on its own (the Driftloop never-repeats spirit, applied to the rig).
- **Tape — installable PWA** + the iOS audio hardening already proven in the ambient app.

## Stretch / cool-factor ideas
- **Ableton Link** tempo sync (needs a small local bridge — not pure browser).
- Sample straight from a URL / a Freesound search inside the app.
- Per-lane step-gate / rhythmic chopping so loops can become rhythmic.
- A second "performance" view: big XY pad / macro morph between saved patches.

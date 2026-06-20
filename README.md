# Driftloop

A generative ambient instrument in the Loscil tradition. One singing bowl, looped and pitched, explored through six mixable layers that recombine endlessly. It never repeats.

Live at **[driftloop.joshsundby.com](https://driftloop.joshsundby.com)**.

## What it is

A single self-contained Web Audio app (plus one bowl sample). No frameworks, no build step.

- **Six layers**, each a toggle + fader: Drone (bowl pad chords), Shimmer (granular cloud), Bells (sparse high tones), Sub (heartbeat), Air (breathing noise bed), Light (airy synth pad).
- **Generative** chord movement, sparse and slow. Tape character (saturation, hiss, wow). A **Tide** macro that slowly evolves the piece on its own.
- **Scenes** (Submers / Coast / Glacier / Embers) and **presets**, remembered between sessions.
- **Record** a take to a downloadable file.
- A generative visual driven by the live audio.

The chords are built as intervals from the bowl's own pitch, so it is always in tune with itself.

## Run locally

It must be served (it fetches the mp3), not opened via `file://`.

```
python3 -m http.server 8787
# then open http://localhost:8787
```

Or on macOS, double-click `Driftloop.command`.

## Make a different instrument

Swap `bowl.mp3` for any sustained one-note sample (a cello, a held voice, a Rhodes). The whole engine re-voices around it.

Built by Josh Sundby.

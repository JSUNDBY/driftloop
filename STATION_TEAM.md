# Driftloop Tape Station — the build team

A standing crew for this app. These are roles, and each maps to a **specialized agent** I can actually dispatch (in parallel) to build, review, and test, so "the team" isn't a metaphor — it's how the work gets split.

| Member | Role | Owns |
|--------|------|------|
| **Director** | product + priorities | what gets built next, the feel, saying no to bloat |
| **Reel** | audio / DSP | synthesis, looping, pitch/time, the tape character, output routing |
| **Console** | interface / industrial design | the technical UI, channel strips, ergonomics, "easier to operate" |
| **Patch** | integrations | Web MIDI, Ableton, cloud preset sync + sharing, sample-from-anywhere |
| **Tape** | QA / reliability | cross-device (esp. iOS audio-context limits), no-crash, performance |

**How to run them:** for a big push I can spin these up as concurrent agents — Reel builds the DSP feature while Console reworks the strip and Tape verifies on every target — then I synthesize the result. That's an opt-in "use the team" move (it spends more tokens); say the word and I'll orchestrate it.

See `STATION_ROADMAP.md` for what each is queued to build.

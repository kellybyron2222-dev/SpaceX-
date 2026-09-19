# Contest loop report — 2026-09-19

Live: https://kellybyron2222-dev.github.io/SpaceX-/  
Repo: https://github.com/kellybyron2222-dev/SpaceX-/  
Vite `base` `/SpaceX-/`. Public educational approximations only (not SpaceX CAD / not official telemetry).

**Contest not submitted.** Shareable entry is a **Grok Bot** that opens this companion’s Live Launch **Commentator**. Play-by-play is in-app. Byron submits ~Sep 29.

## Readiness for ~Sep 29: **7 / 10**

The companion can be wrapped: Commentator play-by-play on the newest **playable Starship** VOD, Copy share deep-link, Learn English, ads/101/150 honesty. The Grok Bot template itself is documented, not built or submitted. YouTube ads cannot be stripped. Flight 13 NSF/SFN still block embeds (Watch on YouTube).

| Rubric | Score | Note |
| --- | --- | --- |
| Play-by-play vs VOD | 8 | English beat titles, VOD + T+ clock, Show hold, Start jumps to T-0 |
| Learn English | 7 | Catalog + chopsticks “pad arms, not on the rocket”; tags → Learn |
| Latest-VOD | 8 | Newest completed Starship that embeds; skip F13 101/150; not Falcon |
| Embed / ads honesty | 8 | Open on YouTube, Watch latest blocked, ads cannot be stripped |
| Deep-links | 8 | `?mode=live&commentary=1&phase=&video=` under `/SpaceX-/` |
| Bot wrap | 4 | README wrap steps only; Byron still submits ~Sep 29 |

## Loops 1–20 (what shipped)

| Loop | PR | Change |
| --- | --- | --- |
| 1 | [#44](https://github.com/kellybyron2222-dev/SpaceX-/pull/44) | Commentator English beat titles + VOD / T+ clock |
| 2 | [#45](https://github.com/kellybyron2222-dev/SpaceX-/pull/45) | Newest embeddable Starship VOD; skip Flight 13 `lC3RDO7tdLc` / `Ew0Xu1RT8oc` (IFrame 101/150) |
| 3 | [#46](https://github.com/kellybyron2222-dev/SpaceX-/pull/46) | Commentator **Copy share link** (playable `video=`, not blocked NSF unless loaded) |
| 4 | [#47](https://github.com/kellybyron2222-dev/SpaceX-/pull/47) | **Mute voice** (speechSynthesis only, not YouTube) |
| 5 | [#48](https://github.com/kellybyron2222-dev/SpaceX-/pull/48) | Collapse pre-T-0 hold; **Show hold** |
| 6 | [#49](https://github.com/kellybyron2222-dev/SpaceX-/pull/49) | Help: Copy share + bot query scheme |
| 7 | [#50](https://github.com/kellybyron2222-dev/SpaceX-/pull/50) | Idle Start one-liner (T-0 on newest playable Starship) |
| 8 | [#51](https://github.com/kellybyron2222-dev/SpaceX-/pull/51) | **Now playing** oEmbed title |
| 9 | [#52](https://github.com/kellybyron2222-dev/SpaceX-/pull/52) | README Live Launch demo: Start + Copy share |
| 10 | [#53](https://github.com/kellybyron2222-dev/SpaceX-/pull/53) | Live sidebar **Copy commentator link** |
| 11 | [#54](https://github.com/kellybyron2222-dev/SpaceX-/pull/54) | 44px Mute / Copy / Show hold; shorter phone Commentator |
| 12 | [#55](https://github.com/kellybyron2222-dev/SpaceX-/pull/55) | **Reset to latest playable Starship** |
| 13 | [#56](https://github.com/kellybyron2222-dev/SpaceX-/pull/56) | Tracker Starship **Live Launch** chip → Commentator |
| 14 | [#57](https://github.com/kellybyron2222-dev/SpaceX-/pull/57) | Learn Chopsticks: pad arms, not on the rocket |
| 15 | [#58](https://github.com/kellybyron2222-dev/SpaceX-/pull/58) | Tagged-components kicker → Learn |
| 16 | [#59](https://github.com/kellybyron2222-dev/SpaceX-/pull/59) | README Grok Bot wrap (paste Copy share URL) |
| 17 | [#60](https://github.com/kellybyron2222-dev/SpaceX-/pull/60) | Copy share title: ads cannot be stripped |
| 18 | [#61](https://github.com/kellybyron2222-dev/SpaceX-/pull/61) | Live Learn empty state: Start / Copy share / Hotspots |
| 19 | [#62](https://github.com/kellybyron2222-dev/SpaceX-/pull/62) | Header: Grok Bot companion, contest not submitted |
| 20 | this PR | This report + footer Copy-share / ads line |

Merges used `--merge` (not squash) after Pages `build` SUCCESS and `deploy` SKIPPED.

## Rejected (all loops)

- Photoreal / CAD meshes
- Stripping or skipping YouTube ads
- Falcon VOD as the nothing-live default
- Flight 13 NSF/SFN as in-page default when IFrame 101/150
- Second URL scheme (hash-only, extra path)
- Changing the default tab to Live Launch
- Re-merging #44 / #45
- Submitting the contest from this repo

## Remaining gaps

1. **Grok Bot not built or submitted.** README tells Byron to paste Copy share URL ~Sep 29.
2. **YouTube ads** stay in the embed (IFrame API cannot skip them).
3. **Flight 13** NSF `lC3RDO7tdLc` and SFN `Ew0Xu1RT8oc` still 101/150; in-page walks to the next Starship clip (e.g. other F13 or Flight 12). Watch on YouTube for the blocked newest.
4. Cue clocks are **educational approximations**, not official telemetry. Flight 5 recap uses recap seconds; long webcasts use surveyed T-0.
5. No live SpaceX official YouTube when the official stream is X-only.
6. Browser MCP was unavailable this run; UI checked via unit tests + Pages build, not a recorded booth walkthrough.

## How to demo (2 minutes)

1. Open https://kellybyron2222-dev.github.io/SpaceX-/?mode=live&commentary=1  
   or Live Launch → **Start commentary** → **Copy share link**.
2. If the picture is Flight 12 (or another playable Starship) instead of Flight 13 NSF: that is the 101/150 skip. **Watch … on YouTube** for the blocked newest.
3. Phase list starts at T-0; **Show hold** reveals prop load. **Mute voice** is speech, not YouTube.
4. Pick a tagged name or beat Learn chip. Chopsticks are pad arms.
5. Footer stays: not CAD, not official telemetry, ads cannot be stripped.

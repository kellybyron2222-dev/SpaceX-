# Teaching 3D iterate-loop report — 2026-09-19

Live: https://kellybyron2222-dev.github.io/SpaceX-/  
Repo: https://github.com/kellybyron2222-dev/SpaceX-/  
Vite `base` `/SpaceX-/`. Public educational approximations only (not SpaceX CAD / not official telemetry).

**Contest not submitted.** This loop did not wrap or ping the Grok Bot.

## Teaching 3D readiness: **8 / 10**

A novice can explode / isolate / cutaway / put back, compare Super Heavy and Starship to a person and Falcon 9, stand a person next to a ~3 m Raptor, read Why this shape on the stack, engines, heat-shield panel, and tower, and match the gulf-side webcast pose. Isolate no longer leaves Falcon glowing. Why-tiles shows a black belly, not a gold hex strip. Phones keep the stack on screen when Why is open.

Not a 9: the 1.8 m person is still a small mark at fullstack distance (honest scale), phone Why still uses a large caption panel, and meshes stay textbook — not hangar CAD.

| Surface | Score | Note |
| --- | --- | --- |
| Peel (explode / isolate / cutaway / reassemble) | 8 | Isolate fades scale refs; cutaway stays independent of Put back |
| Scale (person / Falcon) | 9 | Vehicles get person + Falcon. Raptor and compare get a person only (no 70 m Falcon in a 3 m frame) |
| Why this shape | 9 | Stack, Starship, Super Heavy, compare, Raptor, heat-shield panel, Mechazilla. Tiles stay black |
| Raptor vs Merlin | 9 | Same camera; person between the bells; Why isolates two preburners vs one gas generator |
| Match webcast | 8 | Tower left, stack right. Idle rotate pauses |
| Phone chrome | 7 | Duplicate callout gone; Why isolate does not zoom to a black field |
| Learn copy next to those models | 8 | No new slop found beside peel / compare / tiles |

## Passes (9 fixes, then stop)

Stopped after pass 11 review — no further user-visible in-scope bug. Not 20 no-op PRs.

| Pass | PR | Change |
| --- | --- | --- |
| 1 | [#69](https://github.com/kellybyron2222-dev/SpaceX-/pull/69) | Isolate fades the person and Falcon 9 (`skipFrame` is camera-only) |
| 2 | [#70](https://github.com/kellybyron2222-dev/SpaceX-/pull/70) | Why-tiles frames the instance spread, not one hex |
| 3 | [#71](https://github.com/kellybyron2222-dev/SpaceX-/pull/71) | Isolated heat-shield tiles stay black |
| 4 | [#72](https://github.com/kellybyron2222-dev/SpaceX-/pull/72) | Scale on Starship-only; Falcon stays in the camera box |
| 5 | [#73](https://github.com/kellybyron2222-dev/SpaceX-/pull/73) | High-vis scale person |
| 6 | [#74](https://github.com/kellybyron2222-dev/SpaceX-/pull/74) | Phone Why hides the duplicate callout; isolate stays in the current frame |
| 7 | [#75](https://github.com/kellybyron2222-dev/SpaceX-/pull/75) | Why on Raptor and Mechazilla; ghost booster stays visible for “9 m” |
| 8 | [#76](https://github.com/kellybyron2222-dev/SpaceX-/pull/76) | First stop report (8/10). Later passes continued. |
| 9 | [#77](https://github.com/kellybyron2222-dev/SpaceX-/pull/77) | Person scale on Raptor and Raptor vs Merlin |
| 10 | [#78](https://github.com/kellybyron2222-dev/SpaceX-/pull/78) | Why this shape on the heat-shield panel |
| 11 | — | Review only. Stop |

Did not re-merge #64–#69.

## Out of scope (held)

- Contest / Grok Bot wrap / submitting
- Stripping YouTube ads
- Forcing Flight 13 NSF/SFN in-page
- CAD / photoreal hangar-matching
- Falcon as the no-live VOD default

## Evidence

Store screenshots: `/cursor/stores/bc-c6c31494-8a76-5edb-a0f2-d795af5d9c59/media/iterate-loop/`

Pass logs: `/cursor/stores/bc-c6c31494-8a76-5edb-a0f2-d795af5d9c59/internal/iterate-loop/`

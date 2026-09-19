import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";
import { catalogById } from "../catalog.js";
import {
  beatAtClock,
  beatAtTime,
  beatById,
  cuesUrl,
  latestSheetVideoId,
  missionBeats,
  missionSecondsAtVideoClock,
  normalizeBeat,
  normalizePack,
  pickSheet,
  recapBeats,
  resolveT0Offset,
  beatTitle,
} from "./cues.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
const pack = normalizePack(JSON.parse(readFileSync(join(root, "public/broadcast/cues.json"), "utf8")));
const overlayConfig = JSON.parse(readFileSync(join(root, "src/data/live/overlays.json"), "utf8"));
const hotspotIds = new Set(
  (overlayConfig.presets || []).flatMap((p) => (p.hotspots || []).map((h) => h.id)),
);

describe("broadcast cue JSON from #33", () => {
  it("ships Flight 5, Flight 13, and generic T+ phases", () => {
    assert.match(pack.schema, /broadcast-cues/);
    assert.match(pack.disclaimer, /not official/i);
    assert.ok(pack.sheets.some((s) => s.id === "flight-5"));
    assert.ok(pack.sheets.some((s) => s.id === "flight-13"));
    assert.ok(pack.sheets.some((s) => s.id === "generic-launch-test"));
    assert.equal(latestSheetVideoId(pack), "lC3RDO7tdLc");
  });

  it("keeps beats bot-readable with clock, cue, optional hotspot + Learn", () => {
    for (const sheet of pack.sheets) {
      assert.ok(sheet.beats.length >= 5, sheet.id);
      for (const beat of sheet.beats) {
        assert.ok(beat.phase, `${sheet.id} missing phase`);
        assert.ok(beat.clock, `${beat.id} missing clock`);
        assert.ok(beat.cue, `${beat.id} missing cue`);
        assert.ok(beat.event, `${beat.id} missing event title`);
        assert.equal(beatTitle(beat), beat.event);
        assert.equal(beat.cue.includes("\n"), false, `${beat.id} should be one line`);
        if (beat.learnId) assert.ok(catalogById(beat.learnId), beat.learnId);
        if (beat.hotspotId) assert.ok(hotspotIds.has(beat.hotspotId), beat.hotspotId);
        for (const hid of beat.hotspotIds || []) assert.ok(hotspotIds.has(hid), hid);
        for (const lid of beat.learnIds || []) assert.ok(catalogById(lid), lid);
      }
    }
  });

  it("maps the Flight 5 recap id and catch chapter", () => {
    const sheet = pickSheet(pack, "hI9HQfCAw64");
    assert.equal(sheet.id, "flight-5");
    assert.equal(sheet.videoId, overlayConfig.defaultVideoId);
    const catchBeat = beatById(sheet, "catch");
    assert.equal(catchBeat.recapSeconds, 100);
    assert.equal(catchBeat.clockSeconds, 414);
    assert.equal(catchBeat.learnId, "chopsticks");
    assert.equal(catchBeat.presetId, "catch-chopsticks");
    const recap = recapBeats(sheet);
    assert.ok(recap.some((b) => b.phase === "liftoff"));
    assert.equal(beatAtClock(recap, 100, "recapSeconds").phase, "catch");
    assert.equal(pickSheet(pack, "dQw4w9WgXcQ").id, "generic-launch-test");
  });

  it("binds Flight 13 aliases and maps webcast clock 3:05:36 / 3:07:46 to early ascent", () => {
    const sheet = pickSheet(pack, "lC3RDO7tdLc");
    assert.equal(sheet.id, "flight-13");
    assert.equal(pickSheet(pack, "uI6pKTGyNq4").id, "flight-13");
    assert.equal(sheet.t0OffsetSeconds, 11136);
    assert.equal(resolveT0Offset(sheet, { webcastPick: { youtubeId: "lC3RDO7tdLc", t0Offset: 11118 }, videoId: "lC3RDO7tdLc" }), 11136);
    const lift = beatById(sheet, "liftoff");
    assert.equal(lift.clockSeconds, 0);
    assert.equal(lift.event, "Liftoff");
    assert.equal(beatTitle(lift), "Liftoff");
    assert.equal(beatTitle(beatById(sheet, "meco")), "Super Heavy MECO");
    assert.equal(lift.learnId, "mechazilla-tower");
    assert.ok(lift.hotspotIds.length > 1);
    assert.ok(lift.learnIds.includes("booster-cluster"));
    assert.ok(lift.learnIds.includes("chopsticks"));
    assert.equal(lift.learnIds.includes("grid-fins"), false);
    const splash = beatById(sheet, "splashdown");
    assert.equal(splash.clockSeconds, 3921);
    const mission = missionBeats(sheet);
    assert.equal(beatAtClock(mission, 0, "clockSeconds").phase, "liftoff");
    assert.equal(beatAtClock(mission, 141, "clockSeconds").phase, "hot-staging");

    const t0 = sheet.t0OffsetSeconds;
    const atLiftoffShot = missionSecondsAtVideoClock(3 * 3600 + 5 * 60 + 36, t0);
    const atAscentShot = missionSecondsAtVideoClock(3 * 3600 + 7 * 60 + 46, t0);
    assert.equal(atLiftoffShot, 0);
    assert.equal(atAscentShot, 130);
    const liftBeat = beatAtClock(mission, atLiftoffShot, "clockSeconds");
    const climbBeat = beatAtClock(mission, atAscentShot, "clockSeconds");
    assert.equal(liftBeat.phase, "liftoff");
    assert.ok(liftBeat.hotspotIds.length >= 4);
    assert.equal(["boostback", "catch", "landing-burn"].includes(climbBeat.phase), false);
    assert.equal(climbBeat.learnId === "grid-fins", false);
    assert.match(climbBeat.cue, /ascent|climb/i);
    assert.equal(/grid.?fin|catch/i.test(climbBeat.cue), false);
    assert.equal(climbBeat.hotspotIds.includes("pad-grid-fins"), false);
    assert.equal(climbBeat.learnIds.includes("grid-fins"), false);
    assert.equal(climbBeat.learnIds.includes("chopsticks"), false);
  });

  it("gives generic phases clockSeconds so an unmatched VOD can follow T+", () => {
    const generic = pickSheet(pack, "dQw4w9WgXcQ");
    const lift = beatById(generic, "liftoff");
    assert.equal(lift.clockSeconds, 0);
    assert.ok(missionBeats(generic).length >= 8);
  });
});

describe("beat helpers", () => {
  it("accepts hotspot / learn / overlayPreset aliases from the broadcast sheet", () => {
    const beat = normalizeBeat({
      phase: "flaps",
      clock: "flaps",
      line: "Flaps out.",
      hotspot: "pad-flaps",
      learn: "flaps",
      overlayPresetId: "stack-on-pad",
      recapSeconds: 12,
    });
    assert.equal(beat.id, "flaps");
    assert.equal(beat.hotspotId, "pad-flaps");
    assert.deepEqual(beat.hotspotIds, ["pad-flaps"]);
    assert.equal(beat.learnId, "flaps");
    assert.deepEqual(beat.learnIds, ["flaps"]);
    assert.equal(beat.presetId, "stack-on-pad");
    assert.equal(beat.recapSeconds, 12);
    assert.equal(beat.cue, "Flaps out.");
    assert.equal(beat.event, "");
    assert.equal(beatTitle(beat), "flaps");
    assert.equal(beatTitle(normalizeBeat({ phase: "hot-staging", event: "Hot-staging", cue: "x", clock: "T+0" })), "Hot-staging");
  });

  it("merges hotspotIds / learnIds lists on a beat", () => {
    const beat = normalizeBeat({
      id: "multi",
      phase: "liftoff",
      clock: "T+0",
      cue: "Pad hardware in frame.",
      hotspotIds: ["pad-tower", "pad-chopsticks"],
      hotspotId: "pad-raptors",
      learnIds: ["mechazilla-tower", "chopsticks"],
      learnId: "booster-cluster",
    });
    assert.deepEqual(beat.hotspotIds, ["pad-tower", "pad-chopsticks", "pad-raptors"]);
    assert.deepEqual(beat.learnIds, ["mechazilla-tower", "chopsticks", "booster-cluster"]);
    assert.equal(beat.hotspotId, "pad-tower");
    assert.equal(beat.learnId, "mechazilla-tower");
  });

  it("lets a surveyed sheet T-0 beat LL2 start vs NET", () => {
    const recap = pickSheet(pack, "hI9HQfCAw64");
    assert.equal(resolveT0Offset(recap), null);
    const generic = pickSheet(pack, "dQw4w9WgXcQ");
    assert.equal(resolveT0Offset(generic, { webcastPick: { youtubeId: "dQw4w9WgXcQ", t0Offset: 99 }, videoId: "dQw4w9WgXcQ" }), 99);
  });

  it("picks the latest beat at or before t", () => {
    const beats = [
      normalizeBeat({ id: "a", t: 0, cue: "A", clock: "0", phase: "a" }),
      normalizeBeat({ id: "b", t: 10, cue: "B", clock: "10", phase: "b" }),
      normalizeBeat({ id: "c", t: 20, cue: "C", clock: "20", phase: "c" }),
    ];
    assert.equal(beatAtTime(beats, 0).id, "a");
    assert.equal(beatAtTime(beats, 10).id, "b");
    assert.equal(beatAtTime(beats, 19.9).id, "b");
    assert.equal(beatAtTime(beats, 21).id, "c");
  });

  it("builds a Pages-safe broadcast cues URL", () => {
    assert.equal(cuesUrl("/SpaceX-/"), "/SpaceX-/broadcast/cues.json");
    assert.equal(cuesUrl("/"), "/broadcast/cues.json");
  });
});

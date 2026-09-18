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
  normalizeBeat,
  normalizePack,
  pickSheet,
  recapBeats,
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
        assert.equal(beat.cue.includes("\n"), false, `${beat.id} should be one line`);
        if (beat.learnId) assert.ok(catalogById(beat.learnId), beat.learnId);
        if (beat.hotspotId) assert.ok(hotspotIds.has(beat.hotspotId), beat.hotspotId);
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

  it("binds Flight 13 aliases and maps liftoff / splash to public T+", () => {
    const sheet = pickSheet(pack, "lC3RDO7tdLc");
    assert.equal(sheet.id, "flight-13");
    assert.equal(pickSheet(pack, "uI6pKTGyNq4").id, "flight-13");
    assert.equal(sheet.t0OffsetSeconds, 11118);
    const lift = beatById(sheet, "liftoff");
    assert.equal(lift.clockSeconds, 0);
    assert.equal(lift.learnId, "booster-cluster");
    const splash = beatById(sheet, "splashdown");
    assert.equal(splash.clockSeconds, 3921);
    const mission = missionBeats(sheet);
    assert.equal(beatAtClock(mission, 0, "clockSeconds").phase, "liftoff");
    assert.equal(beatAtClock(mission, 141, "clockSeconds").phase, "hot-staging");
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
    assert.equal(beat.learnId, "flaps");
    assert.equal(beat.presetId, "stack-on-pad");
    assert.equal(beat.recapSeconds, 12);
    assert.equal(beat.cue, "Flaps out.");
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

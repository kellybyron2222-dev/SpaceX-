import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  relatedIdsForLaunch,
  sceneForLaunch,
  trackerCountdown,
  trackerWhenLine,
} from "./launches.js";

describe("Crew mapping uses mission name, not pad only", () => {
  it("Crew-13 at SLC-40 gets the Crew access arm and falcon-pad scene", () => {
    const vehicle = "Falcon 9 Block 5";
    const pad = "Space Launch Complex 40";
    const site = "Cape Canaveral SFS, Florida";
    const mission = "Crew-13";
    assert.equal(relatedIdsForLaunch(vehicle, pad, site, mission).includes("crew-access"), true);
    assert.equal(sceneForLaunch(vehicle, pad, site, mission), "falcon-pad");
  });

  it("Dragon crew rotation at 39A still gets the arm", () => {
    const ids = relatedIdsForLaunch(
      "Falcon 9",
      "Launch Complex 39A",
      "Kennedy Space Center, FL",
      "Dragon crew rotation (sample)",
    );
    assert.equal(ids.includes("crew-access"), true);
    assert.equal(
      sceneForLaunch("Falcon 9", "Launch Complex 39A", "Kennedy Space Center, FL", "Dragon crew rotation (sample)"),
      "falcon-pad",
    );
  });

  it("non-crew 39A Heavy (NROL-97) does not get CAA; scene stays falcon-heavy", () => {
    const ids = relatedIdsForLaunch(
      "Falcon Heavy",
      "Launch Complex 39A",
      "Kennedy Space Center, FL",
      "NROL-97",
    );
    assert.equal(ids.includes("crew-access"), false);
    assert.equal(
      sceneForLaunch("Falcon Heavy", "Launch Complex 39A", "Kennedy Space Center, FL", "NROL-97"),
      "falcon-heavy",
    );
  });

  it("Cargo Dragon / CRS does not get the Crew access arm", () => {
    const ids = relatedIdsForLaunch(
      "Falcon 9",
      "Space Launch Complex 40",
      "Cape Canaveral SFS, FL",
      "CRS teaching slot (sample)",
    );
    assert.equal(ids.includes("crew-access"), false);
  });

  it("Starlink-titled Starship Flight 14 stays Starship-only (mission is not in the vehicle blob)", () => {
    const vehicle = "Starship";
    const pad = "Orbital Launch Mount";
    const site = "Boca Chica, TX";
    const mission = "Starlink Group 31-1 (Starship Flight 14)";
    const ids = relatedIdsForLaunch(vehicle, pad, site, mission);
    assert.equal(ids.includes("merlin"), false);
    assert.equal(ids.includes("crew-access"), false);
    assert.equal(ids.includes("raptor"), true);
    assert.equal(sceneForLaunch(vehicle, pad, site, mission), "mechazilla");
  });
});

describe("Tracker window and placeholder NET", () => {
  it("uses one Window line without a duplicated date or extra UTC", () => {
    const line = trackerWhenLine({
      net: "2026-09-20T01:47:00Z",
      windowStart: "2026-09-20T01:47:00Z",
      windowEnd: "2026-09-20T05:47:00Z",
      statusLabel: "Go",
    });
    assert.equal(line, "20 Sep 2026 · Window 01:47–05:47 UTC");
    assert.equal((line.match(/UTC/g) || []).length, 1);
  });

  it("TBD midnight UTC shows NET month and omits a fake T−", () => {
    const launch = {
      net: "2026-10-31T00:00:00Z",
      status: "scheduled",
      statusLabel: "TBD",
    };
    assert.equal(trackerWhenLine(launch), "NET Oct 2026");
    assert.equal(trackerCountdown(launch), "");
  });

  it("TBD with a real clock still shows a countdown", () => {
    const launch = {
      net: "2026-12-04T15:20:00Z",
      status: "scheduled",
      statusLabel: "TBD",
    };
    assert.match(trackerCountdown(launch), /^T[−+]/);
    assert.equal(trackerWhenLine(launch).startsWith("NET "), false);
  });
});

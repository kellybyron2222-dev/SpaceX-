import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  findLatestCompletedWebcast,
  findLiveWebcast,
  isStaleDefaultId,
  officialStyleScore,
  pickLaunchWebcast,
  resolveAutoWebcast,
  t0OffsetSeconds,
} from "./webcast.js";

const flight13 = {
  id: "f13",
  mission: "Starship Flight 13",
  vehicle: "Starship",
  pad: "Orbital Launch Mount",
  site: "Starbase, TX",
  net: "2026-07-24T22:51:00Z",
  status: "success",
  webcastLive: false,
  webcasts: [
    {
      publisher: "The Space Devs",
      type: "Unofficial Re-stream",
      title: "SpaceX Flight 13",
      url: "https://www.youtube.com/watch?v=7dMblISWtz8",
      live: false,
      start_time: "2026-07-25T00:32:59Z",
    },
    {
      publisher: "NASASpaceflight",
      type: "Unofficial Webcast",
      title: "SpaceX Starship Flight 13 - Launch & Landing",
      url: "https://www.youtube.com/watch?v=lC3RDO7tdLc",
      live: false,
      start_time: "2026-07-24T19:45:42Z",
    },
    {
      publisher: "SpaceX",
      type: "Official Webcast",
      title: "Starship's Thirteenth Flight Test",
      url: "https://x.com/i/broadcasts/1AJEmmYdMDnJL",
      live: false,
      start_time: "2026-07-24T22:15:55Z",
    },
  ],
};

const liveFalcon = {
  id: "f9-live",
  mission: "Starlink Group 6-1",
  vehicle: "Falcon 9",
  pad: "SLC-40",
  site: "Cape Canaveral",
  net: "2026-09-18T18:00:00Z",
  status: "in-flight",
  webcastLive: true,
  webcasts: [
    {
      publisher: "SpaceX",
      type: "Official Webcast",
      title: "SpaceX Falcon 9 launch",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      live: true,
    },
  ],
};

describe("official-style webcast pick", () => {
  it("prefers an embeddable unofficial webcast over an X-only official and a restream", () => {
    const clip = pickLaunchWebcast(flight13);
    assert.equal(clip.youtubeId, "lC3RDO7tdLc");
    assert.ok(officialStyleScore(clip) > officialStyleScore(flight13.webcasts[0]));
  });

  it("maps NSF Flight 13 start vs public NET to a VOD T-0 offset", () => {
    const clip = pickLaunchWebcast(flight13);
    assert.equal(t0OffsetSeconds(clip, flight13), 11118);
  });

  it("treats a post-NET rehost as T-0 at 0:00", () => {
    assert.equal(t0OffsetSeconds(flight13.webcasts[0], flight13), 0);
  });
});

describe("resolveAutoWebcast", () => {
  const bundle = { upcoming: [], recent: [flight13] };

  it("uses a query / paste before LL2", () => {
    assert.equal(resolveAutoWebcast({ bundle, queryId: "hI9HQfCAw64" }).reason, "query");
    assert.equal(resolveAutoWebcast({ bundle, storedId: "hI9HQfCAw64" }).reason, "paste");
  });

  it("selects the latest completed Starship VOD when nothing is live", () => {
    const pick = resolveAutoWebcast({ bundle, fallbackId: "hI9HQfCAw64" });
    assert.equal(pick.reason, "latest-completed");
    assert.equal(pick.youtubeId, "lC3RDO7tdLc");
    assert.equal(pick.live, false);
    assert.equal(pick.t0Offset, 11118);
    assert.equal(findLiveWebcast(bundle), null);
    assert.equal(findLatestCompletedWebcast(bundle).mission, "Starship Flight 13");
  });

  it("prefers a live Falcon webcast over a completed Starship VOD", () => {
    const pick = resolveAutoWebcast({
      bundle: { upcoming: [liveFalcon], recent: [flight13] },
      fallbackId: "hI9HQfCAw64",
    });
    assert.equal(pick.reason, "live");
    assert.equal(pick.youtubeId, "dQw4w9WgXcQ");
  });

  it("falls back to the cue-sheet latest id, then Flight 5", () => {
    assert.equal(resolveAutoWebcast({ latestSheetVideoId: "lC3RDO7tdLc" }).reason, "cue-sheet");
    assert.equal(resolveAutoWebcast({ fallbackId: "hI9HQfCAw64" }).youtubeId, "hI9HQfCAw64");
  });

  it("treats the Flight 5 recap id as a stale default, not a user paste", () => {
    assert.equal(isStaleDefaultId("hI9HQfCAw64", "hI9HQfCAw64"), true);
    assert.equal(isStaleDefaultId("lC3RDO7tdLc", "hI9HQfCAw64"), false);
  });
});

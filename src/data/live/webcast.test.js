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
      publisher: "Spaceflight Now",
      type: "Unofficial Webcast",
      title: "Watch Live: SpaceX Starship launches on 13th test flight",
      url: "https://www.youtube.com/watch?v=Ew0Xu1RT8oc",
      live: false,
    },
    {
      publisher: "Everyday Astronaut",
      type: "Unofficial Webcast",
      title: "LIVE: SpaceX Starship Flight 13 launch (full)",
      url: "https://www.youtube.com/watch?v=-pR0eOj9hK0",
      live: false,
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

const flight12 = {
  id: "f12",
  mission: "Starship Flight 12",
  vehicle: "Starship",
  pad: "Orbital Launch Mount",
  site: "Starbase, TX",
  net: "2026-05-22T22:30:24Z",
  status: "success",
  webcastLive: false,
  webcasts: [
    {
      publisher: "NASASpaceflight",
      type: "Unofficial Webcast",
      title: "SpaceX Starship Flight 12",
      url: "https://www.youtube.com/watch?v=UfQHy4mVcBo",
      live: false,
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

  it("selects the newest completed Starship VOD that is not iframe-blocked", () => {
    const pick = resolveAutoWebcast({ bundle, fallbackId: "hI9HQfCAw64" });
    assert.equal(pick.reason, "latest-completed");
    assert.equal(pick.youtubeId, "-pR0eOj9hK0");
    assert.equal(pick.mission, "Starship Flight 13");
    assert.equal(pick.blockedLatest.youtubeId, "lC3RDO7tdLc");
    assert.equal(findLiveWebcast(bundle), null);
    assert.equal(findLatestCompletedWebcast(bundle).youtubeId, "lC3RDO7tdLc");
  });

  it("prefers a live Falcon webcast over a completed Starship VOD", () => {
    const pick = resolveAutoWebcast({
      bundle: { upcoming: [liveFalcon], recent: [flight13] },
      fallbackId: "hI9HQfCAw64",
    });
    assert.equal(pick.reason, "live");
    assert.equal(pick.youtubeId, "dQw4w9WgXcQ");
  });

  it("falls back to an embeddable Starship recap when every listed Starship id is blocked", () => {
    assert.equal(
      resolveAutoWebcast({ latestSheetVideoId: "lC3RDO7tdLc", fallbackId: "hI9HQfCAw64" }).reason,
      "embed-fallback",
    );
    assert.equal(resolveAutoWebcast({ fallbackId: "hI9HQfCAw64" }).youtubeId, "hI9HQfCAw64");
  });

  it("does not let a recent Falcon VOD beat a blocked Starship flight — uses the Starship recap", () => {
    const falconDone = {
      ...liveFalcon,
      id: "f9-done",
      status: "success",
      webcastLive: false,
      webcasts: [{ ...liveFalcon.webcasts[0], live: false }],
    };
    const pick = resolveAutoWebcast({
      bundle: { upcoming: [], recent: [falconDone] },
      latestSheetVideoId: "lC3RDO7tdLc",
      fallbackId: "hI9HQfCAw64",
    });
    assert.equal(pick.reason, "embed-fallback");
    assert.equal(pick.youtubeId, "hI9HQfCAw64");
    assert.equal(pick.blockedLatest.youtubeId, "lC3RDO7tdLc");
  });

  it("treats the Flight 5 recap id as a stale default, not a user paste", () => {
    assert.equal(isStaleDefaultId("hI9HQfCAw64", "hI9HQfCAw64"), true);
    assert.equal(isStaleDefaultId("lC3RDO7tdLc", "hI9HQfCAw64"), false);
    assert.equal(isStaleDefaultId("lC3RDO7tdLc", "hI9HQfCAw64", ["lC3RDO7tdLc"]), true);
  });

  it("skips iframe-blocked Flight 13 ids to the next completed Starship VOD, not a Falcon recap", () => {
    const pick = resolveAutoWebcast({
      bundle: { upcoming: [], recent: [flight13, flight12] },
      fallbackId: "hI9HQfCAw64",
      latestSheetVideoId: "lC3RDO7tdLc",
      iframeBlockedIds: ["lC3RDO7tdLc", "Ew0Xu1RT8oc", "-pR0eOj9hK0", "7dMblISWtz8"],
    });
    assert.equal(pick.reason, "latest-completed");
    assert.equal(pick.youtubeId, "UfQHy4mVcBo");
    assert.equal(pick.mission, "Starship Flight 12");
    assert.equal(pick.blockedLatest.youtubeId, "lC3RDO7tdLc");
    const pasted = resolveAutoWebcast({
      bundle: { upcoming: [], recent: [flight13, flight12] },
      queryId: "lC3RDO7tdLc",
      fallbackId: "hI9HQfCAw64",
    });
    assert.equal(pasted.reason, "query");
    assert.equal(pasted.youtubeId, "lC3RDO7tdLc");
  });
});

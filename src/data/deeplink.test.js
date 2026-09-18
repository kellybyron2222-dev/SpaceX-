import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  hasDeepLink,
  inferredMode,
  parseDeepLink,
  replaceShareUrl,
  serializeDeepLink,
} from "./deeplink.js";

describe("parseDeepLink", () => {
  it("reads Learn catalog ids from the query", () => {
    const link = parseDeepLink("?mode=learn&id=raptor", "");
    assert.equal(link.mode, "learn");
    assert.equal(link.id, "raptor");
    assert.equal(hasDeepLink(link), true);
  });

  it("reads Explore scenes and Live presets", () => {
    assert.equal(parseDeepLink("mode=explore&scene=raptor").scene, "raptor");
    const live = parseDeepLink("?mode=live&preset=catch-chopsticks&hotspot=chopsticks&hotspots=1");
    assert.equal(live.mode, "live");
    assert.equal(live.preset, "catch-chopsticks");
    assert.equal(live.id, "chopsticks");
    assert.equal(live.hotspots, true);
  });

  it("accepts hash links and lets query win per key", () => {
    const hashed = parseDeepLink("", "#mode=learn&id=raptor");
    assert.equal(hashed.mode, "learn");
    assert.equal(hashed.id, "raptor");
    const mixed = parseDeepLink("?mode=live&preset=stack-on-pad", "#?mode=learn&id=raptor");
    assert.equal(mixed.mode, "live");
    assert.equal(mixed.preset, "stack-on-pad");
    assert.equal(mixed.id, "raptor");
  });

  it("does not treat the Pages base path as a param", () => {
    const link = parseDeepLink("", "");
    assert.equal(hasDeepLink(link), false);
    assert.equal(inferredMode(link), "");
    assert.equal(serializeDeepLink({ mode: "explore", scene: "fullstack" }), "");
  });
});

describe("serializeDeepLink", () => {
  it("round-trips bot examples", () => {
    assert.equal(serializeDeepLink({ mode: "learn", id: "raptor" }), "mode=learn&id=raptor");
    assert.equal(serializeDeepLink({ mode: "explore", scene: "raptor" }), "mode=explore&scene=raptor");
    assert.equal(
      serializeDeepLink({ mode: "live", preset: "catch-chopsticks", hotspots: true }),
      "mode=live&preset=catch-chopsticks&hotspots=1",
    );
    assert.equal(
      serializeDeepLink({ mode: "live", preset: "catch-chopsticks", commentary: true, phase: "catch" }),
      "mode=live&preset=catch-chopsticks&commentary=1&phase=catch",
    );
  });

  it("reads Live commentary bits without a second URL scheme", () => {
    const live = parseDeepLink("?mode=live&commentary=1&phase=catch&youtube=hI9HQfCAw64");
    assert.equal(live.mode, "live");
    assert.equal(live.commentary, true);
    assert.equal(live.phase, "catch");
    assert.equal(live.video, "hI9HQfCAw64");
    assert.equal(inferredMode(parseDeepLink("commentary=start&phase=liftoff")), "live");
    assert.equal(parseDeepLink("?mode=learn&id=raptor").commentary, false);
  });

  it("infers a tab when mode is omitted", () => {
    assert.equal(inferredMode(parseDeepLink("id=raptor")), "learn");
    assert.equal(inferredMode(parseDeepLink("scene=mechazilla")), "explore");
    assert.equal(inferredMode(parseDeepLink("preset=stack-on-pad")), "live");
  });
});

describe("replaceShareUrl", () => {
  it("rewrites query on /SpaceX-/ and drops the hash", () => {
    const calls = [];
    const loc = { pathname: "/SpaceX-/", search: "", hash: "#mode=learn&id=raptor" };
    const next = replaceShareUrl("mode=learn&id=raptor", loc, {
      replaceState(_s, _t, url) {
        calls.push(url);
      },
    });
    assert.equal(next, "/SpaceX-/?mode=learn&id=raptor");
    assert.deepEqual(calls, ["/SpaceX-/?mode=learn&id=raptor"]);
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG, catalogById } from "./catalog.js";

const SLOP = /lede above|at a glance|short briefing|delve|in the realm of|plays a crucial|robust /i;

describe("public-figure catalog copy", () => {
  it("has 24 teaching entries", () => {
    assert.equal(CATALOG.length, 24);
  });

  it("gives every card a spoken overview", () => {
    for (const e of CATALOG) {
      assert.ok(e.overview && e.overview.length > 40, e.id);
      const blob = `${e.blurb} ${e.overview} ${e.history} ${e.function}`;
      assert.equal(SLOP.test(blob), false, e.id);
    }
  });

  it("explains heat-shield tiles in concrete English", () => {
    const e = catalogById("tiles");
    assert.match(e.overview, /belly/i);
    assert.match(e.overview, /ceramic tiles/i);
    assert.match(e.overview, /teaching stand-in/i);
    assert.equal(/lede|at a glance/i.test(e.overview), false);
  });

  it("puts both Starship landing headers in the nose, not LOX aft", () => {
    const e = catalogById("payload-bay");
    const blob = `${e.function} ${e.physics}`.toLowerCase();
    assert.equal(blob.includes("lox header sits aft"), false);
    assert.equal(blob.includes("ch4-forward / lox-aft"), true);
    assert.match(e.function, /LOX at the nose tip/i);
  });

  it("does not call Super Heavy’s thrust structure an octaweb", () => {
    const e = catalogById("booster-cluster");
    assert.match(e.history, /thrust puck/i);
    assert.match(e.history, /octaweb is the Falcon 9/i);
  });

  it("lists chopsticks as pad GSE, not vehicle hardware", () => {
    assert.equal(catalogById("chopsticks").domain, "ground");
  });
});

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { CATALOG, catalogById } from "./catalog.js";
import { fillReferenceFigure, photoForCatalog, photoSrc } from "./referencePhotos.js";

describe("licensed hardware stills", () => {
  it("maps the Raptor card to a Wikimedia CC BY-SA still", () => {
    const photo = photoForCatalog("raptor");
    assert.ok(photo);
    assert.equal(photo.file, "raptor-hawthorne.jpg");
    assert.match(photo.caption, /textbook teaching model/i);
    assert.match(photo.caption, /real hardware/i);
    assert.equal(photo.license, "CC BY-SA 4.0");
    assert.match(photo.pageUrl, /commons\.wikimedia\.org/);
    assert.match(photoSrc(photo), /refs\/raptor-hawthorne\.jpg$/);
  });

  it("reuses the Raptor still on the Live Raptor-cluster hotspot id", () => {
    const photo = photoForCatalog("booster-cluster");
    assert.equal(photo, photoForCatalog("raptor"));
    assert.ok(catalogById("booster-cluster"));
  });

  it("does not invent stills for cards without a licensed file", () => {
    assert.equal(photoForCatalog("flaps"), null);
    assert.equal(photoForCatalog(""), null);
  });

  it("only aliases real catalog ids", () => {
    for (const id of ["raptor", "booster-cluster"]) {
      assert.ok(CATALOG.some((e) => e.id === id), id);
    }
  });

  it("hides the figure when there is no photo", () => {
    const figure = { hidden: false, classList: { add() {}, remove() {} } };
    const img = { alt: "x", removeAttribute() { this.src = undefined; } };
    fillReferenceFigure(figure, { img }, null);
    assert.equal(figure.hidden, true);
  });
});

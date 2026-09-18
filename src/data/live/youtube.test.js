import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  fetchYouTubeOembed,
  oembedMeansMissingVideo,
  parseYouTubeId,
  youtubeIdRejectReason,
} from "./youtube.js";

const VIDEO = "hI9HQfCAw64";

describe("parseYouTubeId", () => {
  it("accepts a bare 11-character video ID", () => {
    assert.equal(parseYouTubeId(VIDEO), VIDEO);
  });

  it("accepts watch, youtu.be, embed, shorts, and live video URLs", () => {
    assert.equal(parseYouTubeId(`https://www.youtube.com/watch?v=${VIDEO}`), VIDEO);
    assert.equal(parseYouTubeId(`https://youtu.be/${VIDEO}`), VIDEO);
    assert.equal(parseYouTubeId(`https://youtu.be/${VIDEO}?si=abc`), VIDEO);
    assert.equal(parseYouTubeId(`https://www.youtube.com/embed/${VIDEO}`), VIDEO);
    assert.equal(parseYouTubeId(`https://www.youtube.com/shorts/${VIDEO}`), VIDEO);
    assert.equal(parseYouTubeId(`https://www.youtube.com/live/${VIDEO}`), VIDEO);
    assert.equal(parseYouTubeId(`https://m.youtube.com/watch?v=${VIDEO}`), VIDEO);
    assert.equal(parseYouTubeId(`https://www.youtube-nocookie.com/embed/${VIDEO}`), VIDEO);
    assert.equal(parseYouTubeId(`youtube.com/watch?v=${VIDEO}`), VIDEO);
  });

  it("keeps the video ID when a watch URL also has a playlist", () => {
    assert.equal(
      parseYouTubeId(`https://www.youtube.com/watch?v=${VIDEO}&list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf`),
      VIDEO,
    );
  });

  it("rejects playlists, channels, and handles instead of scraping 11 chars", () => {
    assert.equal(parseYouTubeId("https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"), null);
    assert.equal(parseYouTubeId("https://www.youtube.com/channel/UCsCoitvLFVBn3CnbgRZH0qQ"), null);
    assert.equal(parseYouTubeId("https://www.youtube.com/@SpaceX"), null);
    assert.equal(parseYouTubeId("https://www.youtube.com/c/SpaceX"), null);
    assert.equal(parseYouTubeId("https://www.youtube.com/user/spacexchannel"), null);
    assert.equal(parseYouTubeId("https://www.youtube.com/live"), null);
    assert.equal(parseYouTubeId("PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf"), null);
  });

  it("does not take the first 11 characters of a longer blob", () => {
    assert.equal(parseYouTubeId("UCsCoitvLFVBn3CnbgRZH0qQ"), null);
    assert.equal(parseYouTubeId("helloworld1XXXX"), null);
    assert.equal(parseYouTubeId("xxhelloworld1"), null);
    assert.equal(parseYouTubeId("not-a-video-id"), null);
    assert.equal(parseYouTubeId("not a youtube link at all"), null);
    assert.equal(parseYouTubeId(`Flight 5 recap ${VIDEO}`), null);
  });

  it("still finds a watch URL inside surrounding text", () => {
    assert.equal(parseYouTubeId(`Watch https://youtu.be/${VIDEO} tonight`), VIDEO);
  });
});

describe("oembedMeansMissingVideo", () => {
  it("treats 400 and 404 as missing videos", () => {
    assert.equal(oembedMeansMissingVideo({ status: 400 }), true);
    assert.equal(oembedMeansMissingVideo({ status: 404 }), true);
    assert.equal(oembedMeansMissingVideo({ status: 200 }), false);
    assert.equal(oembedMeansMissingVideo({ status: 401 }), false);
    assert.equal(oembedMeansMissingVideo({ status: 0 }), false);
  });
});

describe("fetchYouTubeOembed", () => {
  it("returns 400/404 for junk 11-character IDs", async () => {
    const hello = await fetchYouTubeOembed("helloworld1");
    const words = await fetchYouTubeOembed("not-a-video");
    assert.equal(oembedMeansMissingVideo(hello), true);
    assert.equal(oembedMeansMissingVideo(words), true);
  });
});

describe("youtubeIdRejectReason", () => {
  it("explains playlist vs missing paste", () => {
    assert.equal(youtubeIdRejectReason(""), "Paste a YouTube watch URL or 11-character video ID.");
    assert.match(youtubeIdRejectReason("https://www.youtube.com/playlist?list=PLxxxxYYYYYzzzz"), /not a video/);
    assert.equal(youtubeIdRejectReason(VIDEO), null);
  });
});

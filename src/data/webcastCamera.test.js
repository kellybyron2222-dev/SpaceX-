import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { WEBCAST_CAMERA, sceneForWebcast, webcastPose } from "./webcastCamera.js";

describe("webcast camera pose", () => {
  it("uses the Mechazilla scene so the tower can sit left of the stack", () => {
    const pose = webcastPose();
    assert.equal(sceneForWebcast(), "mechazilla");
    assert.equal(pose.sceneId, "mechazilla");
    assert.equal(pose.id, "gulf-side");
  });

  it("looks from the gulf: tower left, vehicle right, slightly low", () => {
    const { position, target } = webcastPose();
    assert.ok(position.z > 80, "camera stands on the gulf side (+Z)");
    assert.ok(target.x > 0, "looks toward the vehicle bay, not behind the tower");
    assert.ok(target.x < 22, "looks at the gap, not past the ghost booster");
    assert.ok(position.y < target.y, "slightly low, looking up at the stack");
    assert.ok(Math.abs(position.x - target.x) < 40, "not a side-on pad plate");
  });

  it("says the pose is a teaching guess, not a surveyed camera", () => {
    assert.match(WEBCAST_CAMERA.blurb, /teaching pose/i);
    assert.match(WEBCAST_CAMERA.blurb, /not a surveyed/i);
    assert.equal(/official telemetry|flight 13/i.test(WEBCAST_CAMERA.blurb), false);
  });
});

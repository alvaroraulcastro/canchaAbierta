import assert from "node:assert/strict";

process.env.AUTH_SECRET = "test-secret-for-check-in-token-min-32-chars";

import { createCheckInToken, verifyCheckInToken } from "../../lib/check-in/sign-token";

const token = createCheckInToken({
  inscriptionId: "ins-test",
  expMs: Date.now() + 60_000,
});
const verified = verifyCheckInToken(token);
assert.ok(verified);
assert.equal(verified!.inscriptionId, "ins-test");

const expired = verifyCheckInToken(
  createCheckInToken({ inscriptionId: "x", expMs: Date.now() - 1000 }),
);
assert.equal(expired, null);

console.log("check-in sign-token ok");

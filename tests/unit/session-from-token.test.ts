import assert from "node:assert/strict";
import type { Session } from "next-auth";
import {
  applyAdminSessionFromToken,
  sessionCanAccessCallback,
} from "../../lib/auth/session-from-token";

const session = {
  user: { name: "Test", email: "a@test.com", isAdmin: false, adminRole: null, adminVenueIds: [] },
  expires: "",
} satisfies Session;

applyAdminSessionFromToken(session, {
  isAdmin: true,
  adminRole: "super_admin",
  adminVenueIds: ["v1"],
});

assert.equal(session.user.isAdmin, true);
assert.equal(session.user.adminRole, "super_admin");
assert.deepEqual(session.user.adminVenueIds, ["v1"]);
assert.equal(sessionCanAccessCallback(session, "/admin/canchas"), true);
assert.equal(sessionCanAccessCallback(session, "/partidos"), true);

const player = {
  user: { name: "P", email: "p@test.com", isAdmin: false, adminRole: null, adminVenueIds: [] },
  expires: "",
} satisfies Session;
assert.equal(sessionCanAccessCallback(player, "/admin"), false);
assert.equal(sessionCanAccessCallback(player, "/cuenta"), true);

console.log("session-from-token ok");

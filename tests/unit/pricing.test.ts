import assert from "node:assert/strict";
import { pricePerPlayerCLP } from "../../lib/pricing";

assert.equal(pricePerPlayerCLP(10_000, 4), 2500);
assert.equal(pricePerPlayerCLP(10_000, 3), 3333);
assert.equal(pricePerPlayerCLP(10_000, 0), 10_000);

console.log("pricing ok");

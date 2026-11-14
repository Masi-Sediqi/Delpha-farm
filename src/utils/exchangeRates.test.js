import test from "node:test";
import assert from "node:assert/strict";
import { exchangeRate, updateExchangePair } from "./exchangeRates.js";

test("USD purchase and sale prices convert to AFN and back", () => {
 const rates = { USD: 65, EUR: 78, INR: 0.75 };
 assert.equal(3 * exchangeRate(rates, "USD", "AFN"), 195);
 assert.equal(5 * exchangeRate(rates, "USD", "AFN"), 325);
 assert.equal(exchangeRate(rates, "AFN", "USD"), 1 / 65);
 assert.equal(325 * exchangeRate(rates, "AFN", "USD"), 5);
 assert.equal(exchangeRate(rates, "EUR", "USD"), 1.2);
 assert.equal(exchangeRate(rates, "INR", "AFN"), 0.75);
});

test("same currency works without a rate and missing cross rates do not become a free price", () => {
 assert.equal(exchangeRate({}, "USD", "USD"), 1);
 assert.equal(exchangeRate({}, "USD", "AFN"), 0);
});

test("editing any pair keeps inverse and AFN quotes consistent", () => {
 const rates = updateExchangePair({ USD: 65 }, "EUR", "USD", 1.2);
 assert.equal(rates.EUR, 78);
 assert.equal(exchangeRate(rates, "EUR", "USD"), 1.2);
 assert.equal(exchangeRate(rates, "USD", "EUR"), 1 / 1.2);
 assert.equal(updateExchangePair({}, "AFN", "USD", 1 / 65).USD, 65);
 assert.equal(updateExchangePair({ USD: 65 }, "USD", "INR", 80).INR, 65 / 80);
 assert.throws(() => updateExchangePair({}, "USD", "AFN", 0));
 assert.throws(() => updateExchangePair({}, "USD", "EUR", 1.2), /missing-base-rate/);
});

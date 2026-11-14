import test from "node:test";
import assert from "node:assert/strict";
import { productPricePerPiece, purchasePieceQuantity, pieceLineAmount } from "./piecePricing.js";

test("purchase and sale totals use piece prices regardless of carton size", () => {
  const pieces = purchasePieceQuantity({ quantity: 2 }, 24);
  assert.equal(pieceLineAmount(pieces, 10), 480);
  assert.equal(pieceLineAmount(pieces, 15), 720);
  assert.equal(pieceLineAmount(1, 15), 15);
  assert.equal(productPricePerPiece({ priceUnit: "piece", cartonSize: 24, salePrice: 15 }, "salePrice"), 15);
});

test("carton product prices convert once before a piece purchase", () => {
  const carton = { productUnit: "carton", piecesPerUnit: 36, purchasePrice: 30, salePrice: 45 };
  assert.equal(productPricePerPiece(carton, "purchasePrice"), 30 / 36);
  assert.equal(productPricePerPiece(carton, "salePrice"), 1.25);
  const purchased = { ...carton, priceUnit: "piece", purchasePrice: 30 / 36, salePrice: 1.25 };
  assert.equal(productPricePerPiece(purchased, "salePrice"), 1.25);
  assert.equal(productPricePerPiece(purchased, "purchasePrice"), 30 / 36);
  assert.equal(productPricePerPiece(purchased, "salePrice") * 3600 * 0.9, 4050);
});

test("piece products with carton metadata keep their piece prices", () => {
  assert.equal(productPricePerPiece({ productUnit: "piece", cartonSize: 36, salePrice: 1.25 }, "salePrice"), 1.25);
});

test("old purchase quantities restore to pieces without multiplying twice", () => {
  assert.equal(purchasePieceQuantity({ quantity: 100, receivedQuantity: 3600 }, 36), 3600);
  assert.equal(purchasePieceQuantity({ quantity: 100 }, 36), 3600);
  assert.equal(purchasePieceQuantity({ quantity: 3600, quantityUnit: "piece" }, 36), 3600);
  assert.equal(purchasePieceQuantity({ quantity: 100, receivedQuantity: 0 }, 36), 0);
  assert.equal(purchasePieceQuantity({ quantity: 36, purchaseUnit: "piece" }, 36), 36);
});

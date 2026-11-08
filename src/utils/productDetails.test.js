import test from "node:test";
import assert from "node:assert/strict";
import { updateProductDetails, preserveOpeningPieces } from "./productDetails.js";
import { productPricePerPiece } from "./piecePricing.js";

test("simple edit updates registration fields while retaining stock and hidden data", () => {
 const original={id:"p",productName:"Old",cartonSize:"36",piecesPerUnit:36,quantity:7,totalPieceQuantity:252,expiryDate:"2027-01-01",description:"existing",supplierId:"s",groupId:"g",createdAt:"original"};
 const edited=updateProductDetails(original,{productName:" New ",cartonSize:"24",countryId:"AF",manufacturerName:"Maker",unit:"usd",saleCurrency:"afn",purchasePrice:0.83,salePrice:1.25},"now");
 assert.equal(edited.productName,"New"); assert.equal(edited.cartonSize,"24"); assert.equal(edited.piecesPerUnit,24);
 for(const key of ["id","quantity","totalPieceQuantity","expiryDate","description","supplierId","groupId","createdAt"]) assert.equal(edited[key],original[key]);
 assert.equal(edited.priceUnit,"piece"); assert.equal(edited.purchaseCurrency,"usd"); assert.equal(edited.updatedAt,"now");
 assert.equal(original.productName,"Old");
});

test("legacy carton prices convert once and remain per piece after reopening", () => {
 const original={id:"p",productUnit:"carton",cartonSize:"36",piecesPerUnit:36,purchasePrice:30,salePrice:45,quantity:2};
 const form={...original,purchasePrice:productPricePerPiece(original,"purchasePrice"),salePrice:productPricePerPiece(original,"salePrice")};
 const edited=updateProductDetails(original,form,"now");
 assert.equal(productPricePerPiece(edited,"salePrice"),1.25);
 assert.equal(edited.totalPieceQuantity,72);
});

test("carton corrections preserve opening pieces without recreating stock entries", () => {
 const product={id:"p",piecesPerUnit:36};
 const rows=[{id:"old",productId:"p",referenceType:"opening",quantityIn:2,quantityOut:0},{id:"piece",productId:"p",referenceType:"opening",stockUnit:"piece",quantityIn:72},{id:"purchase",productId:"p",referenceType:"purchase",quantityIn:10},{id:"other",productId:"q",referenceType:"opening",quantityIn:3}];
 const normalized=preserveOpeningPieces(rows,product);
 assert.equal(normalized.length,rows.length); assert.equal(normalized[0].quantityIn,72); assert.equal(rows[0].quantityIn,2);
 assert.deepEqual(normalized.slice(1),rows.slice(1));
 assert.deepEqual(preserveOpeningPieces(normalized,product),normalized);
});

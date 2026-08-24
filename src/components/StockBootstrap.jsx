import { useEffect, useRef } from "react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { environmentStorageKey } from "../config/appConfig";
import {
  hasLegacyStock,
  legacyProductStock,
  stockMovementId,
  stockNumber,
} from "../utils/stock";

const migrationKey = environmentStorageKey("medicine-stock-movements-v1");

function purchaseRowsFor(purchase, purchaseItems) {
  const detailRows = purchaseItems.filter((item) => String(item.purchaseId) === String(purchase.id));
  return detailRows.length ? detailRows : (Array.isArray(purchase.items) ? purchase.items : []);
}

export default function StockBootstrap() {
  const [products, , , productsLoaded] = useJsonCollection("products");
  const [purchases, , , purchasesLoaded] = useJsonCollection("purchases");
  const [purchaseItems, , , purchaseItemsLoaded] = useJsonCollection("purchaseItems");
  const [sales, , , salesLoaded] = useJsonCollection("salesRegister");
  const [stockMovements, setStockMovements, , movementsLoaded] = useJsonCollection("stockMovements");
  const running = useRef(false);

  useEffect(() => {
    if (!productsLoaded || !purchasesLoaded || !purchaseItemsLoaded || !salesLoaded || !movementsLoaded) return;
    if (running.current) return;

    if (stockMovements.length) {
      localStorage.setItem(migrationKey, "1");
      return;
    }

    if (localStorage.getItem(migrationKey) === "1") return;
    running.current = true;

    const now = new Date().toISOString();
    const migrated = [];

    purchases.forEach((purchase) => {
      purchaseRowsFor(purchase, purchaseItems).forEach((item) => {
        if (!item?.productId) return;
        const quantityIn = stockNumber(item.quantity) + stockNumber(item.bonus);
        if (!quantityIn) return;
        migrated.push({
          id: stockMovementId("purchase", purchase.id, item.productId),
          productId: item.productId,
          movementType: "purchase",
          referenceType: "purchase",
          referenceId: purchase.id,
          referenceNumber: purchase.billNumber || "",
          quantityIn,
          quantityOut: 0,
          unitCost: stockNumber(item.purchasePrice),
          batchNo: item.batchNo || "",
          expiryDate: item.expiryDate || "",
          movementDate: purchase.purchaseDate || purchase.date || String(purchase.createdAt || "").slice(0, 10),
          createdAt: item.createdAt || purchase.createdAt || now,
          updatedAt: now,
          migrated: true,
        });
      });
    });

    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        if (!item?.productId) return;
        const quantityOut = stockNumber(item.quantity);
        if (!quantityOut) return;
        migrated.push({
          id: stockMovementId("sale", sale.id, item.productId),
          productId: item.productId,
          movementType: "sale",
          referenceType: "sale",
          referenceId: sale.id,
          referenceNumber: sale.invoiceNumber || "",
          quantityIn: 0,
          quantityOut,
          unitPrice: stockNumber(item.salePrice),
          movementDate: sale.saleDate || String(sale.createdAt || "").slice(0, 10),
          createdAt: item.createdAt || sale.createdAt || now,
          updatedAt: now,
          migrated: true,
        });
      });
    });

    const netByProduct = new Map();
    migrated.forEach((movement) => {
      const key = String(movement.productId);
      netByProduct.set(
        key,
        (netByProduct.get(key) || 0) + stockNumber(movement.quantityIn) - stockNumber(movement.quantityOut)
      );
    });

    products.forEach((product) => {
      if (!hasLegacyStock(product)) return;
      const legacyStock = legacyProductStock(product);
      const transactionStock = netByProduct.get(String(product.id)) || 0;
      const openingDifference = legacyStock - transactionStock;
      if (Math.abs(openingDifference) < 0.000001) return;
      migrated.push({
        id: stockMovementId("opening", "migration", product.id),
        productId: product.id,
        movementType: "opening",
        referenceType: "opening",
        referenceId: "migration",
        referenceNumber: "Opening balance",
        quantityIn: openingDifference > 0 ? openingDifference : 0,
        quantityOut: openingDifference < 0 ? Math.abs(openingDifference) : 0,
        movementDate: String(product.createdAt || now).slice(0, 10),
        createdAt: product.createdAt || now,
        updatedAt: now,
        migrated: true,
      });
    });

    Promise.resolve(setStockMovements(migrated)).then((saved) => {
      if (saved) localStorage.setItem(migrationKey, "1");
    }).finally(() => {
      running.current = false;
    });
  }, [
    productsLoaded,
    purchasesLoaded,
    purchaseItemsLoaded,
    salesLoaded,
    movementsLoaded,
    products,
    purchases,
    purchaseItems,
    sales,
    stockMovements,
    setStockMovements,
  ]);

  return null;
}

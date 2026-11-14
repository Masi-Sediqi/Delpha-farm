import { useState } from "react";

const party = (row, type) => type === "customer" ? row.customer : row.supplier;
const category = (row, type) => {
  const item = party(row, type) || {};
  return String(item.categoryName || item.category || item.supplierType || item.customerType || "");
};

export function useAccountStatementFilters(rows, type) {
  const [currency, setCurrency] = useState("ALL");
  const [selectedCategory, setCategory] = useState("ALL");
  return {
    currency, setCurrency, selectedCategory, setCategory,
    currencies: [...new Set(rows.map(row => row.currency))].sort(),
    categories: [...new Set(rows.map(row => category(row, type)).filter(Boolean))].sort(),
    filter: row => (currency === "ALL" || row.currency === currency) && (selectedCategory === "ALL" || category(row, type) === selectedCategory),
  };
}


import { useEffect, useRef } from "react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import {
  defaultProductCountries,
  defaultProductGroups,
  makeMasterId,
  normalizeMasterName,
} from "../utils/productMasterData";

const uniqueByName = (rows) => {
  const seen = new Set();
  return rows.filter((row) => {
    const key = normalizeMasterName(row?.name || row?.title || row?.en);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export default function ProductMasterDataBootstrap() {
  const [products, setProducts] = useJsonCollection("products");
  const [groups, setGroups] = useJsonCollection("productGroups");
  const [countries, setCountries] = useJsonCollection("countries");
  const [legacyGroups] = useJsonCollection("salesProductGroups");
  const [legacyCountries] = useJsonCollection("productCountries");
  const running = useRef(false);

  useEffect(() => {
    if (running.current) return;
    running.current = true;

    const migrate = async () => {
      const groupRows = uniqueByName([
        ...groups,
        ...defaultProductGroups,
        ...legacyGroups.map((item) => ({
          id: item?.id || makeMasterId("group", typeof item === "string" ? item : item?.name),
          name: typeof item === "string" ? item : item?.name,
        })),
        ...products.filter((p) => p.group).map((p) => ({ id: makeMasterId("group", p.group), name: p.group })),
      ]);

      const countryRows = uniqueByName([
        ...countries,
        ...defaultProductCountries,
        ...legacyCountries.map((item) => {
          const name = typeof item === "string" ? item : item?.name;
          return { id: item?.id || makeMasterId("country", name), name, en: name, fa: name, ps: name };
        }),
        ...products.filter((p) => p.madeIn).map((p) => ({
          id: makeMasterId("country", p.madeIn), name: p.madeIn, en: p.madeIn, fa: p.madeIn, ps: p.madeIn,
        })),
      ]);

      if (JSON.stringify(groupRows) !== JSON.stringify(groups)) await setGroups(groupRows);
      if (JSON.stringify(countryRows) !== JSON.stringify(countries)) await setCountries(countryRows);

      let changed = false;
      const migratedProducts = products.map((product) => {
        let groupId = product.groupId;
        let countryId = product.countryId;
        if (!groupId && product.group) {
          groupId = groupRows.find((row) => normalizeMasterName(row.name) === normalizeMasterName(product.group))?.id || "";
        }
        if (!countryId && product.madeIn) {
          countryId = countryRows.find((row) => normalizeMasterName(row.name || row.en) === normalizeMasterName(product.madeIn))?.id || "";
        }
        if (groupId !== product.groupId || countryId !== product.countryId) changed = true;
        return { ...product, groupId, countryId };
      });
      if (changed) await setProducts(migratedProducts);
    };

    migrate().finally(() => { running.current = false; });
  }, [products, groups, countries, legacyGroups, legacyCountries, setProducts, setGroups, setCountries]);

  return null;
}

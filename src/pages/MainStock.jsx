import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { formatDateTime } from "../utils/afghanDate";
import "./MainStock.css";
import {
  CircleHelp,
  History,
} from "lucide-react";

const money = (value) => Number(value || 0).toLocaleString("en-US");

const getTrackingLabel = (asset) =>
  String(asset?.identityTracking || "").toLowerCase().includes("individual")
    ? "Individual"
    : "Single Model";

const getAssetUnit = (asset) =>
  asset?.purchaseUsageUnit ||
  asset?.purchaseUnit ||
  asset?.usageUnit ||
  "Piece";

export default function MainStock() {
  const navigate = useNavigate();

  const [assets] = useJsonCollection("assets");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [showQuantityBreakdown, setShowQuantityBreakdown] = useState(false);
  const [transferFilters, setTransferFilters] = useState({
    date: "",
    source: "",
    destination: "",
  });
  const [openActionId, setOpenActionId] = useState("");

  const [actionMenuPosition, setActionMenuPosition] = useState({
    top: 0,
    left: 0,
  });

  const actionMenuRef = useRef(null);

  const categories = useMemo(
    () => [
      "All",
      ...Array.from(
        new Set(
          assets
            .map((asset) => asset.category)
            .filter(Boolean)
        )
      ),
    ],
    [assets]
  );

  const filteredAssets = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return assets.filter((asset) => {
      const matchesCategory =
        categoryFilter === "All" ||
        asset.category === categoryFilter;

      const matchesSearch =
        !keyword ||
        String(asset.assetId || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.deviceName || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.category || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.brand || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.model || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.macAddress || "")
          .toLowerCase()
          .includes(keyword) ||
        String(asset.serialNumber || "")
          .toLowerCase()
          .includes(keyword);

      return matchesCategory && matchesSearch;
    });
  }, [assets, categoryFilter, search]);

  const totalQuantity = filteredAssets.reduce(
    (sum, asset) => sum + Number(asset.quantity || 0),
    0
  );

  const categoryQuantityBreakdown = useMemo(() => {
    const grouped = new Map();

    filteredAssets.forEach((asset) => {
      const category = asset.category || "Uncategorized";
      const quantity = Number(asset.quantity || 0);
      const unit = getAssetUnit(asset);
      const previous = grouped.get(category) || {
        category,
        quantity: 0,
        units: new Set(),
      };

      previous.quantity += quantity;
      if (unit) previous.units.add(unit);
      grouped.set(category, previous);
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.category.localeCompare(b.category)
    );
  }, [filteredAssets]);

  const lowStockCount = filteredAssets.filter(
    (asset) =>
      Number(asset.alertQuantity || 0) > 0 &&
      Number(asset.quantity || 0) <=
        Number(asset.alertQuantity || 0)
  ).length;

  const mainStockTransfers = useMemo(
    () =>
      [...deviceTransfers]
        .filter((transfer) => {
          if (
            transfer.isSummaryRecord ||
            transfer.summaryType ||
            !Number(transfer.quantity || 0)
          ) {
            return false;
          }

          return (
            transfer.sourceType === "Main Stock" ||
            transfer.destinationType === "Main Stock" ||
            transfer.sourceLocation === "Main Stock" ||
            transfer.destinationLocation === "Main Stock"
          );
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt || b.transferDate || 0).getTime() -
            new Date(a.createdAt || a.transferDate || 0).getTime()
        ),
    [deviceTransfers]
  );

  const filteredMainStockTransfers = useMemo(() => {
    const dateFilter = transferFilters.date.trim();
    const sourceFilter = transferFilters.source.trim().toLowerCase();
    const destinationFilter = transferFilters.destination.trim().toLowerCase();

    return mainStockTransfers.filter((transfer) => {
      const rowDate = String(transfer.transferDate || transfer.createdAt || "").slice(0, 10);
      const source = String(transfer.sourceLocation || transfer.sourceType || "").toLowerCase();
      const destination = String(transfer.destinationLocation || transfer.destinationType || "").toLowerCase();

      return (
        (!dateFilter || rowDate === dateFilter) &&
        (!sourceFilter || source.includes(sourceFilter)) &&
        (!destinationFilter || destination.includes(destinationFilter))
      );
    });
  }, [mainStockTransfers, transferFilters]);

  const getMainStockTransferRowClass = (transfer) =>
    /main stock|stock/i.test(`${transfer.sourceLocation || ""} ${transfer.sourceType || ""}`)
      ? "main-stock-transfer-source-stock"
      : "main-stock-transfer-source-other";

  const displayTransferStatus = (transfer) => {
    const destination = transfer.destinationType || transfer.toType || "";
    if (destination === "Customer") return "Issued to Customer";
    if (destination === "Tower") return "Issued to Tower";
    if (destination === "Repair") return "Issued to Repair";
    if (destination === "Waste") return "Issued to Waste";
    if (destination === "Main Stock") return "In Stock";
    return transfer.newStatus || transfer.status || "-";
  };

  const openAssetModal = (asset, modal) => {
    navigate(`/assets/${asset.id || asset.assetId}/details`, {
      state: {
        openAssetModal: modal,
        fromMainStock: true,
      },
    });
  };

  const closeActionMenu = () => {
    setOpenActionId("");
  };

const handleActionToggle = (event, assetKey) => {
  event.stopPropagation();

  if (openActionId === assetKey) {
    closeActionMenu();
    return;
  }

  const buttonRect =
    event.currentTarget.getBoundingClientRect();

  const menuWidth = 200;
  const menuHeight = 108;
  const screenPadding = 12;
  const menuGap = 7;

  let left = buttonRect.right - menuWidth;
  let top = buttonRect.bottom + menuGap;

  if (left < screenPadding) {
    left = screenPadding;
  }

  if (
    left + menuWidth >
    window.innerWidth - screenPadding
  ) {
    left =
      window.innerWidth -
      menuWidth -
      screenPadding;
  }

  if (
    top + menuHeight >
    window.innerHeight - screenPadding
  ) {
    top =
      buttonRect.top -
      menuHeight -
      menuGap;
  }

  if (top < screenPadding) {
    top = screenPadding;
  }

  setActionMenuPosition({
    top: Math.round(top),
    left: Math.round(left),
  });

  setOpenActionId(assetKey);
};

  useEffect(() => {
    if (!openActionId) return undefined;

    const handleOutsideClick = (event) => {
      if (
        actionMenuRef.current &&
        !actionMenuRef.current.contains(event.target) &&
        !event.target.closest(".main-stock-action-trigger")
      ) {
        closeActionMenu();
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        closeActionMenu();
      }
    };

    const handleViewportChange = () => {
      closeActionMenu();
    };

    document.addEventListener(
      "mousedown",
      handleOutsideClick
    );

    document.addEventListener(
      "keydown",
      handleEscape
    );

    window.addEventListener(
      "resize",
      handleViewportChange
    );

    window.addEventListener(
      "scroll",
      handleViewportChange,
      true
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick
      );

      document.removeEventListener(
        "keydown",
        handleEscape
      );

      window.removeEventListener(
        "resize",
        handleViewportChange
      );

      window.removeEventListener(
        "scroll",
        handleViewportChange,
        true
      );
    };
  }, [openActionId]);

  const activeAsset = filteredAssets.find(
    (asset, index) =>
      String(asset.id || asset.assetId || index) ===
      openActionId
  );

  const activeAssetQuantity = Number(
    activeAsset?.quantity || 0
  );

  return (
    <div className="main-stock-page">
      <div className="main-stock-header">
        <div>
          <span>Main Stock</span>

          <h1>Main Stock Inventory</h1>

          <p>
            Current stock and asset full information.
          </p>
        </div>
      </div>

      <div className="main-stock-stats">
        <div>
          <span>Asset Category in Main Stock</span>

          <strong>{filteredAssets.length}</strong>

          <p>Filtered asset records</p>
        </div>

        <button
          type="button"
          className="main-stock-stat-button"
          onClick={() => setShowQuantityBreakdown(true)}
        >
          <span>Total Quantity</span>

          <strong>{money(totalQuantity)}</strong>

          <p>Current quantity in stock</p>
        </button>

        <div>
          <span>Low Stock</span>

          <strong>{lowStockCount}</strong>

          <p>Assets at or below alert quantity</p>
        </div>
      </div>

      <section className="main-stock-card">
        <div className="main-stock-toolbar">
          <div>
            <h3>Main Stock Assets</h3>

            <p>
              Filter by category or search by name, ID,
              MAC, serial, and model.
            </p>
          </div>

          <div className="main-stock-controls">
            <select
              value={categoryFilter}
              onChange={(event) =>
                setCategoryFilter(event.target.value)
              }
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>

            <ShamsiDateInput
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search stock..."
            />
          </div>
        </div>

        <div className="main-stock-transfer-filters">
          <label>
            Date
            <input
              value={transferFilters.date}
              onChange={(event) =>
                setTransferFilters((previous) => ({ ...previous, date: event.target.value }))
              }
            />
          </label>
          <label>
            Issued from
            <input
              value={transferFilters.source}
              onChange={(event) =>
                setTransferFilters((previous) => ({ ...previous, source: event.target.value }))
              }
              placeholder="Filter source..."
            />
          </label>
          <label>
            Receiver
            <input
              value={transferFilters.destination}
              onChange={(event) =>
                setTransferFilters((previous) => ({ ...previous, destination: event.target.value }))
              }
              placeholder="Filter receiver..."
            />
          </label>
        </div>

        <div className="main-stock-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Asset ID</th>
                <th>Image</th>
                <th>Category</th>
                <th>Device Name</th>
                <th>Tracking</th>
                <th>Model</th>
                <th>MAC Address</th>
                <th>Serial Number</th>
                <th>Current Quantity</th>
                <th className="main-stock-actions-heading">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredAssets.map((asset, index) => {
                const trackingLabel =
                  getTrackingLabel(asset);

                const quantity = Number(
                  asset.quantity || 0
                );

                const unit = getAssetUnit(asset);

                const assetKey = String(
                  asset.id || asset.assetId || index
                );

                return (
                  <tr key={assetKey}>
                    <td className="main-stock-strong">
                      {asset.assetId || "-"}
                    </td>

                    <td>
                      {trackingLabel === "Single Model" &&
                      asset.assetImage ? (
                        <img
                          className="main-stock-thumb"
                          src={asset.assetImage}
                          alt={
                            asset.deviceName ||
                            asset.assetId ||
                            "Asset"
                          }
                        />
                      ) : (
                        "-"
                      )}
                    </td>

                    <td>{asset.category || "-"}</td>

                    <td title={`${asset.category || "-"} - ${asset.deviceName || "-"}`}>
                      {asset.category || "-"} - {asset.deviceName || "-"}
                    </td>

                    <td>
                      <span
                        className={`main-stock-tracking ${
                          trackingLabel === "Individual"
                            ? "individual"
                            : "single"
                        }`}
                      >
                        {trackingLabel}
                      </span>
                    </td>

                    <td>{asset.model || "-"}</td>

                    <td>{asset.macAddress || "-"}</td>

                    <td>{asset.serialNumber || "-"}</td>

                    <td>
                      {money(quantity)} {unit}
                    </td>

                    <td className="main-stock-actions-cell">
                      <button
                        type="button"
                        className={`main-stock-action-trigger ${
                          openActionId === assetKey
                            ? "active"
                            : ""
                        }`}
                        aria-label="Open asset actions"
                        aria-expanded={
                          openActionId === assetKey
                        }
                        onClick={(event) =>
                          handleActionToggle(
                            event,
                            assetKey
                          )
                        }
                      >
                        <span />
                        <span />
                        <span />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredAssets.length === 0 && (
                <tr>
                  <td
                    colSpan="10"
                    className="main-stock-empty"
                  >
                    No stock asset was found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="main-stock-card main-stock-transfer-card">
        <div className="main-stock-toolbar">
          <div>
            <h3>Main Stock Transfer History</h3>

            <p>
              Every transfer sent from Main Stock or received back into Main Stock.
            </p>
          </div>

          <div className="main-stock-transfer-legend" aria-label="Transfer row color guide">
            <span><i className="legend-dot stock" /> Issued</span>
            <span><i className="legend-dot other" /> Recived</span>
          </div>
        </div>

        <div className="main-stock-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Transfer ID</th>
                <th>Reference Number</th>
                <th>Transfer Type</th>
                <th>Issued</th>
                <th>Recived</th>
                <th>Category</th>
                <th>Device</th>
                <th>Quantity</th>
                <th>Transfer Date</th>
                <th>Responsible User</th>
                <th>Received By</th>
                <th>Status</th>
              </tr>
            </thead>

            <tbody>
              {filteredMainStockTransfers.map((transfer, index) => (
                <tr
                  key={`${transfer.id || transfer.transferId}-${index}`}
                  className={getMainStockTransferRowClass(transfer)}
                >
                  <td className="main-stock-strong">{transfer.transferId || transfer.id || "-"}</td>
                  <td>{transfer.referenceNumber || "-"}</td>
                  <td>{transfer.transferType || "-"}</td>
                  <td>{transfer.sourceLocation || transfer.sourceType || "-"}</td>
                  <td>{transfer.destinationLocation || transfer.destinationType || "-"}</td>
                  <td>{transfer.category || "-"}</td>
                  <td title={`${transfer.category || "-"} - ${transfer.assetId || "-"} - ${transfer.deviceName || "-"}`}>
                    {transfer.category || "-"} - {transfer.assetId || "-"} - {transfer.deviceName || "-"}
                  </td>
                  <td>{money(transfer.quantity)} {transfer.unit || ""}</td>
                  <td>{formatDateTime(transfer.transferDate, transfer.createdAt)}</td>
                  <td>{transfer.responsibleUser || "-"}</td>
                  <td>{transfer.receivedBy || "-"}</td>
                  <td>{displayTransferStatus(transfer)}</td>
                </tr>
              ))}

              {filteredMainStockTransfers.length === 0 && (
                <tr>
                  <td colSpan="12" className="main-stock-empty">
                    No Main Stock transfer has been recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {openActionId &&
  activeAsset &&
  createPortal(
    <div
      ref={actionMenuRef}
      className="main-stock-action-menu"
      style={{
        top: `${actionMenuPosition.top}px`,
        left: `${actionMenuPosition.left}px`,
      }}
      role="menu"
      aria-label="Asset actions"
      onMouseDown={(event) =>
        event.stopPropagation()
      }
    >
      <button
        type="button"
        className="main-stock-menu-item"
        role="menuitem"
        onClick={() => {
          navigate(
            `/assets/${
              activeAsset.id ||
              activeAsset.assetId
            }/details`
          );

          closeActionMenu();
        }}
      >
        <CircleHelp
          size={15}
          strokeWidth={1.8}
        />

        <span>Full Information</span>
      </button>

      <button
        type="button"
        className="main-stock-menu-item"
        role="menuitem"
        onClick={() => {
          navigate(
            `/assets/${
              activeAsset.id ||
              activeAsset.assetId
            }/audit-trail`
          );

          closeActionMenu();
        }}
      >
        <History
          size={15}
          strokeWidth={1.8}
        />

        <span>Audit Trail</span>
      </button>
    </div>,
    document.body
  )}

      {showQuantityBreakdown && (
        <div
          className="main-stock-breakdown-backdrop"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              setShowQuantityBreakdown(false);
            }
          }}
        >
          <section
            className="main-stock-breakdown-modal"
            role="dialog"
            aria-modal="true"
          >
            <header>
              <div>
                <h3>Quantity by Category</h3>
                <p>Remaining stock quantity for each category.</p>
              </div>

              <button
                type="button"
                onClick={() => setShowQuantityBreakdown(false)}
                aria-label="Close quantity breakdown"
              >
                ×
              </button>
            </header>

            <div className="main-stock-breakdown-list">
              {categoryQuantityBreakdown.map((item) => (
                <div key={item.category}>
                  <span>{item.category}</span>
                  <strong>
                    {money(item.quantity)}{" "}
                    {Array.from(item.units).join(", ") || "Piece"}
                  </strong>
                </div>
              ))}

              {categoryQuantityBreakdown.length === 0 && (
                <p className="main-stock-breakdown-empty">
                  No stock category was found.
                </p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

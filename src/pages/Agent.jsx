import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bot,
  Boxes,
  Building2,
  ClipboardList,
  Edit3,
  HelpCircle,
  History,
  MessageSquareText,
  Plus,
  RadioTower,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  Truck,
  Users,
  WalletCards,
  Wrench,
} from "lucide-react";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { todayDateValue } from "../utils/afghanDate";
import { getCurrentLocationRows } from "../utils/dashboardInsights";
import "./Agent.css";

const STORAGE_KEY = "isp-agent-conversations";

const money = (value) => `${Number(value || 0).toLocaleString("en-US")} AFN`;
const number = (value) => Number(value || 0).toLocaleString("en-US");
const lower = (value) => String(value || "").toLowerCase();
const today = todayDateValue();
const isInactiveCustomer = (customer) =>
  /inactive|disabled|disconnected|disconnect|suspend/i.test(String(customer?.status || ""));

const isApprovedTransfer = (transfer) =>
  !/rejected/i.test(String(transfer?.approvalStatus || "Approved"));

const isAssetTransfer = (transfer) =>
  isApprovedTransfer(transfer) &&
  !transfer?.summaryType &&
  Number(transfer?.quantity || 0) > 0 &&
  Boolean(transfer?.assetId || transfer?.assetRecordId || transfer?.deviceName || transfer?.unitRecordId);

const transferAssetLabel = (transfer) =>
  `${transfer.category || "-"} - ${transfer.assetId || "-"} - ${transfer.deviceName || transfer.assetLabel || "Asset"}`;

const groupCount = (items, keyGetter) => {
  const totals = new Map();
  items.forEach((item) => {
    const key = keyGetter(item) || "Unknown";
    totals.set(key, (totals.get(key) || 0) + Number(item.quantity || 1));
  });
  return [...totals.entries()].sort((a, b) => b[1] - a[1]);
};

const getQuestionIcon = (question) => {
  const q = lower(question);
  if (/customer/.test(q)) return Users;
  if (/tower/.test(q)) return RadioTower;
  if (/supplier/.test(q)) return Building2;
  if (/deposit|withdraw/.test(q)) return WalletCards;
  if (/repair/.test(q)) return Wrench;
  if (/transfer/.test(q)) return Truck;
  if (/asset|stock|category/.test(q)) return Boxes;
  return ClipboardList;
};

const suggestedSections = [
  {
    title: "Overview",
    icon: Sparkles,
    questions: [
      "Show system summary",
      "How many assets do we currently have?",
      "Show asset category summary",
      "How many active customers do we have?",
      "How many inactive or suspend customers do we have?",
      "How many towers do we have?",
    ],
  },
  {
    title: "Assets & Transfers",
    icon: Truck,
    questions: [
      "Show main stock summary",
      "How many assets are with customers?",
      "How many assets are at towers?",
      "Which assets are under repair?",
      "Which assets are wasted?",
      "Show recent transfers",
      "Show Customer to Customer transfers",
    ],
  },
  {
    title: "Financial & Operations",
    icon: WalletCards,
    questions: [
      "Show customer deposits and withdraws",
      "How much deposit do we hold?",
      "Which supplier has the most purchases?",
      "Which tower has the most assets?",
      "Which assets are low stock?",
    ],
  },
];

const defaultConversation = () => ({
  id: `chat-${Date.now()}`,
  title: "New Conversation",
  createdAt: new Date().toISOString(),
  messages: [
    {
      id: `msg-${Date.now()}`,
      role: "assistant",
      text: "Hello. I am your system Agent. Ask me about customers, assets, stock, transfers, suppliers, towers, deposits, and repair records.",
      feedback: "",
    },
  ],
});

function loadConversations() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) && saved.length ? saved : [defaultConversation()];
  } catch {
    return [defaultConversation()];
  }
}

function formatList(items, emptyText = "No matching record was found.") {
  if (!items.length) return emptyText;
  return items.slice(0, 8).join("\n");
}

function buildAnswer(question, data) {
  const q = lower(question);
  const {
    assets,
    customers,
    suppliers,
    deviceTransfers,
    towerAssets,
    securityDeposits,
    supplierPurchases,
  } = data;

  const mainStockQuantity = assets.reduce((sum, asset) => sum + Number(asset.quantity || 0), 0);
  const activeTransfers = deviceTransfers.filter(
    (item) => !/rejected/i.test(String(item.approvalStatus || "Approved"))
  );
  const transferQty = (field, type) =>
    activeTransfers
      .filter((item) => lower(item[field]) === lower(type))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const towerQuantity = getCurrentLocationRows(deviceTransfers, assets, "Tower").length;
  const customerQuantity = getCurrentLocationRows(deviceTransfers, assets, "Customer").length;
  const damagedQuantity = transferQty("destinationType", "Damaged");
  const lostQuantity = transferQty("destinationType", "Lost");
  const repairQuantity = Math.max(transferQty("destinationType", "Repair") - transferQty("sourceType", "Repair"), 0);
  const inactiveCustomers = customers.filter((customer) =>
    /inactive|disabled|disconnected/i.test(String(customer.status || ""))
  );
  const depositsHeld = securityDeposits.reduce(
    (sum, item) => sum + Number(item.remainingDeposit || item.amount || item.depositAmount || 0),
    0
  );
  const outstandingDeposits = securityDeposits.reduce(
    (sum, item) => sum + Number(item.outstandingAmount || item.remainingDeposit || 0),
    0
  );
  if (/how many customers|چقدر مشتری|customers do i have|total customers/.test(q)) {
    return `You have ${number(customers.length)} customer record(s).`;
  }

  if (/active customers/.test(q)) {
    const active = customers.filter((customer) => !/inactive|disabled|disconnected/i.test(String(customer.status || "")));
    return `You have ${number(active.length)} active customer(s).`;
  }

  if (/inactive customers/.test(q)) {
    return `You have ${number(inactiveCustomers.length)} inactive or disconnected customer(s).`;
  }

  if (/total assets|how many assets|assets do i have/.test(q)) {
    return `You have ${number(assets.length)} asset definition(s), with ${number(mainStockQuantity)} unit(s) currently recorded in Main Stock.`;
  }

  if (/main stock/.test(q) && /summary|asset|quantity|stock/.test(q)) {
    return `Main Stock summary:\nAssets in stock: ${number(assets.filter((asset) => Number(asset.quantity || 0) > 0).length)}\nTotal quantity: ${number(mainStockQuantity)}`;
  }

  if (/with customers|customer-held|customers/.test(q) && /asset|device/.test(q)) {
    return `Assets currently calculated with customers: ${number(customerQuantity)} asset record(s).`;
  }

  if (/at towers|tower-held|tower/.test(q) && /asset|device/.test(q)) {
    return `Assets currently calculated at towers: ${number(towerQuantity)} asset record(s).`;
  }

  if (/damaged/.test(q)) {
    const rows = assets.filter((asset) => /damaged|damage/i.test(`${asset.status || ""} ${asset.currentStatus || ""}`));
    return `Damaged assets: ${number(Math.max(damagedQuantity, rows.length))} unit(s).\n${formatList(
      rows.map((asset) => `- ${asset.assetId || asset.id} - ${asset.deviceName || asset.name || "Asset"}`)
    )}`;
  }

  if (/lost/.test(q)) {
    const rows = assets.filter((asset) => /lost/i.test(`${asset.status || ""} ${asset.currentStatus || ""}`));
    return `Lost assets: ${number(Math.max(lostQuantity, rows.length))} unit(s).\n${formatList(
      rows.map((asset) => `- ${asset.assetId || asset.id} - ${asset.deviceName || asset.name || "Asset"}`)
    )}`;
  }

  if (/under repair|in repair|repair/.test(q)) {
    return `Assets currently under repair: ${number(repairQuantity)} unit(s).`;
  }


  if (/deposit.*held|held deposit/.test(q)) {
    return `Total deposits held are ${money(depositsHeld)}.`;
  }

  if (/outstanding deposit/.test(q)) {
    return `Outstanding deposits are ${money(outstandingDeposits)}.`;
  }

  if (/low stock/.test(q)) {
    const rows = assets
      .filter((asset) => Number(asset.alertQuantity || 0) > 0 && Number(asset.quantity || 0) <= Number(asset.alertQuantity || 0))
      .map((asset) => `- ${asset.assetId || asset.id} - ${asset.deviceName || "Asset"}: ${number(asset.quantity)} ${asset.purchaseUnit || asset.unit || "unit"}`);
    return `Low stock assets:\n${formatList(rows)}`;
  }

  if (/asset categor/.test(q)) {
    const categories = [...new Set(assets.map((asset) => asset.category).filter(Boolean))];
    return `Asset categories:\n${formatList(categories.map((item) => `- ${item}`))}`;
  }

  if (/highest quantity/.test(q)) {
    const asset = [...assets].sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0))[0];
    return asset
      ? `Highest quantity asset: ${asset.assetId || asset.id} - ${asset.deviceName || "Asset"} with ${number(asset.quantity)} ${asset.purchaseUnit || asset.unit || "unit"}.`
      : "No asset record was found.";
  }

  if (/how many transfers|transfers do i have/.test(q)) {
    return `You have ${number(deviceTransfers.length)} transfer record(s).`;
  }

  if (/recent transfers/.test(q)) {
    const rows = [...deviceTransfers]
      .sort((a, b) => new Date(b.createdAt || b.transferDate || 0) - new Date(a.createdAt || a.transferDate || 0))
      .slice(0, 8)
      .map((item) => `- ${item.transferId || item.referenceNumber || "Transfer"}: ${item.assetLabel || item.assetName || item.assetId || "Asset"} (${item.sourceLocation || item.sourceType || "-"} -> ${item.destinationLocation || item.destinationType || "-"})`);
    return `Recent transfers:\n${formatList(rows)}`;
  }

  if (/supplier.*most purchases|most purchases/.test(q)) {
    const totals = new Map();
    supplierPurchases.forEach((purchase) => {
      const name = purchase.supplierName || purchase.supplier || "Unknown Supplier";
      totals.set(name, (totals.get(name) || 0) + Number(purchase.quantity || 0));
    });
    const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return `Suppliers by purchased quantity:\n${formatList(rows.map(([name, quantity]) => `- ${name}: ${number(quantity)} item(s)`))}`;
  }

  if (/how many towers|towers do i have/.test(q)) {
    return `You have ${number(towerAssets.length)} tower record(s).`;
  }

  if (/tower.*most assets/.test(q)) {
    const rows = towerAssets
      .map((tower) => ({
        name: `${tower.towerName || "Tower"}${tower.towerLocation ? ` - ${tower.towerLocation}` : ""}`,
        qty: Array.isArray(tower.assets)
          ? tower.assets.reduce((sum, asset) => sum + Number(asset.quantity || 1), 0)
          : Number(tower.assetCount || 0),
      }))
      .sort((a, b) => b.qty - a.qty);
    return `Towers by asset quantity:\n${formatList(rows.map((item) => `- ${item.name}: ${number(item.qty)} unit(s)`))}`;
  }

  if (/customers.*deposits|deposits.*customers/.test(q)) {
    const rows = securityDeposits
      .filter((deposit) => Number(deposit.amount || deposit.depositAmount || 0) > 0)
      .map((deposit) => `- ${deposit.customerName || deposit.customer || "Customer"}: ${money(deposit.amount || deposit.depositAmount)}`);
    return `Customer deposits:\n${formatList(rows)}`;
  }

  if (/system summary|summary/.test(q)) {
    return `System summary:\nCustomers: ${number(customers.length)}\nAssets: ${number(assets.length)}\nMain Stock Quantity: ${number(mainStockQuantity)}\nTower Assets: ${number(towerQuantity)}\nCustomer Assets: ${number(customerQuantity)}`;
  }

  if (/\bhello\b|\bhi\b|how are you|چطور استی|سلام/.test(q)) {
    return "I am ready and connected to your system data. You can ask me about customers, assets, stock, towers, suppliers, repairs, and transfers.";
  }

  return "This system has a simple AI Agent that answers using your system data. It cannot handle hard, general, or complex questions outside this ISP management system yet.";
}

function buildAnswerV2(question, data) {
  const q = lower(question);
  const {
    assets,
    customers,
    suppliers,
    deviceTransfers,
    towerAssets,
    securityDeposits,
    supplierPurchases,
  } = data;

  const mainStockQuantity = assets.reduce((sum, asset) => sum + Number(asset.quantity || 0), 0);
  const activeTransfers = deviceTransfers.filter(isApprovedTransfer);
  const realTransfers = deviceTransfers.filter(isAssetTransfer);
  const transferQty = (field, type) =>
    activeTransfers
      .filter((item) => lower(item[field]) === lower(type))
      .reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const towerRows = getCurrentLocationRows(deviceTransfers, assets, "Tower");
  const customerRows = getCurrentLocationRows(deviceTransfers, assets, "Customer");
  const repairRows = getCurrentLocationRows(deviceTransfers, assets, "Repair");
  const wasteRows = getCurrentLocationRows(deviceTransfers, assets, "Waste");
  const inactiveCustomers = customers.filter(isInactiveCustomer);
  const activeCustomers = customers.filter((customer) => !isInactiveCustomer(customer));
  const depositRows = deviceTransfers.filter((item) => Number(item.depositAmount || item.depositReceivedAmount || 0) > 0);
  const withdrawRows = deviceTransfers.filter((item) => Number(item.refundAmount || item.withdrawAmount || 0) > 0);
  const totalDeposit = depositRows.reduce((sum, item) => sum + Number(item.depositAmount || item.depositReceivedAmount || 0), 0);
  const totalWithdraw = withdrawRows.reduce((sum, item) => sum + Number(item.refundAmount || item.withdrawAmount || 0), 0);
  const depositsHeldFromRecords = securityDeposits.reduce(
    (sum, item) =>
      sum +
      Number(item.remainingDeposit || item.amount || item.depositAmount || 0) -
      Number(item.refundAmount || 0),
    0
  );
  const depositsHeld = Math.max(totalDeposit - totalWithdraw, depositsHeldFromRecords, 0);
  const outstandingDeposits = securityDeposits.reduce(
    (sum, item) => sum + Number(item.outstandingAmount || item.remainingDeposit || 0),
    0
  );
  const categoryTotals = groupCount(
    [
      ...assets.map((asset) => ({ ...asset, quantity: Number(asset.quantity || 0) || 1 })),
      ...customerRows,
      ...towerRows,
      ...repairRows,
      ...wasteRows,
    ],
    (item) => item.category
  );

  if (/\bhello\b|\bhi\b|how are you|سلام|چطور/.test(q)) {
    return "I am ready and connected to your system data. Ask me about assets, customers, towers, suppliers, transfers, deposits, withdraws, repair, and waste.";
  }

  if (/system summary|summary/.test(q)) {
    return `System summary:\nCustomers: ${number(customers.length)} (${number(activeCustomers.length)} active, ${number(inactiveCustomers.length)} inactive/suspend)\nAsset categories: ${number(categoryTotals.length)}\nAsset definitions: ${number(assets.length)}\nMain Stock quantity: ${number(mainStockQuantity)}\nCustomer assets: ${number(customerRows.length)}\nTower assets: ${number(towerRows.length)}\nRepair assets: ${number(repairRows.length)}\nWaste assets: ${number(wasteRows.length)}\nTransfers: ${number(realTransfers.length)}\nSuppliers: ${number(suppliers.length)}`;
  }

  if (/how many customers|customers do (i|we) have|total customers|customer count/.test(q)) {
    return `You have ${number(customers.length)} customer record(s).`;
  }

  if (/active customers/.test(q)) {
    const rows = activeCustomers.map((customer) => {
      const name = customer.customerName || customer.fullName || customer.name || "Customer";
      const held = customerRows.filter((row) =>
        lower(row.locationName).includes(lower(customer.customerId || name)) ||
        lower(row.locationName).includes(lower(name))
      );
      return `- ${customer.customerId || "-"} - ${name}: ${number(held.length)} asset record(s)`;
    });
    return `Active customers: ${number(activeCustomers.length)}\n${formatList(rows)}`;
  }

  if (/inactive|suspend|disabled|disconnect/.test(q) && /customer/.test(q)) {
    const inactiveAssetCount = inactiveCustomers.reduce((sum, customer) => {
      const name = customer.customerName || customer.fullName || customer.name || "";
      return (
        sum +
        customerRows.filter((row) =>
          lower(row.locationName).includes(lower(customer.customerId || name)) ||
          lower(row.locationName).includes(lower(name))
        ).length
      );
    }, 0);
    return `Inactive / Suspend customers: ${number(inactiveCustomers.length)}\nAssets still with them: ${number(inactiveAssetCount)} asset record(s).`;
  }

  if (/asset categor|category summary|category/.test(q)) {
    return `Asset category summary:\n${formatList(
      categoryTotals.map(([category, qty]) => `- ${category}: ${number(qty)} unit(s)`)
    )}`;
  }

  if (/total assets|how many assets|assets do (i|we) have|current assets/.test(q)) {
    return `Current asset summary:\nAsset categories: ${number(categoryTotals.length)}\nMain Stock units: ${number(mainStockQuantity)}\nWith customers: ${number(customerRows.length)}\nAt towers: ${number(towerRows.length)}\nUnder repair: ${number(repairRows.length)}\nWaste: ${number(wasteRows.length)}`;
  }

  if (/main stock/.test(q) && /summary|asset|quantity|stock/.test(q)) {
    const rows = assets
      .filter((asset) => Number(asset.quantity || 0) > 0)
      .map((asset) => `- ${asset.category || "-"} - ${asset.assetId || asset.id || "-"} - ${asset.deviceName || "Asset"}: ${number(asset.quantity)} ${asset.purchaseUsageUnit || asset.purchaseUnit || asset.unit || "Piece"}`);
    return `Main Stock summary:\nAsset definitions in stock: ${number(rows.length)}\nTotal quantity: ${number(mainStockQuantity)}\n${formatList(rows)}`;
  }

  if (/with customers|customer-held|customers/.test(q) && /asset|device/.test(q)) {
    return `Assets currently with customers: ${number(customerRows.length)} asset record(s).\n${formatList(
      customerRows.map((row) => `- ${transferAssetLabel(row)}: ${row.locationName || "Customer"} (${number(row.quantity)} ${row.unit || "Piece"})`)
    )}`;
  }

  if (/at towers|tower-held|tower/.test(q) && /asset|device/.test(q)) {
    return `Assets currently at towers: ${number(towerRows.length)} asset record(s).\n${formatList(
      towerRows.map((row) => `- ${transferAssetLabel(row)}: ${row.locationName || "Tower"} (${number(row.quantity)} ${row.unit || "Piece"})`)
    )}`;
  }

  if (/waste|wasted|damaged|lost/.test(q)) {
    const damagedQuantity = transferQty("destinationType", "Damaged");
    const lostQuantity = transferQty("destinationType", "Lost");
    const rows = [
      ...wasteRows,
      ...realTransfers.filter((item) => /waste|damaged|lost/i.test(`${item.destinationType || ""} ${item.newStatus || ""} ${item.status || ""}`)),
    ];
    return `Waste / damaged / lost assets: ${number(Math.max(wasteRows.length, damagedQuantity + lostQuantity, rows.length))} record(s).\n${formatList(
      rows.map((row) => `- ${transferAssetLabel(row)} | From: ${row.sourceLocation || row.locationName || "-"} | Date: ${row.transferDate || row.date || row.createdAt || "-"}`)
    )}`;
  }

  if (/under repair|in repair|repair/.test(q)) {
    const repairQuantity = Math.max(transferQty("destinationType", "Repair") - transferQty("sourceType", "Repair"), repairRows.length, 0);
    return `Assets currently under repair: ${number(repairQuantity)} record(s).\n${formatList(
      repairRows.map((row) => `- ${transferAssetLabel(row)} | Issued from: ${row.transfer?.sourceLocation || "-"} | Date: ${row.date || "-"}`)
    )}`;
  }

  if (/deposit.*held|held deposit|how much deposit/.test(q)) {
    return `Total deposits held are ${money(depositsHeld)}.`;
  }

  if (/deposit|withdraw|widthraw/.test(q)) {
    return `Deposit Recived / Deposit Paid summary:\nDeposit Recived total: ${money(totalDeposit)} from ${number(depositRows.length)} transfer record(s)\nDeposit Paid total: ${money(totalWithdraw)} from ${number(withdrawRows.length)} transfer record(s)\nCurrent held deposit: ${money(depositsHeld)}\nOutstanding deposits: ${money(outstandingDeposits)}`;
  }

  if (/low stock/.test(q)) {
    const rows = assets
      .filter((asset) => Number(asset.alertQuantity || 0) > 0 && Number(asset.quantity || 0) <= Number(asset.alertQuantity || 0))
      .map((asset) => `- ${asset.assetId || asset.id} - ${asset.deviceName || "Asset"}: ${number(asset.quantity)} ${asset.purchaseUnit || asset.unit || "unit"}`);
    return `Low stock assets:\n${formatList(rows)}`;
  }

  if (/highest quantity/.test(q)) {
    const asset = [...assets].sort((a, b) => Number(b.quantity || 0) - Number(a.quantity || 0))[0];
    return asset
      ? `Highest quantity asset: ${asset.assetId || asset.id} - ${asset.deviceName || "Asset"} with ${number(asset.quantity)} ${asset.purchaseUnit || asset.unit || "unit"}.`
      : "No asset record was found.";
  }

  if (/customer to customer|customer -> customer/.test(q)) {
    const rows = realTransfers.filter((item) => lower(item.transferType).includes("customer -> customer"));
    return `Customer -> Customer transfers: ${number(rows.length)} record(s).\n${formatList(
      rows.map((item) => `- ${item.transferId || item.referenceNumber || "Transfer"}: ${transferAssetLabel(item)} | ${item.sourceLocation || "-"} -> ${item.destinationLocation || "-"} | Deposit Recived: ${money(item.depositAmount)} | Deposit Paid: ${money(item.refundAmount)}`)
    )}`;
  }

  if (/how many transfers|transfers do (i|we) have|transfer count/.test(q)) {
    return `You have ${number(realTransfers.length)} asset transfer record(s).`;
  }

  if (/recent transfers/.test(q)) {
    const rows = [...realTransfers]
      .sort((a, b) => new Date(b.createdAt || b.transferDate || 0) - new Date(a.createdAt || a.transferDate || 0))
      .slice(0, 8)
      .map((item) => `- ${item.transferId || item.referenceNumber || "Transfer"}: ${transferAssetLabel(item)} (${item.sourceLocation || item.sourceType || "-"} -> ${item.destinationLocation || item.destinationType || "-"}) | Date: ${item.transferDate || item.createdAt || "-"}`);
    return `Recent transfers:\n${formatList(rows)}`;
  }

  if (/supplier.*most purchases|most purchases/.test(q)) {
    const totals = new Map();
    supplierPurchases.forEach((purchase) => {
      const name = purchase.supplierName || purchase.supplier || "Unknown Supplier";
      totals.set(name, (totals.get(name) || 0) + Number(purchase.quantity || 0));
    });
    const rows = [...totals.entries()].sort((a, b) => b[1] - a[1]);
    return `Suppliers by purchased quantity:\n${formatList(rows.map(([name, quantity]) => `- ${name}: ${number(quantity)} item(s)`))}`;
  }

  if (/how many towers|towers do (i|we) have|total towers/.test(q)) {
    const towerNames = new Set([
      ...towerAssets.map((tower) => tower.towerName || tower.destinationLocation).filter(Boolean),
      ...towerRows.map((row) => row.locationName).filter(Boolean),
    ]);
    return `You have ${number(towerNames.size || towerAssets.length)} tower(s).`;
  }

  if (/tower.*most assets/.test(q)) {
    const totals = groupCount(towerRows, (row) => row.locationName || "Tower");
    return `Towers by asset quantity:\n${formatList(totals.map(([name, qty]) => `- ${name}: ${number(qty)} unit(s)`))}`;
  }

  if (/customers.*deposits|deposits.*customers/.test(q)) {
    const rows = depositRows.map((deposit) => `- ${deposit.toCustomerName || deposit.customerName || deposit.destinationLocation || "Customer"}: ${money(deposit.depositAmount || deposit.depositReceivedAmount)} | ${deposit.transferId || deposit.referenceNumber || "-"}`);
    return `Customer deposits:\n${formatList(rows)}`;
  }

  return "I could not match that question yet. Try asking about system summary, asset categories, main stock, active or suspend customers, towers, recent transfers, Customer -> Customer transfers, deposits, withdraws, repair, or waste.";
}

function Agent() {
  const [assets] = useJsonCollection("assets");
  const [customers] = useJsonCollection("customers");
  const [suppliers] = useJsonCollection("suppliers");
  const [deviceTransfers] = useJsonCollection("deviceTransfers");
  const [towerAssets] = useJsonCollection("towerAssets");
  const [securityDeposits] = useJsonCollection("securityDeposits");
  const [supplierPurchases] = useJsonCollection("supplierPurchases");

  const [conversations, setConversations] = useState(loadConversations);
  const [activeId, setActiveId] = useState(() => conversations[0]?.id || "");
  const [draft, setDraft] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [renamingId, setRenamingId] = useState("");
  const [renameDraft, setRenameDraft] = useState("");
  const typingTimer = useRef(null);
  const messagesEndRef = useRef(null);

  const data = useMemo(
    () => ({
      assets,
      customers,
      suppliers,
      deviceTransfers,
      towerAssets,
      securityDeposits,
      supplierPurchases,
    }),
    [assets, customers, suppliers, deviceTransfers, towerAssets, securityDeposits, supplierPurchases]
  );

  const activeConversation = conversations.find((conversation) => conversation.id === activeId) || conversations[0];

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation?.messages, isThinking]);

  useEffect(
    () => () => {
      if (typingTimer.current) {
        clearInterval(typingTimer.current);
      }
    },
    []
  );

  const updateConversation = (id, updater) => {
    setConversations((previous) =>
      previous.map((conversation) =>
        conversation.id === id ? updater(conversation) : conversation
      )
    );
  };

  const createConversation = () => {
    const next = defaultConversation();
    setConversations((previous) => [next, ...previous]);
    setActiveId(next.id);
  };

  const deleteConversation = (id) => {
    setConversations((previous) => {
      const remaining = previous.filter((conversation) => conversation.id !== id);
      const next = remaining.length ? remaining : [defaultConversation()];
      if (id === activeId) {
        setActiveId(next[0].id);
      }
      return next;
    });
  };

  const startRename = (conversation) => {
    setRenamingId(conversation.id);
    setRenameDraft(conversation.title || "Conversation");
  };

  const saveRename = () => {
    const title = renameDraft.trim() || "Conversation";
    updateConversation(renamingId, (conversation) => ({ ...conversation, title }));
    setRenamingId("");
    setRenameDraft("");
  };

  const typeAssistantMessage = (conversationId, messageId, finalText) => {
    let index = 0;
    typingTimer.current = setInterval(() => {
      index += 3;
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === messageId
            ? {
                ...message,
                text: finalText.slice(0, index),
                pending: index < finalText.length,
              }
            : message
        ),
      }));

      if (index >= finalText.length) {
        clearInterval(typingTimer.current);
        typingTimer.current = null;
        setIsThinking(false);
      }
    }, 22);
  };

  const sendQuestion = (question) => {
    const text = question.trim();
    if (!text || isThinking || !activeConversation) return;

    const conversationId = activeConversation.id;
    const userMessage = {
      id: `msg-${Date.now()}-user`,
      role: "user",
      text,
    };
    const assistantId = `msg-${Date.now()}-assistant`;
    const waitMessage = {
      id: assistantId,
      role: "assistant",
      text: "Please wait, I will check the system data...",
      pending: true,
      feedback: "",
    };

    updateConversation(conversationId, (conversation) => ({
      ...conversation,
      title: conversation.title === "New Conversation" ? text.slice(0, 44) : conversation.title,
      messages: [...conversation.messages, userMessage, waitMessage],
    }));
    setDraft("");
    setIsThinking(true);

    window.setTimeout(() => {
      const answer = buildAnswerV2(text, data);
      updateConversation(conversationId, (conversation) => ({
        ...conversation,
        messages: conversation.messages.map((message) =>
          message.id === assistantId ? { ...message, text: "", pending: true } : message
        ),
      }));
      typeAssistantMessage(conversationId, assistantId, answer);
    }, 2000);
  };

  const setFeedback = (messageId, feedback) => {
    if (!activeConversation) return;
    updateConversation(activeConversation.id, (conversation) => ({
      ...conversation,
      messages: conversation.messages.map((message) =>
        message.id === messageId ? { ...message, feedback } : message
      ),
    }));
  };

  return (
    <div className="agent-page">
      <section className="agent-history">
        <div className="agent-panel-header">
          <div>
            <span className="agent-kicker"><History size={13} /> Agent</span>
            <h2>Conversations</h2>
          </div>
          <button type="button" onClick={createConversation} title="New conversation">
            <Plus size={16} />
          </button>
        </div>

        <div className="agent-history-list">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`agent-history-item ${conversation.id === activeConversation?.id ? "active" : ""}`}
            >
              {renamingId === conversation.id ? (
                <input
                  value={renameDraft}
                  autoFocus
                  onChange={(event) => setRenameDraft(event.target.value)}
                  onBlur={saveRename}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") saveRename();
                    if (event.key === "Escape") setRenamingId("");
                  }}
                />
              ) : (
                <button type="button" onClick={() => setActiveId(conversation.id)}>
                  <strong>{conversation.title}</strong>
                  <small>{conversation.messages.length} message(s)</small>
                </button>
              )}

              <div className="agent-history-actions">
                <button type="button" onClick={() => startRename(conversation)} title="Rename">
                  <Edit3 size={14} />
                </button>
                <button type="button" onClick={() => deleteConversation(conversation.id)} title="Delete">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="agent-chat">
        <div className="agent-chat-header">
          <div>
            <span className="agent-kicker"><Bot size={13} /> AI Workspace</span>
            <h1>System Agent</h1>
            <p>Ask about customers, stock, assets, towers, suppliers, repair, and transfers.</p>
          </div>
        </div>

        <div className="agent-messages">
          {activeConversation?.messages.map((message) => (
            <div key={message.id} className={`agent-message ${message.role}`}>
              <div className="agent-message-bubble">
                <span className="agent-message-icon">
                  {message.role === "assistant" ? <Bot size={15} /> : <MessageSquareText size={15} />}
                </span>
                <p>{message.text}</p>
                {message.role === "assistant" && !message.pending && (
                  <div className="agent-feedback">
                    <button
                      type="button"
                      className={message.feedback === "like" ? "active" : ""}
                      onClick={() => setFeedback(message.id, "like")}
                      title="Like"
                    >
                      <ThumbsUp size={15} />
                    </button>
                    <button
                      type="button"
                      className={message.feedback === "dislike" ? "active" : ""}
                      onClick={() => setFeedback(message.id, "dislike")}
                      title="Dislike"
                    >
                      <ThumbsDown size={15} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <form
          className="agent-composer"
          onSubmit={(event) => {
            event.preventDefault();
            sendQuestion(draft);
          }}
        >
          <textarea
            value={draft}
            placeholder="Ask the system Agent..."
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendQuestion(draft);
              }
            }}
          />
          <button type="submit" disabled={!draft.trim() || isThinking}>
            <Send size={18} />
            Send
          </button>
        </form>
      </section>

      <aside className="agent-suggestions">
        <div className="agent-panel-header">
          <div>
            <span className="agent-kicker"><HelpCircle size={13} /> Prompts</span>
            <h2>Suggested Questions</h2>
          </div>
        </div>

        <div className="agent-suggestion-list">
          {suggestedSections.map((section) => {
            const SectionIcon = section.icon;
            return (
              <div className="agent-suggestion-section" key={section.title}>
                <h3>
                  <SectionIcon size={15} />
                  {section.title}
                </h3>
                {section.questions.map((question) => {
                  const QuestionIcon = getQuestionIcon(question);
                  return (
                    <button
                      type="button"
                      key={question}
                      disabled={isThinking}
                      onClick={() => sendQuestion(question)}
                    >
                      <QuestionIcon size={15} />
                      {question}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export default Agent;


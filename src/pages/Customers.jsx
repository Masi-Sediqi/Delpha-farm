import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJsonCollection } from "../hooks/useJsonCollection";
import { notify } from "../utils/notify";
import { formatDateTime, todayDateValue } from "../utils/afghanDate";
import {
  buildCustomerInsights,
  displayCustomerStatus,
  isInactiveCustomer,
  sumCustomerRows,
} from "../utils/customerInsights";
import "./Customers.css";

const emptyForm = {
  customerId: "",
  customerName: "",
  electricityBillNumber: "",
  phone: "",
  contactNumber: "",
  email: "",
  nationalId: "",
  address: "",
  registrationDate: "",
  status: "Active",
  notes: "",
};

const emptyIssueDeviceForm = {
  sourceType: "Main Stock",
  fromCustomerId: "",
  assetKey: "",
  issueDate: new Date().toISOString().slice(0, 10),
  issueStatus: "Issued",
  ownershipType: "Leased",
  salePrice: "",
  paidAmount: "",
  remainAmount: "",
  depositCurrency: "AFN",
  depositAmount: "",
  depositStatus: "Held",
  notes: "",
};


function InfoIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" strokeWidth="2" />
      <path d="M12 16v-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M12 8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M12 20h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 6V4h8v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 6l1 15h10l1-15" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M10 11v6M14 11v6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function money(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function Customers() {
  const [customers, setCustomers] = useJsonCollection("customers");
  const [formData, setFormData] = useState(emptyForm);
  const [showModal, setShowModal] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [deleteIndex, setDeleteIndex] = useState(null);

  const [openAction, setOpenAction] = useState(null);
  const [actionPosition, setActionPosition] = useState({ top: 0, left: 0 });


  const [assets, setAssets] = useJsonCollection("assets");
  const [deviceTransfers, setDeviceTransfers] = useJsonCollection("deviceTransfers");

  const [showIssueDeviceModal, setShowIssueDeviceModal] = useState(false);
  const [issueDeviceCustomer, setIssueDeviceCustomer] = useState(null);
  const [issueDeviceForm, setIssueDeviceForm] = useState(emptyIssueDeviceForm);

const navigate = useNavigate();
const getAssetKey = (asset) => String(asset.id || asset.assetId || asset.serialNumber || "");

const getAssetLabel = (asset) => {
  const id = asset.assetId || "No Asset ID";
  const name = asset.deviceName || "Unnamed Device";
  const serial = asset.serialNumber ? ` / SN: ${asset.serialNumber}` : "";
  const mac = asset.macAddress ? ` / MAC: ${asset.macAddress}` : "";

  return `${id} - ${name}${serial}${mac}`;
};

const getCustomerName = (customer) => {
  return (
    customer.customerName ||
    customer.fullName ||
    customer.name ||
    `${customer.firstName || ""} ${customer.lastName || ""}`.trim() ||
    "Unnamed Customer"
  );
};

const customerMatches = (customer, record) => {
  return (
    String(record?.customerRecordId || record?.toCustomerRecordId || "") ===
      String(customer.id || "") ||
    String(record?.customerId || record?.toCustomerId || "") ===
      String(customer.customerId || "")
  );
};

const getCustomerDeviceCount = (customer) => {
  const assetCount = assets.reduce((sum, asset) => {
    const units = Array.isArray(asset.identityRecords)
      ? asset.identityRecords
      : [];

    if (units.length) {
      return (
        sum +
        units.filter((unit) => customerMatches(customer, unit)).length
      );
    }

    return customerMatches(customer, asset) ? sum + 1 : sum;
  }, 0);

  const transferCount = deviceTransfers
    .filter(
      (transfer) =>
        String(transfer.approvalStatus || "Approved") !== "Rejected" &&
        !transfer.isSummaryRecord &&
        !transfer.summaryType &&
        !["Deposit", "Withdrawal"].includes(
          String(transfer.issueStatus || transfer.transferType || transfer.ownershipType || transfer.dealType || "")
        ) &&
        Number(transfer.quantity || 0) > 0
    )
    .reduce((sum, transfer) => {
      const sentToCustomer =
        String(transfer.toCustomerRecordId || "") ===
          String(customer.id || "") ||
        String(transfer.toCustomerId || "") ===
          String(customer.customerId || "") ||
        String(transfer.destinationRecordId || "") ===
          String(customer.id || "") ||
        String(transfer.destinationRecordId || "") ===
          String(customer.customerId || "");
      const removedFromCustomer =
        String(transfer.fromCustomerRecordId || "") ===
          String(customer.id || "") ||
        String(transfer.fromCustomerId || "") ===
          String(customer.customerId || "") ||
        String(transfer.sourceRecordId || "") ===
          String(customer.id || "") ||
        String(transfer.sourceRecordId || "") ===
          String(customer.customerId || "");

      if (sentToCustomer) return sum + 1;
      if (removedFromCustomer) return sum - 1;
      return sum;
    }, 0);

  return Math.max(assetCount, transferCount, 0);
};

const mainStockAssets = assets.filter((asset) => {
  const location = String(asset.location || "").toLowerCase();
  const status = String(asset.status || "").toLowerCase();

  return (
    location === "main stock" ||
    status === "in stock" ||
    status === "returned"
  );
});

const customerOwnedAssets = assets.filter((asset) => {
  if (issueDeviceForm.sourceType !== "Customer") return false;

  const fromCustomer = customers.find(
    (item) => String(item.id) === String(issueDeviceForm.fromCustomerId)
  );

  if (!fromCustomer) return false;

  return (
    String(asset.customerRecordId || "") === String(fromCustomer.id) ||
    String(asset.customerId || "") === String(fromCustomer.customerId)
  );
});

const availableIssueAssets =
  issueDeviceForm.sourceType === "Main Stock"
    ? mainStockAssets
    : customerOwnedAssets;

const selectedIssueAsset = assets.find(
  (asset) => getAssetKey(asset) === String(issueDeviceForm.assetKey)
);

const openIssueDeviceModal = (customer) => {
  setIssueDeviceCustomer(customer);
  setIssueDeviceForm(emptyIssueDeviceForm);
  setShowIssueDeviceModal(true);
};

const closeIssueDeviceModal = () => {
  setIssueDeviceCustomer(null);
  setIssueDeviceForm(emptyIssueDeviceForm);
  setShowIssueDeviceModal(false);
};

const handleIssueDeviceChange = (event) => {
  const { name, value } = event.target;

  setIssueDeviceForm((previous) => {
    const nextData = {
      ...previous,
      [name]: value,
    };

    if (name === "sourceType") {
      nextData.fromCustomerId = "";
      nextData.assetKey = "";
    }

    if (name === "ownershipType") {
      nextData.salePrice = "";
      nextData.paidAmount = "";
      nextData.remainAmount = "";
      nextData.depositAmount = "";
    }

    const salePrice =
      name === "salePrice"
        ? Number(value || 0)
        : Number(nextData.salePrice || 0);

    const paidAmount =
      name === "paidAmount"
        ? Number(value || 0)
        : Number(nextData.paidAmount || 0);

    if (nextData.ownershipType === "Sold") {
      nextData.remainAmount = Math.max(salePrice - paidAmount, 0);
    }

    return nextData;
  });
};

const saveIssueDevice = async (event) => {
  event.preventDefault();

  if (!issueDeviceCustomer) return;

  const asset = selectedIssueAsset;

  if (!asset) {
    notify("Please select a device.", "error");
    return;
  }

  if (
    issueDeviceForm.sourceType === "Customer" &&
    !issueDeviceForm.fromCustomerId
  ) {
    notify("Please select source customer.", "error");
    return;
  }

  if (
    issueDeviceForm.sourceType === "Customer" &&
    String(issueDeviceForm.fromCustomerId) === String(issueDeviceCustomer.id)
  ) {
    notify("Source customer and destination customer cannot be the same.", "error");
    return;
  }

  const fromCustomer =
    issueDeviceForm.sourceType === "Customer"
      ? customers.find(
          (item) => String(item.id) === String(issueDeviceForm.fromCustomerId)
        )
      : null;

  const salePrice = Number(issueDeviceForm.salePrice || 0);
  const paidAmount = Number(issueDeviceForm.paidAmount || 0);
  const remainAmount =
    issueDeviceForm.ownershipType === "Sold"
      ? Math.max(salePrice - paidAmount, 0)
      : 0;

  if (issueDeviceForm.ownershipType === "Sold" && paidAmount > salePrice) {
    notify("Paid amount cannot be greater than sale amount.", "error");
    return;
  }

  const depositAmount =
    issueDeviceForm.ownershipType === "Leased"
      ? Number(issueDeviceForm.depositAmount || 0)
      : 0;

  const transferRecord = {
    id: Date.now(),
    transferType:
      issueDeviceForm.sourceType === "Main Stock"
        ? "Main Stock to Customer"
        : "Customer to Customer",

    fromType: issueDeviceForm.sourceType,
    fromCustomerRecordId: fromCustomer?.id || "",
    fromCustomerId: fromCustomer?.customerId || "",
    fromCustomerName: fromCustomer ? getCustomerName(fromCustomer) : "Main Stock",

    toCustomerRecordId: issueDeviceCustomer.id,
    toCustomerId: issueDeviceCustomer.customerId,
    toCustomerName: getCustomerName(issueDeviceCustomer),

    assetRecordId: asset.id || "",
    assetId: asset.assetId || "",
    deviceName: asset.deviceName || "",
    category: asset.category || "",
    brand: asset.brand || "",
    model: asset.model || "",
    macAddress: asset.macAddress || "",
    serialNumber: asset.serialNumber || "",

    issueDate: issueDeviceForm.issueDate,
    issueStatus: issueDeviceForm.issueStatus,
    ownershipType: issueDeviceForm.ownershipType,

    salePrice,
    paidAmount,
    remainAmount,

    depositAmount,
    depositCurrency: issueDeviceForm.depositCurrency || "AFN",
    depositStatus:
      issueDeviceForm.ownershipType === "Leased"
        ? issueDeviceForm.depositStatus
        : "",

    notes: issueDeviceForm.notes.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const updatedAssets = assets.map((item) => {
    if (getAssetKey(item) !== getAssetKey(asset)) return item;

    return {
      ...item,
      location: "Customer",
      status:
        issueDeviceForm.ownershipType === "Sold"
          ? "Sold"
          : issueDeviceForm.issueStatus,
      ownershipType: issueDeviceForm.ownershipType,

      customerRecordId: issueDeviceCustomer.id,
      customerId: issueDeviceCustomer.customerId,
      customerName: getCustomerName(issueDeviceCustomer),

      previousCustomerRecordId: fromCustomer?.id || item.customerRecordId || "",
      previousCustomerId: fromCustomer?.customerId || item.customerId || "",
      previousCustomerName: fromCustomer
        ? getCustomerName(fromCustomer)
        : item.customerName || "",

      lastTransferDate: issueDeviceForm.issueDate,
      updatedAt: new Date().toISOString(),
    };
  });

  const assetsSaved = await setAssets(updatedAssets);
  if (!assetsSaved) return;

  const transferSaved = await setDeviceTransfers([
    ...deviceTransfers,
    transferRecord,
  ]);

  if (!transferSaved) return;

  notify("Device issued to customer successfully.");
  closeIssueDeviceModal();
};

  const filteredCustomers = customers
    .map((customer, originalIndex) => ({ ...customer, originalIndex }))
    .filter((customer) => {
      const keyword = search.toLowerCase();
      const customerStatus = displayCustomerStatus(customer.status);
      const matchesStatus =
        statusFilter === "All" || customerStatus === statusFilter;

      return matchesStatus && (
        (customer.customerId || "").toLowerCase().includes(keyword) ||
        (customer.customerName || "").toLowerCase().includes(keyword) ||
        (customer.electricityBillNumber || "").toLowerCase().includes(keyword) ||
        (customer.phone || "").toLowerCase().includes(keyword) ||
        (customer.contactNumber || "").toLowerCase().includes(keyword) ||
        (customer.email || "").toLowerCase().includes(keyword) ||
        (customer.nationalId || "").toLowerCase().includes(keyword) ||
        (customer.address || "").toLowerCase().includes(keyword) ||
        (customer.status || "").toLowerCase().includes(keyword)
      );
    });

  const generateCustomerId = () => {
    const numbers = customers
      .map((item) => String(item.customerId || ""))
      .map((id) => Number(id.replace("CUS-", "")))
      .filter((number) => !Number.isNaN(number));

    const nextNumber = numbers.length ? Math.max(...numbers) + 1 : 1;

    setFormData((previous) => ({
      ...previous,
      customerId: `CUS-${String(nextNumber).padStart(4, "0")}`,
    }));
  };

  const resetForm = () => {
    setFormData(emptyForm);
    setEditIndex(null);
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };

  const closeModal = () => {
    resetForm();
    setShowModal(false);
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const customerExists = (data) => {
    return customers.some((customer, index) => {
      if (editIndex !== null && index === editIndex) return false;

      const sameCustomerId =
        data.customerId &&
        customer.customerId &&
        data.customerId.toLowerCase() === customer.customerId.toLowerCase();

      const samePhone =
        data.phone &&
        customer.phone &&
        data.phone.toLowerCase() === customer.phone.toLowerCase();

      const sameNationalId =
        data.nationalId &&
        customer.nationalId &&
        data.nationalId.toLowerCase() === customer.nationalId.toLowerCase();

      return sameCustomerId || samePhone || sameNationalId;
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const cleanData = {
      id: editIndex !== null ? customers[editIndex]?.id || Date.now() : Date.now(),
      customerId: formData.customerId.trim(),
      customerName: formData.customerName.trim(),
      electricityBillNumber: formData.electricityBillNumber.trim(),
      phone: formData.phone.trim(),
      contactNumber: formData.contactNumber.trim(),
      email: formData.email.trim(),
      nationalId: formData.nationalId.trim(),
      address: formData.address.trim(),
      registrationDate: formData.registrationDate,
      status: displayCustomerStatus(formData.status),
      notes: formData.notes.trim(),
      createdAt: editIndex !== null ? customers[editIndex]?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!cleanData.customerId) {
      notify("Please enter or generate Customer ID.", "error");
      return;
    }

    if (!cleanData.customerName) {
      notify("Please enter customer name.", "error");
      return;
    }

    if (!cleanData.phone) {
      notify("Please enter customer phone.", "error");
      return;
    }

    if (customerExists(cleanData)) {
      notify("Customer ID, phone, or national ID already exists.", "error");
      return;
    }

    if (editIndex !== null) {
      const updatedCustomers = [...customers];
      updatedCustomers[editIndex] = cleanData;

      const saved = await setCustomers(updatedCustomers);

      if (saved) {
        notify("Customer updated successfully.");
        closeModal();
      }

      return;
    }

    const saved = await setCustomers([...customers, cleanData]);

    if (saved) {
      notify("Customer saved successfully.");
      closeModal();
    }
  };

  const openEditModal = (index) => {
    setEditIndex(index);
    setFormData({
      ...emptyForm,
      ...customers[index],
      status: displayCustomerStatus(customers[index]?.status),
      monthlyFee: String(customers[index]?.monthlyFee || ""),
    });
    setShowModal(true);
    setOpenAction(null);
  };

  const openDeleteModal = (index) => {
    setDeleteIndex(index);
    setOpenAction(null);
  };

  const cancelDelete = () => {
    setDeleteIndex(null);
  };

  const confirmDelete = async () => {
    if (deleteIndex === null) return;

    const saved = await setCustomers(customers.filter((_, index) => index !== deleteIndex));

    if (saved) {
      notify("Customer deleted successfully.");
      setDeleteIndex(null);
    }
  };

  const toggleActionMenu = (event, index) => {
    const rect = event.currentTarget.getBoundingClientRect();

    setActionPosition({
      top: rect.bottom + 8,
      left: rect.right - 160,
    });

    setOpenAction(openAction === index ? null : index);
  };

  const getStatusClass = (status) => {
    const displayStatus = displayCustomerStatus(status);
    if (displayStatus === "Active") return "customer-badge active";
    if (displayStatus === "Inactive") return "customer-badge inactive";
    if (displayStatus === "Suspend") return "customer-badge suspended";
    return "customer-badge";
  };

  const customerInsights = useMemo(
    () => buildCustomerInsights({ customers, assets, deviceTransfers }),
    [customers, assets, deviceTransfers]
  );
  const totalCustomerAssets = sumCustomerRows(customerInsights.customerRows);
  const customerCategoryPreview = customerInsights.categoryGroups.slice(0, 5);
  const activeCustomerCount = customers.filter((customer) => !isInactiveCustomer(customer)).length;
  const inactiveCustomerCount = customers.filter(isInactiveCustomer).length;

  return (
    <div className="customers-page">
      <div className="customers-header">
        <div>
          <h1>Customer Management</h1>
          <p>Register, edit, delete, and manage ISP customer records.</p>
        </div>

        <button type="button" className="customer-add-btn" onClick={openCreateModal}>
          + Add Customer
        </button>
      </div>

      <div className="customer-stats">
        <button type="button" className="customer-stat-card customer-stat-button customer-wide-stat" onClick={() => navigate("/customers/insights/categories")}>
          <span>Assets With Customers</span>
          <strong>{money(totalCustomerAssets)}</strong>
          <div className="customer-category-mini-list">
            {customerCategoryPreview.map((group) => (
              <p key={group.category}><b>{group.category}</b> {money(group.total)}</p>
            ))}
            {customerInsights.categoryGroups.length > 5 && (
              <p>+ {customerInsights.categoryGroups.length - 5} more categories</p>
            )}
          </div>
        </button>

        <button type="button" className="customer-stat-card customer-stat-button" onClick={() => navigate("/customers/insights/status")}>
          <span>Active / Suspend Customers</span>
          <strong>{activeCustomerCount + inactiveCustomerCount}</strong>
          <p>{activeCustomerCount} active, {inactiveCustomerCount} suspend</p>
        </button>

        <button type="button" className="customer-stat-card customer-stat-button" onClick={() => navigate("/customers/insights/outgoing")}>
          <span>Assets Issued by customers</span>
          <strong>{money(sumCustomerRows(customerInsights.outgoingRows))}</strong>
          <p>Customer source transfer assets</p>
        </button>

        <button type="button" className="customer-stat-card customer-stat-button" onClick={() => navigate("/customers/insights/incoming")}>
          <span>Assets Received By Customers</span>
          <strong>{money(sumCustomerRows(customerInsights.incomingRows))}</strong>
          <p>Assets arrived from other sources</p>
        </button>

      </div>

      <div className="customer-table-card">
        <div className="customer-table-header">
          <div>
            <h3>Customer List</h3>
            <p>All customers saved in the system</p>
          </div>

          <div className="customer-table-controls">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
            >
              <option value="All">All Customers</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Suspend">Suspend</option>
            </select>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search customer..."
            />
          </div>
        </div>

        <div className="customer-table-wrap">
          <table>
            <thead>
             <tr>
                <th>Customer ID</th>
                <th>Customer Name</th>
                <th>Phone</th>
                <th>Contact Number</th>
                <th>Registration Date</th>
                <th>Devices</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredCustomers.map((customer) => {
                const index = customer.originalIndex;

                return (
                  <tr key={customer.id || index}>
                    <td className="customer-strong">{customer.customerId || "-"}</td>
                    <td>{customer.customerName || "-"}</td>
                    <td>{customer.phone || "-"}</td>
                    <td>{customer.contactNumber || "-"}</td>
                    <td>
                      {formatDateTime(
                        customer.registrationDate,
                        customer.createdAt || customer.updatedAt
                      )}
                    </td>
                    <td>{money(getCustomerDeviceCount(customer))}</td>
                    <td>
                      <span className={getStatusClass(customer.status)}>
                        {displayCustomerStatus(customer.status) || "Unknown"}
                      </span>
                    </td>
                    <td>
                      <div className="customer-action-cell">
                        <button
                          type="button"
                          className="customer-action-btn"
                          onClick={(event) => toggleActionMenu(event, index)}
                        >
                          ⋮
                        </button>

                        {openAction === index && (
                          <div
                            className="customer-action-menu"
                            style={{
                              top: `${actionPosition.top}px`,
                              left: `${actionPosition.left}px`,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                navigate(`/customers/${customer.id || customer.customerId}`);
                                setOpenAction(null);
                              }}
                            >
                              <InfoIcon />
                              <span>Full Detail</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                navigate(`/customers/${customer.id || customer.customerId}/issue-device`);
                                setOpenAction(null);
                              }}
                            >
                              <span>↗</span>
                              <span>Issue Device</span>
                            </button>

                            <button type="button" onClick={() => openEditModal(index)}>
                              <EditIcon />
                              <span>Edit</span>
                            </button>

                            <button
                              type="button"
                              className="danger-action"
                              onClick={() => openDeleteModal(index)}
                            >
                              <TrashIcon />
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan="8" className="customer-empty">
                    No customer has been registered yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="customer-modal-backdrop">
          <div className="customer-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-modal-header">
              <div>
                <h3>{editIndex !== null ? "Edit Customer" : "Add Customer"}</h3>
                <p>Enter customer identity, contact, package, and account information.</p>
              </div>

              <button type="button" onClick={closeModal}>
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="customer-form-grid">
                <div className="customer-form-group">
                  <label>Customer ID</label>
                  <div className="customer-id-field">
                    <input
                      name="customerId"
                      value={formData.customerId}
                      onChange={handleChange}
                      placeholder="Example: CUS-0001"
                    />

                    <button type="button" onClick={generateCustomerId}>
                      Generate
                    </button>
                  </div>
                </div>

                <div className="customer-form-group">
                  <label>Customer Name</label>
                  <input
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    placeholder="Example: Rahmatullah"
                  />
                </div>

                <div className="customer-form-group">
                  <label>Electricity Bill Number</label>
                  <input
                    name="electricityBillNumber"
                    value={formData.electricityBillNumber}
                    onChange={handleChange}
                    placeholder="Example: EBN-12345"
                  />
                </div>

                <div className="customer-form-group">
                  <label>Phone</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Example: 0790000000"
                  />
                </div>

                <div className="customer-form-group">
                  <label>Contact Number</label>
                  <input
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    placeholder="Example: 0780000000"
                  />
                </div>

                <div className="customer-form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Example: customer@email.com"
                  />
                </div>

                <div className="customer-form-group">
                  <label>National ID</label>
                  <input
                    name="nationalId"
                    value={formData.nationalId}
                    onChange={handleChange}
                    placeholder="Example: Tazkira / NID"
                  />
                </div>


                <div className="customer-form-group">
                  <label>Activation date</label>
                  <input
                    type="date"
                    name="registrationDate"
                    value={formData.registrationDate}
                    onChange={handleChange}
                  />
                </div>

                <div className="customer-form-group">
                  <label>Status</label>
                  <select name="status" value={formData.status} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Suspend">Suspend</option>
                  </select>
                </div>

                <div className="customer-form-group customer-form-full">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Customer address..."
                  />
                </div>

                <div className="customer-form-group customer-form-full">
                  <label>Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Additional customer notes..."
                  />
                </div>
              </div>

              <div className="customer-modal-actions">
                <button type="button" className="customer-cancel-btn" onClick={closeModal}>
                  Cancel
                </button>

                <button type="submit" className="customer-save-btn">
                  {editIndex !== null ? "Save Changes" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

   

{showIssueDeviceModal && issueDeviceCustomer && (
  <div className="customer-modal-backdrop">
    <div className="customer-modal" onClick={(event) => event.stopPropagation()}>
      <div className="customer-modal-header">
        <div>
          <h3>Issue Device</h3>
          <p>
            Give, sell, or loan a device to {getCustomerName(issueDeviceCustomer)}.
          </p>
        </div>

        <button type="button" onClick={closeIssueDeviceModal}>
          ×
        </button>
      </div>

      <form onSubmit={saveIssueDevice}>
        <div className="customer-form-grid">
          <div className="customer-form-group">
            <label>Transfer Type</label>
            <select
              name="sourceType"
              value={issueDeviceForm.sourceType}
              onChange={handleIssueDeviceChange}
            >
              <option value="Main Stock">Main Stock to Customer</option>
              <option value="Customer">Customer to Customer</option>
            </select>
          </div>

          {issueDeviceForm.sourceType === "Customer" && (
            <div className="customer-form-group">
              <label>From Customer</label>
              <select
                name="fromCustomerId"
                value={issueDeviceForm.fromCustomerId}
                onChange={handleIssueDeviceChange}
              >
                <option value="">Select Source Customer</option>

                {customers
                  .filter(
                    (customer) =>
                      String(customer.id) !== String(issueDeviceCustomer.id)
                  )
                  .map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.customerId || "No ID"} - {getCustomerName(customer)}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="customer-form-group customer-form-full">
            <label>Select Device</label>
            <select
              name="assetKey"
              value={issueDeviceForm.assetKey}
              onChange={handleIssueDeviceChange}
            >
              <option value="">Select Device</option>

              {availableIssueAssets.map((asset) => (
                <option key={getAssetKey(asset)} value={getAssetKey(asset)}>
                  {getAssetLabel(asset)}
                </option>
              ))}
            </select>
          </div>

          {selectedIssueAsset && (
            <div className="customer-selected-device customer-form-full">
              <div>
                <span>Asset ID</span>
                <strong>{selectedIssueAsset.assetId || "-"}</strong>
              </div>
              <div>
                <span>Device Name</span>
                <strong>{selectedIssueAsset.deviceName || "-"}</strong>
              </div>
              <div>
                <span>Category</span>
                <strong>{selectedIssueAsset.category || "-"}</strong>
              </div>
              <div>
                <span>MAC Address</span>
                <strong>{selectedIssueAsset.macAddress || "-"}</strong>
              </div>
              <div>
                <span>Serial Number</span>
                <strong>{selectedIssueAsset.serialNumber || "-"}</strong>
              </div>
              <div>
                <span>Current Status</span>
                <strong>{selectedIssueAsset.status || "-"}</strong>
              </div>
            </div>
          )}

          <div className="customer-form-group">
            <label>Issue Date</label>
            <input
              type="date"
              name="issueDate"
              value={issueDeviceForm.issueDate}
              onChange={handleIssueDeviceChange}
            />
          </div>

          <div className="customer-form-group">
            <label>Device Status</label>
            <select
              name="issueStatus"
              value={issueDeviceForm.issueStatus}
              onChange={handleIssueDeviceChange}
            >
              <option value="Issued">Issued</option>
              <option value="Installed">Installed</option>
            </select>
          </div>

          <div className="customer-form-group">
            <label>Ownership Type</label>
            <select
              name="ownershipType"
              value={issueDeviceForm.ownershipType}
              onChange={handleIssueDeviceChange}
            >
              <option value="Leased">Leased / Deposit</option>
              <option value="Sold">Sold</option>
            </select>
          </div>

          {issueDeviceForm.ownershipType === "Sold" && (
            <>
              <div className="customer-form-group">
                <label>Sale Price</label>
                <input
                  type="number"
                  min="0"
                  name="salePrice"
                  value={issueDeviceForm.salePrice}
                  onChange={handleIssueDeviceChange}
                  placeholder="Example: 2500"
                />
              </div>

              <div className="customer-form-group">
                <label>Paid Amount</label>
                <input
                  type="number"
                  min="0"
                  name="paidAmount"
                  value={issueDeviceForm.paidAmount}
                  onChange={handleIssueDeviceChange}
                  placeholder="Example: 1000"
                />
              </div>

              <div className="customer-form-group">
                <label>Remain Amount</label>
                <input
                  value={`${Number(issueDeviceForm.remainAmount || 0).toLocaleString("en-US")} AFN`}
                  readOnly
                />
              </div>
            </>
          )}

          {issueDeviceForm.ownershipType === "Leased" && (
            <>
              <div className="customer-form-group">
                <label>Currency</label>
                <select
                  name="depositCurrency"
                  value={issueDeviceForm.depositCurrency}
                  onChange={handleIssueDeviceChange}
                >
                  <option value="AFN">Afghani</option>
                  <option value="USD">Dollar</option>
                </select>
              </div>

              <div className="customer-form-group">
                <label>Security Deposit Amount</label>
                <input
                  type="number"
                  min="0"
                  name="depositAmount"
                  value={issueDeviceForm.depositAmount}
                  onChange={handleIssueDeviceChange}
                  placeholder="Example: 1000"
                />
              </div>

              <div className="customer-form-group">
                <label>Deposit Status</label>
                <select
                  name="depositStatus"
                  value={issueDeviceForm.depositStatus}
                  onChange={handleIssueDeviceChange}
                >
                  <option value="Held">Held</option>
                  <option value="Full Received">Full Received</option>
                  <option value="Refunded">Refunded</option>
                  <option value="Outstanding">Outstanding</option>
                </select>
              </div>
            </>
          )}

          <div className="customer-form-group customer-form-full">
            <label>Notes</label>
            <textarea
              name="notes"
              value={issueDeviceForm.notes}
              onChange={handleIssueDeviceChange}
              placeholder="Device issue notes..."
            />
          </div>
        </div>

        <div className="customer-modal-actions">
          <button
            type="button"
            className="customer-cancel-btn"
            onClick={closeIssueDeviceModal}
          >
            Cancel
          </button>

          <button type="submit" className="customer-save-btn">
            Save Device Issue
          </button>
        </div>
      </form>
    </div>
  </div>
)}

      {deleteIndex !== null && (
        <div className="customer-delete-backdrop" onClick={cancelDelete}>
          <div className="customer-delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="customer-delete-icon">
              <TrashIcon />
            </div>

            <h3>Delete Customer</h3>
            <p>Are you sure you want to delete this customer? This action cannot be undone.</p>

            <div className="customer-delete-actions">
              <button type="button" className="customer-delete-cancel" onClick={cancelDelete}>
                Cancel
              </button>

              <button type="button" className="customer-delete-confirm" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Customers;

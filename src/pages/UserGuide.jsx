import { useMemo, useState } from "react";
import guideLogo from "../assets/logo.png";
import "./UserGuide.css";

const guideSections = [
  {
    key: "dashboard",
    title: "Dashboard",
    description:
      "The Dashboard is the central overview of the ISP Asset Inventory system. It shows total towers, active customers, inactive or suspend customers, current assets by category, wasted assets, date filters for today, yesterday, last week, last month, and custom ranges, plus charts for customer status, asset status, and transfers by date. Click dashboard cards to open detail pages with records and charts.",
  },
  {
    key: "suppliers",
    title: "Suppliers",
    description:
      "The Suppliers module is used to register and manage supplier records. The full supplier detail page focuses on supplier information, purchase history, total purchases, and total quantity by category and pieces. Supplier reports support date-from and date-to filters, and the print view uses the system logo, supplier information, color styling, and purchase summary cards.",
  },
  {
    key: "assets",
    title: "Asset & Inventory",
    description:
      "The Asset & Inventory module registers company devices and materials by category, asset name, tracking type, quantity, unit records, images, purchases, and balance entries. For individual records, MAC Address or Serial Number can identify the device; entering one is enough. Asset names are read from the current asset record, so when an asset name is changed it appears updated across related histories and reports.",
  },
  {
    key: "main-stock",
    title: "Main Stock",
    description:
      "The Main Stock module displays all assets currently available in the company warehouse. It shows category, device name, model, MAC address, serial number, quantity, tracking type, and low-stock warnings. Main Stock Transfer History includes filters by date, issued from, issued to, and status. Records are color-coded to separate assets issued from Main Stock from assets received from other sources.",
  },
  {
    key: "device-transfer",
    title: "Device Transfer",
    description:
      "The Device Transfer Management module records all movements of company assets. Assets can be transferred between Main Stock, towers, customers, repair, waste, and customers. Customer deals use Leased terminology. Deposit currency, deposit amount, deposit status, withdraw currency, and withdraw amount are saved on the same transfer record instead of creating separate deposit or withdraw records.",
  },
  {
    key: "customers",
    title: "Customers",
    description:
      "The Customers module manages customer profiles, phone numbers, electricity bill numbers, addresses, active and suspend status, current assets, incoming transfers, outgoing transfers, deposits, withdraws, and reconnect records. Customer detail pages focus on customer information, current assets, transfer history, deposits, and withdraws.",
  },
  {
    key: "tower-assets",
    title: "Tower",
    description:
      "The Tower module manages company towers and equipment installed at each tower. It summarizes asset categories at towers, active and inactive towers, incoming tower transfers, outgoing tower transfers, wasted tower assets, and repair assets. Tower detail pages show current assets with category, device name, source, date, and status filters.",
  },
  {
    key: "reports",
    title: "Reports",
    description:
      "The Reports module is a full reporting center. It shows asset quantities by category and piece, customer and suspend customer reports, tower reports, supplier purchase reports, transfer reports, deposit and withdraw reports, repair reports, and waste reports. Report pages include filters, charts, record tables, important dates, issued from, issued to, status, category, and device details. Print and PDF views are colored and include the system name and logo.",
  },
  {
    key: "repair",
    title: "Repair",
    description:
      "The Repair module tracks assets currently under repair, total assets sent to repair, fixed results, failed results, and assets sent from repair to another destination. Repair records include date, category, device name, source, issued to, status, notes, and result information. Repair result forms keep only the fields needed for the result.",
  },
  {
    key: "user-management",
    title: "User Management",
    description:
      "The User Management module controls user accounts, roles, statuses, passwords, and module permissions. Administrators can create users, assign categories, activate or deactivate accounts, and configure View, Create, Edit, and Delete permissions for every module. The active administrator account and final full-access account are protected from accidental deletion.",
  },
  {
    key: "settings",
    title: "Settings",
    description:
      "The Settings module controls company information and app data tools. You can configure company name, logo, subtitle, manual export/import backup, clear data, and automatic backup schedule. Automatic backup can be Off, Daily, Weekly, Monthly, or Custom days. When the system creates an automatic backup, it shows a notification.",
  },
  {
    key: "agent",
    title: "Agent / AI",
    description:
      "The Agent / AI module answers questions using information stored in the ISP Asset Inventory system. You can ask about customers, assets, Main Stock, suppliers, towers, transfers, deposits, withdraws, repair, waste, low-stock records, purchases, and system summaries. Suggested questions use clear icons and current system wording.",
  },
];

function UserGuide() {
  const [activeSection, setActiveSection] = useState("dashboard");

  const selectedSection = useMemo(
    () =>
      guideSections.find(
        (section) => section.key === activeSection
      ) || guideSections[0],
    [activeSection]
  );

  return (
    <div className="user-guide-page">
      <div className="user-guide-container">
        <header className="user-guide-hero">
          <div className="user-guide-logo">
            <img
              src={guideLogo}
              alt="AFGHAN POWER Logo"
            />
          </div>

          <h1>User Guide</h1>

          <p>
            Updated guide to the current ISP Asset Inventory modules
          </p>
        </header>

        <nav
          className="user-guide-tabs"
          aria-label="User guide modules"
        >
          {guideSections.map((section) => (
            <button
              key={section.key}
              type="button"
              className={
                activeSection === section.key ? "active" : ""
              }
              onClick={() => setActiveSection(section.key)}
            >
              {section.title}
            </button>
          ))}
        </nav>

        <section className="user-guide-content-card">
          <h2>{selectedSection.title}</h2>
          <p>{selectedSection.description}</p>
        </section>
      </div>
    </div>
  );
}

export default UserGuide;

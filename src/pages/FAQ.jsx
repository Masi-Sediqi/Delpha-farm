import { useState } from "react";
import { ChevronDown } from "lucide-react";
import faqLogo from "../assets/logo.png";
import "./FAQ.css";

const faqItems = [
  {
    id: "add-asset",
    question: "How do I register a new asset?",
    answer:
      "Go to Asset & Inventory and click Add Asset. Enter the asset name, category, quantity, tracking type, and any identity details you have. For individual device records, MAC Address or Serial Number can be used independently; you do not need to enter both.",
  },
  {
    id: "main-stock",
    question: "How do I view devices available in Main Stock?",
    answer:
      "Open Main Stock from the sidebar. The page displays current stock, category, device name, model, MAC address, serial number, quantity, tracking type, and transfer history. Main Stock transfer records use color to show whether the asset was issued from Main Stock or received from another source.",
  },
  {
    id: "transfer-device",
    question: "How do I transfer a device to a customer or tower?",
    answer:
      "Open Device Transfer Management and click New Transfer. Select the transfer type, issued from location, issued to location, transfer date, status, and available assets. Customer transfers can include currency, deposit amount, deposit status, and withdraw amount on the same transfer record.",
  },
  {
    id: "customer-device",
    question: "How do I issue a device to a customer?",
    answer:
      "Use Device Transfer Management and choose a customer destination. Select the exact device from available assets and save the transfer. The customer detail and Customer Device Transfer pages show category, device name, source, date, status, deposit, and withdraw information.",
  },
  {
    id: "customer-return",
    question: "How do I return a customer device to Main Stock?",
    answer:
      "Create a transfer from Customer to Main Stock, Tower, Repair, Waste, or another customer. If money is refunded, record the withdraw currency and amount in the Deposit Withdraw section of the same transfer.",
  },
  {
    id: "supplier-purchase",
    question: "How do I record a purchase from a supplier?",
    answer:
      "Open an asset detail page and click Purchase, or open the supplier-related purchase workflow. Select the supplier, quantity, date, invoice/reference, and individual unit records. MAC Address or Serial Number is enough for a unit; both are not required.",
  },
  {
    id: "tower",
    question: "How do I manage assets installed at a tower?",
    answer:
      "Open Tower. The tower page summarizes asset categories, active and inactive towers, incoming transfers, outgoing transfers, wasted assets, and repair assets. Click a card or row to view tower assets with category, device name, source, issued date, and status.",
  },
  {
    id: "repair",
    question: "How do I send an asset to repair?",
    answer:
      "Create a transfer with Repair as the issued-to location. The asset will appear in Repair Management with the date, source, category, device name, and current repair status.",
  },
  {
    id: "repair-result",
    question: "How do I record a repair result?",
    answer:
      "Open Repair Management and click Repair Result. Select the result, repair date, cost if needed, notes, and next destination. Quantity, customer deal, and responsible user are not required in the repair result form.",
  },
  {
    id: "damaged-lost",
    question: "How do I mark an asset as damaged, lost, or waste?",
    answer:
      "Use Device Transfer Management and send the asset to Waste, or use the supported asset action where available. Waste records show category, device name, source, destination, date, status, MAC address, and serial number where available.",
  },
  {
    id: "reports",
    question: "How do I generate or print a report?",
    answer:
      "Open Reports to see the reporting center. Reports include assets by category, customers, inactive/suspend customers, towers, suppliers, transfers, repair, waste, deposits, and withdraws. Each report page includes charts, records, filters, and colored print/PDF output with the system logo.",
  },
  {
    id: "search",
    question: "How do I search for a device or record?",
    answer:
      "Use the global search field in the header. It matches system data such as assets, customers, towers, suppliers, transfers, purchases, MAC addresses, serial numbers, deposits, withdraws, dates, statuses, and notes. Press Enter to open the full Result page with grouped details.",
  },
  {
    id: "user-account",
    question: "How do I create a new user account?",
    answer:
      "Open User Management and click Add User. Enter the full name, email or username, password, category, status, and note. Then configure View, Create, Edit, and Delete permissions for each module before saving the account.",
  },
  {
    id: "permissions",
    question: "How do I control user permissions?",
    answer:
      "Open User Management and edit the account. In the permission table, enable or disable View, Create, Edit, and Delete access for each system module. Users will only be able to open and use modules permitted for their account.",
  },
  {
    id: "dark-mode",
    question: "How do I change between light and dark mode?",
    answer:
      "Use the display mode button in the top Header. Clicking the button switches the system between light and dark mode. Pages that support the system theme will automatically update their backgrounds, cards, tables, forms, and text colors.",
  },
  {
    id: "backup",
    question: "How do I export and import system data?",
    answer:
      "Open Settings and go to App Data. Use Export Data to create a JSON backup file, or Import Data to restore a valid backup. You can also enable Automatically Backup and choose Daily, Weekly, Monthly, or Custom days. When an automatic backup is created, the system shows a notification.",
  },
  {
    id: "agent",
    question: "What can the Agent / AI module answer?",
    answer:
      "The Agent can answer system-data questions about customers, assets, Main Stock, suppliers, towers, transfers, deposits, withdraws, repair, waste, low stock, and summaries. It works from records already stored in the app.",
  },
  {
    id: "delete-record",
    question: "Can I edit or delete saved records?",
    answer:
      "Records that support editing and deletion include customers, suppliers, purchases, device transfers, tower records, repair records, and other configurable data. Open the Actions menu and choose Edit or Delete. Linked records can affect stock, transfer history, and reports.",
  },
];

function FAQ() {
  const [openId, setOpenId] = useState(faqItems[0].id);

  const toggleItem = (id) => {
    setOpenId((currentId) => (currentId === id ? "" : id));
  };

  return (
    <div className="faq-page">
      <div className="faq-container">
        <header className="faq-hero">
          <div className="faq-logo">
            <img src={faqLogo} alt="AFGHAN POWER Logo" />
          </div>

          <h1>FAQ</h1>

          <p>
            Frequently asked questions about the ISP Asset Inventory system
          </p>
        </header>

        <section className="faq-list">
          {faqItems.map((item) => {
            const isOpen = openId === item.id;

            return (
              <article
                key={item.id}
                className={`faq-item ${isOpen ? "open" : ""}`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() => toggleItem(item.id)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-answer-${item.id}`}
                >
                  <span>{item.question}</span>

                  <ChevronDown
                    size={18}
                    className={isOpen ? "open" : ""}
                  />
                </button>

                <div
                  id={`faq-answer-${item.id}`}
                  className="faq-answer"
                  hidden={!isOpen}
                >
                  <p>{item.answer}</p>
                </div>
              </article>
            );
          })}
        </section>
      </div>
    </div>
  );
}

export default FAQ;

import { useState } from "react";
import legalLogo from "../assets/logo.png";
import "./TermsPrivacy.css";

const termsItems = [
  {
    title: "LICENSE",
    text:
      "This software is licensed, not sold. You are granted a non-exclusive and non-transferable license to use this software for your ISP and asset management operations.",
  },
  {
    title: "OWNERSHIP",
    text:
      "The software, including its source code, interface, design, structure, and intellectual property, is owned by AFGHAN POWER. Source code is not provided to end users.",
  },
  {
    title: "USAGE",
    text:
      "You may use this software to manage ISP assets, suppliers, customers, towers, stock, device transfers, leases, deposits, withdraws, repairs, waste, reports, users, backups, and related business operations.",
  },
  {
    title: "RESTRICTIONS",
    text:
      "You may not reverse engineer, decompile, copy, redistribute, sublicense, resell, or attempt to extract the source code of this software without written authorization from AFGHAN POWER.",
  },
  {
    title: "DATA",
    text:
      "All business information entered into the system belongs to you, including assets, customers, suppliers, towers, transfers, deposits, withdraws, repair, waste, reports, users, and backup files. You are responsible for the accuracy, management, backup, security, and lawful use of your data.",
  },
  {
    title: "UPDATES",
    text:
      "Software updates may be provided periodically to improve functionality, performance, compatibility, reporting, printing, search, theme support, and security.",
  },
  {
    title: "DISCLAIMER",
    text:
      'This software is provided "as is" without warranty of any kind. AFGHAN POWER is not responsible for business losses, data loss, device failure, unauthorized access, or damages resulting from improper use of the software.',
  },
  {
    title: "SUPPORT",
    text:
      "Technical support is available through the Help Center and through the contact information provided inside the application.",
  },
];

const privacyItems = [
  {
    title: "DATA COLLECTION",
    text:
      "This application primarily operates using your own system data. Information such as assets, customers, suppliers, purchases, transfers, deposits, withdraws, towers, repairs, waste, reports, users, and settings is used only for system functionality.",
  },
  {
    title: "LOCAL STORAGE",
    text:
      "Depending on the installed version, system data may be stored locally on your device, inside the configured application database, or inside backup files created by you. Data is not intentionally transmitted to third parties without your action or authorization.",
  },
  {
    title: "NO ADVERTISING TRACKING",
    text:
      "AFGHAN POWER does not use this system to track users for advertising purposes or sell business information to advertisers.",
  },
  {
    title: "DATA SECURITY",
    text:
      "The system may provide passwords, user permissions, role-based access, session controls, local backups, and other security features. You are responsible for configuring and protecting user accounts, exported files, printed reports, and backups correctly.",
  },
  {
    title: "BACKUPS",
    text:
      "When you export or create a backup, the backup file is stored in the location selected by you. You are responsible for protecting, storing, and restoring backup files.",
  },
  {
    title: "SOURCE CODE",
    text:
      "The graphical application and permitted system functions are provided to users. Access to proprietary source code is not included unless separately agreed in writing by AFGHAN POWER.",
  },
  {
    title: "EXTERNAL SHARING",
    text:
      "When you use printing, PDF, export, import, email, messaging, or other external sharing features, information may be transferred through applications, printers, folders, or services selected by you. AFGHAN POWER does not control those external services.",
  },
  {
    title: "POLICY CHANGES",
    text:
      "This privacy policy may be updated periodically. Continued use of the software after an update constitutes acceptance of the revised policy.",
  },
];

function TermsPrivacy() {
  const [activeTab, setActiveTab] = useState("terms");

  const activeItems =
    activeTab === "terms" ? termsItems : privacyItems;

  return (
    <div className="terms-privacy-page">
      <div className="terms-privacy-container">
        <header className="terms-privacy-hero">
          <div className="terms-privacy-logo">
            <img
              src={legalLogo}
              alt="AFGHAN POWER Logo"
            />
          </div>

          <h1>Terms &amp; Privacy</h1>

          <p>
            Legal terms and privacy information for the ISP Asset
            Inventory system, updated for the current desktop version.
          </p>
        </header>

        <div
          className="terms-privacy-tabs"
          role="tablist"
          aria-label="Terms and privacy sections"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "terms"}
            className={activeTab === "terms" ? "active" : ""}
            onClick={() => setActiveTab("terms")}
          >
            Terms &amp; Conditions
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "privacy"}
            className={activeTab === "privacy" ? "active" : ""}
            onClick={() => setActiveTab("privacy")}
          >
            Privacy Policy
          </button>
        </div>

        <section className="terms-privacy-card">
          <h2>
            {activeTab === "terms"
              ? "Terms & Conditions"
              : "Privacy Policy"}
          </h2>

          {activeTab === "terms" ? (
            <p className="terms-privacy-introduction">
              By using the AFGHAN POWER ISP Asset Inventory
              Management System, you agree to the following terms
              and conditions:
            </p>
          ) : (
            <div className="terms-privacy-introduction">
              <p>
                AFGHAN POWER ISP Asset Inventory Management System
                Privacy Policy
              </p>

              <p>
                Developed and powered by AFGHAN POWER.
              </p>
            </div>
          )}

          <div className="terms-privacy-content">
            {activeItems.map((item, index) => (
              <article
                className="terms-privacy-item"
                key={item.title}
              >
                <p>
                  <strong>
                    {index + 1}. {item.title}:
                  </strong>{" "}
                  {item.text}
                </p>
              </article>
            ))}
          </div>

          {activeTab === "privacy" && (
            <p className="terms-privacy-contact">
              For questions about privacy, contact:{" "}
              <a href="mailto:info@afghapower.com">
                info@afghapower.com
              </a>
            </p>
          )}
        </section>

        <footer className="terms-privacy-footer">
          &copy; 2026 AFGHAN POWER. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default TermsPrivacy;


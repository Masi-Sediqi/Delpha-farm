import { useNavigate } from "react-router-dom";
import helpCenterLogo from "../assets/logo.png";
import {
  Bot,
  Boxes,
  FileBarChart,
  LayoutDashboard,
  Mail,
  Phone,
  RadioTower,
  Repeat2,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Warehouse,
  Wrench,
  Globe2,
} from "lucide-react";

import "./HelpCenter.css";

const helpModules = [
  {
    key: "dashboard",
    title: "Dashboard",
    description:
      "View tower, customer, asset, repair, waste, transfer, and deposit summaries with date filters and charts.",
    icon: LayoutDashboard,
    path: "/",
    tone: "violet",
  },
  {
    key: "suppliers",
    title: "Suppliers",
    description:
      "Manage supplier profiles, purchases, supplier detail reports, date filters, and colored print statements.",
    icon: Truck,
    path: "/suppliers",
    tone: "orange",
  },
  {
    key: "assets",
    title: "Asset & Inventory",
    description:
      "Register asset categories, device identities, stock quantities, purchases, balances, images, audit trails, and current locations.",
    icon: Boxes,
    path: "/assets",
    tone: "blue",
  },
  {
    key: "main-stock",
    title: "Main Stock",
    description:
      "View stock devices, categories, tracking details, low-stock records, and colored Main Stock transfer history.",
    icon: Warehouse,
    path: "/main-stock",
    tone: "cyan",
  },
  {
    key: "device-transfer",
    title: "Device Transfer Management",
    description:
      "Transfer assets between Main Stock, towers, customers, repair, and waste. Customer leases can include deposit and withdraw values on the same transfer record.",
    icon: Repeat2,
    path: "/device-transfer-management",
    tone: "indigo",
  },
  {
    key: "customers",
    title: "Customers",
    description:
      "Manage customer profiles, phone numbers, electricity bill numbers, active/suspend status, current devices, transfers, deposits, withdraws, and reconnect records.",
    icon: Users,
    path: "/customers",
    tone: "purple",
  },
  {
    key: "tower-assets",
    title: "Tower",
    description:
      "Manage towers, assets at each tower, incoming and outgoing tower transfers, repair/waste status, and tower detail histories.",
    icon: RadioTower,
    path: "/tower-assets",
    tone: "emerald",
  },
  {
    key: "reports",
    title: "Reports",
    description:
      "Open the reporting center for asset, customer, tower, supplier, transfer, repair, waste, deposit, and withdraw reports with charts, filters, records, print, and PDF.",
    icon: FileBarChart,
    path: "/reports",
    tone: "amber",
  },
  {
    key: "repair",
    title: "Repair",
    description:
      "Track assets currently under repair, assets sent to repair, repaired or failed results, and outgoing repair transfers.",
    icon: Wrench,
    path: "/repair",
    tone: "red",
  },
  {
    key: "user-management",
    title: "User Management",
    description:
      "Create user accounts, assign roles, configure permissions, and manage user access.",
    icon: ShieldCheck,
    path: "/user-management",
    tone: "slate",
  },
  {
    key: "settings",
    title: "Settings",
    description:
      "Configure company information, logo, manual backup, import/export, and automatic backup schedule.",
    icon: Settings,
    path: "/settings",
    tone: "gray",
  },
  {
    key: "agent",
    title: "Agent / AI",
    description:
      "Ask system-data questions about customers, assets, stock, towers, suppliers, transfers, deposits, withdraws, repair, and waste.",
    icon: Bot,
    path: "/agent",
    tone: "fuchsia",
  },
];

function HelpCenter() {
  const navigate = useNavigate();

  return (
    <div className="help-center-page">
      <div className="help-center-container">
        <header className="help-center-hero">
          <div className="help-center-logo">
  <img
    src={helpCenterLogo}
    alt="ISP Asset Inventory Logo"
  />
</div>

          <h1>Help Center</h1>

          <p>
            Updated help for the current ISP Asset Inventory system.
          </p>
        </header>

        <section className="help-center-modules">
          {helpModules.map((module) => {
            const Icon = module.icon;

            return (
              <button
                key={module.key}
                type="button"
                className="help-center-module-card"
                onClick={() => navigate(module.path)}
              >
                <span
                  className={`help-center-module-icon tone-${module.tone}`}
                >
                  <Icon size={22} strokeWidth={1.8} />
                </span>

                <span className="help-center-module-content">
                  <strong>{module.title}</strong>
                  <small>{module.description}</small>
                </span>
              </button>
            );
          })}
        </section>

        <section className="help-center-support">
          <h2>Contact Support</h2>

          <div className="help-center-support-list">
            <a href="mailto:info@afghapower.com">
              <span>
                <Mail size={19} />
              </span>

              <div>
                <small>Email</small>
                <strong>info@afghapower.com</strong>
              </div>
            </a>

            <a href="tel:0794948698">
              <span>
                <Phone size={19} />
              </span>

              <div>
                <small>Phone</small>
                <strong>0794948698</strong>
              </div>
            </a>

            <a
              href="https://www.afghanpower.com"
              target="_blank"
              rel="noreferrer"
            >
              <span>
                <Globe2 size={19} />
              </span>

              <div>
                <small>Website</small>
                <strong>www.afghanpower.com</strong>
              </div>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

export default HelpCenter;

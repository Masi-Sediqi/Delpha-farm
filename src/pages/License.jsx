import { useEffect, useMemo, useState } from "react";
import { KeyRound, ShieldAlert } from "lucide-react";
import { notify } from "../utils/notify";
import "./License.css";

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
}

function formatRemaining(ms) {
  const safeMs = Math.max(Number(ms || 0), 0);
  const days = Math.floor(safeMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((safeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `${days} day(s), ${hours} hour(s)`;
  return `${hours} hour(s)`;
}

function License({ onLicenseChanged }) {
  const [status, setStatus] = useState(null);
  const [licenseCode, setLicenseCode] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const canUseDesktopLicense = Boolean(window.ispDesktop?.getLicenseStatus);

  const title = useMemo(() => {
    if (!status) return "License";
    if (status.status === "trial-active") return "Trial License Active";
    if (status.status === "expired") return "License Expired";
    if (status.status === "trial-expired") return "Trial Expired";
    if (status.status === "clock-rollback") return "System Date Error";
    return "License Required";
  }, [status]);

  const loadStatus = async () => {
    if (!canUseDesktopLicense) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const nextStatus = await window.ispDesktop.getLicenseStatus();
      setStatus(nextStatus);
      onLicenseChanged?.(nextStatus);
    } catch (error) {
      setStatus({
        valid: false,
        status: "storage-error",
        error: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (!licenseCode.trim()) {
      notify("Please enter the license code.", "error");
      return;
    }

    setSaving(true);
    try {
      const nextStatus = await window.ispDesktop.activateLicense(licenseCode.trim());
      setStatus(nextStatus);
      onLicenseChanged?.(nextStatus);
      if (nextStatus.valid) {
        notify("License activated successfully.");
        window.location.hash = "#/";
      } else {
        notify("License code is not valid.", "error");
      }
    } catch (error) {
      notify(error.message || "License activation failed.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="license-page" dir="ltr">
      <section className="license-panel">
        <div className="license-icon">
          {status?.valid ? <KeyRound size={26} /> : <ShieldAlert size={26} />}
        </div>

        <h1>{title}</h1>
        <p>
          This desktop app works for one week during trial. After the trial ends,
          activate a license to continue.
        </p>

        <div className="license-status-grid">
          <div>
            <span>Status</span>
            <strong>{loading ? "Checking..." : status?.status || "Unavailable"}</strong>
          </div>
          <div>
            <span>Device ID</span>
            <strong>{status?.deviceId || "-"}</strong>
          </div>
          <div>
            <span>Trial Start</span>
            <strong>{formatDate(status?.trialStartedAt)}</strong>
          </div>
          <div>
            <span>Trial Expiry</span>
            <strong>{formatDate(status?.trialExpiresAt || status?.expiresAt)}</strong>
          </div>
          <div>
            <span>Remaining</span>
            <strong>{formatRemaining(status?.remainingTrialMs)}</strong>
          </div>
          <div>
            <span>Trial Days</span>
            <strong>{status?.trialDurationDays || 7}</strong>
          </div>
        </div>

        <form className="license-form" onSubmit={submit}>
          <label>
            License Code
            <textarea
              value={licenseCode}
              onChange={(event) => setLicenseCode(event.target.value)}
              placeholder="Paste license code here..."
              rows={5}
            />
          </label>
          <button type="submit" disabled={saving || !canUseDesktopLicense}>
            {saving ? "Activating..." : "Activate License"}
          </button>
        </form>
      </section>
    </div>
  );
}

export default License;

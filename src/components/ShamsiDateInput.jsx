import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  afghanToGregorian,
  formatAfghanDate,
  getAfghanMonthDays,
  getAfghanToday,
  gregorianToAfghan,
} from "../utils/afghanDate";
import "./ShamsiDateInput.css";

const languageKey = "afghan-power-language";

const calendarText = {
  en: {
    months: ["Hamal", "Sawr", "Jawza", "Saratan", "Asad", "Sonbola", "Mizan", "Aqrab", "Qaws", "Jadi", "Dalwa", "Hoot"],
    weekdays: ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"],
    previousMonth: "Previous month",
    nextMonth: "Next month",
    clear: "Clear",
    today: "Today",
    placeholder: "Select Solar Hijri date",
  },
  fa: {
    months: ["حمل", "ثور", "جوزا", "سرطان", "اسد", "سنبله", "میزان", "عقرب", "قوس", "جدی", "دلو", "حوت"],
    weekdays: ["ش", "ی", "د", "س", "چ", "پ", "ج"],
    previousMonth: "ماه قبل",
    nextMonth: "ماه بعد",
    clear: "پاک کردن",
    today: "امروز",
    placeholder: "انتخاب تاریخ شمسی",
  },
  ps: {
    months: ["وری", "غویی", "غبرګولی", "چنګاښ", "زمری", "وږی", "تله", "لړم", "ليندۍ", "مرغومی", "سلواغه", "کب"],
    weekdays: ["ش", "ی", "د", "س", "چ", "پ", "ج"],
    previousMonth: "مخکینی میاشت",
    nextMonth: "راتلونکی میاشت",
    clear: "پاکول",
    today: "نن",
    placeholder: "شمسي نېټه وټاکئ",
  },
};

function buildChangeEvent(name, value) {
  return {
    target: { name, value },
    currentTarget: { name, value },
  };
}

const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

export default function ShamsiDateInput({
  value = "",
  onChange,
  name,
  id,
  required,
  disabled,
  placeholder,
  className = "",
}) {
  const wrapperRef = useRef(null);
  const triggerRef = useRef(null);
  const popoverRef = useRef(null);
  const [language, setLanguage] = useState(() => localStorage.getItem(languageKey) || "en");
  const selectedDate = useMemo(() => gregorianToAfghan(value), [value]);
  const today = useMemo(() => getAfghanToday(), []);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => selectedDate || today || { jy: 1405, jm: 1, jd: 1 });
  const [popoverStyle, setPopoverStyle] = useState({});

  const text = calendarText[language] || calendarText.en;
  const effectivePlaceholder = placeholder || text.placeholder;

  useEffect(() => {
    const syncLanguage = () => setLanguage(localStorage.getItem(languageKey) || "en");
    window.addEventListener("app-language-updated", syncLanguage);
    window.addEventListener("storage", syncLanguage);
    return () => {
      window.removeEventListener("app-language-updated", syncLanguage);
      window.removeEventListener("storage", syncLanguage);
    };
  }, []);

  useEffect(() => {
    if (selectedDate) setView((current) => ({ ...current, jy: selectedDate.jy, jm: selectedDate.jm }));
  }, [selectedDate]);

  const positionPopover = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const margin = 8;
    const width = Math.min(300, viewportWidth - margin * 2);
    const estimatedHeight = Math.min(390, viewportHeight - margin * 2);
    const isRtl = language === "fa" || language === "ps";

    let left = isRtl ? rect.right - width : rect.left;
    left = clamp(left, margin, Math.max(margin, viewportWidth - width - margin));

    const roomBelow = viewportHeight - rect.bottom - margin;
    const roomAbove = rect.top - margin;
    const placeAbove = roomBelow < 330 && roomAbove > roomBelow;
    const maxHeight = Math.max(230, Math.min(390, placeAbove ? roomAbove - 8 : roomBelow - 8));
    const top = placeAbove
      ? Math.max(margin, rect.top - Math.min(estimatedHeight, maxHeight) - 8)
      : Math.min(viewportHeight - margin - Math.min(estimatedHeight, maxHeight), rect.bottom + 8);

    setPopoverStyle({ left, top, width, maxHeight });
  }, [language]);

  useEffect(() => {
    if (!open) return undefined;
    positionPopover();
    const handleViewportChange = () => positionPopover();
    const closeOnOutside = (event) => {
      if (wrapperRef.current?.contains(event.target) || popoverRef.current?.contains(event.target)) return;
      setOpen(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    return () => {
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, positionPopover]);

  const days = getAfghanMonthDays(view.jy, view.jm);
  const selectedLabel = value ? formatAfghanDate(value) : "";

  const commitDate = (day) => {
    const nextValue = afghanToGregorian(view.jy, view.jm, day);
    onChange?.(buildChangeEvent(name, nextValue));
    setOpen(false);
  };

  const changeMonth = (step) => {
    setView((current) => {
      let jm = current.jm + step;
      let jy = current.jy;
      if (jm < 1) {
        jm = 12;
        jy -= 1;
      }
      if (jm > 12) {
        jm = 1;
        jy += 1;
      }
      return { ...current, jy, jm };
    });
  };

  const clearDate = () => {
    onChange?.(buildChangeEvent(name, ""));
    setOpen(false);
  };

  const popover = open && typeof document !== "undefined" ? createPortal(
    <div
      ref={popoverRef}
      className="shamsi-date-popover shamsi-date-popover-portal"
      role="dialog"
      aria-label={effectivePlaceholder}
      dir={language === "en" ? "ltr" : "rtl"}
      style={popoverStyle}
    >
      <div className="shamsi-date-head">
        <button type="button" onClick={() => changeMonth(-1)} aria-label={text.previousMonth}><ChevronRight size={17} /></button>
        <div>
          <strong>{text.months[view.jm - 1]}</strong>
          <select value={view.jy} onChange={(event) => setView((current) => ({ ...current, jy: Number(event.target.value) }))}>
            {Array.from({ length: 21 }, (_, index) => view.jy - 10 + index).map((year) => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <button type="button" onClick={() => changeMonth(1)} aria-label={text.nextMonth}><ChevronLeft size={17} /></button>
      </div>
      <div className="shamsi-date-week">
        {text.weekdays.map((day) => <span key={day}>{day}</span>)}
      </div>
      <div className="shamsi-date-grid">
        {Array.from({ length: days }, (_, index) => index + 1).map((day) => {
          const active = selectedDate?.jy === view.jy && selectedDate?.jm === view.jm && selectedDate?.jd === day;
          const isToday = today?.jy === view.jy && today?.jm === view.jm && today?.jd === day;
          return (
            <button
              type="button"
              key={day}
              className={`${active ? "active" : ""} ${isToday ? "today" : ""}`}
              onClick={() => commitDate(day)}
            >
              {day}
            </button>
          );
        })}
      </div>
      <div className="shamsi-date-footer">
        <button type="button" onClick={clearDate}>{text.clear}</button>
        {today && <span>{text.today}: {today.jy}/{today.jm}/{today.jd}</span>}
      </div>
    </div>,
    document.body
  ) : null;

  return (
    <div className={`shamsi-date-input ${className}`} ref={wrapperRef}>
      <button
        ref={triggerRef}
        id={id}
        type="button"
        className="shamsi-date-trigger"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
      >
        <span>{selectedLabel || effectivePlaceholder}</span>
        <CalendarDays size={16} />
      </button>
      {popover}
    </div>
  );
}

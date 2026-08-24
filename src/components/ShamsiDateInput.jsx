import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import {
  AFGHAN_MONTHS,
  afghanToGregorian,
  formatAfghanDate,
  getAfghanMonthDays,
  getAfghanToday,
  gregorianToAfghan,
} from "../utils/afghanDate";
import "./ShamsiDateInput.css";

const weekDays = ["ش", "ی", "د", "س", "چ", "پ", "ج"];

function buildChangeEvent(name, value) {
  return {
    target: { name, value },
    currentTarget: { name, value },
  };
}

export default function ShamsiDateInput({
  value = "",
  onChange,
  name,
  id,
  required,
  disabled,
  placeholder = "انتخاب تاریخ شمسی",
  className = "",
}) {
  const wrapperRef = useRef(null);
  const selectedDate = useMemo(() => gregorianToAfghan(value), [value]);
  const today = useMemo(() => getAfghanToday(), []);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => selectedDate || today || { jy: 1405, jm: 1, jd: 1 });

  useEffect(() => {
    if (selectedDate) setView((current) => ({ ...current, jy: selectedDate.jy, jm: selectedDate.jm }));
  }, [selectedDate]);

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutside = (event) => {
      if (!wrapperRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [open]);

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

  return (
    <div className={`shamsi-date-input ${className}`} ref={wrapperRef}>
      <button
        id={id}
        type="button"
        className="shamsi-date-trigger"
        onClick={() => !disabled && setOpen((current) => !current)}
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-required={required}
      >
        <span>{selectedLabel || placeholder}</span>
        <CalendarDays size={16} />
      </button>
      {open && (
        <div className="shamsi-date-popover" role="dialog" aria-label={placeholder}>
          <div className="shamsi-date-head">
            <button type="button" onClick={() => changeMonth(-1)} aria-label="ماه قبل"><ChevronRight size={17} /></button>
            <div>
              <strong>{AFGHAN_MONTHS[view.jm - 1]}</strong>
              <select value={view.jy} onChange={(event) => setView((current) => ({ ...current, jy: Number(event.target.value) }))}>
                {Array.from({ length: 21 }, (_, index) => view.jy - 10 + index).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button type="button" onClick={() => changeMonth(1)} aria-label="ماه بعد"><ChevronLeft size={17} /></button>
          </div>
          <div className="shamsi-date-week">
            {weekDays.map((day) => <span key={day}>{day}</span>)}
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
            <button type="button" onClick={clearDate}>Clear</button>
            {today && <span>امروز: {today.jy}/{today.jm}/{today.jd}</span>}
          </div>
        </div>
      )}
    </div>
  );
}

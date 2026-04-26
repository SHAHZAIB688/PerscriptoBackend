import React, { useState, useRef, useEffect } from "react";
import { ChevronDownIcon } from "../icons";

const Dropdown = ({ options, value, onChange, placeholder = "Select option", className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption = options.find(opt => (opt.value || opt) === value);
  const displayLabel = selectedOption ? (selectedOption.label || selectedOption) : placeholder;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between border-b border-slate-200 py-3 text-sm font-medium text-slate-700 outline-none transition-all focus:border-brand-600"
      >
        <span className={!selectedOption ? "text-slate-400" : ""}>{displayLabel}</span>
        <ChevronDownIcon className={`h-4 w-4 text-slate-400 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-[1.5rem] border border-slate-100 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 slide-in-from-top-2 duration-200">
          <div className="max-h-60 overflow-y-auto custom-scrollbar">
            {options.map((option, idx) => {
              const optValue = option.value || option;
              const optLabel = option.label || option;
              const isSelected = optValue === value;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    onChange(optValue);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center rounded-xl px-4 py-3 text-left text-sm font-bold transition-all ${isSelected
                      ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200"
                      : "text-slate-600 hover:bg-slate-50 hover:text-brand-600"
                    }`}
                >
                  {optLabel}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dropdown;

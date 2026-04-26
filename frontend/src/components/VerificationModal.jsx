import React from "react";
import { HourglassIcon } from "../icons";

const VerificationModal = ({ isOpen, onAction }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-md animate-in zoom-in-95 fade-in duration-300 rounded-[2.5rem] bg-white p-10 text-center shadow-2xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-amber-50 text-amber-600 shadow-inner">
           <HourglassIcon className="h-10 w-10 animate-pulse" />
        </div>
        <h3 className="text-2xl font-bold text-slate-900">Account Under Verification</h3>
        <p className="mt-4 text-slate-600 leading-relaxed">
          Thank you for joining Prescripto! Your professional credentials have been submitted for review. 
          <br /><br />
          Please wait for admin approval (usually 24-48 hours) before you can access your doctor dashboard.
        </p>
        <div className="mt-8">
          <button 
            onClick={onAction}
            className="w-full rounded-2xl bg-brand-600 py-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-700 active:scale-[0.98]"
          >
            Go to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerificationModal;

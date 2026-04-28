import { useState } from "react";
import toast from "react-hot-toast";
import client from "../api/client";

const PrescriptionForm = ({ appointment, onClose, onSubmitSuccess }) => {
  const [form, setForm] = useState({
    patientName: appointment?.patient?.name || "",
    age: "",
    gender: "",
    date: new Date().toISOString().split("T")[0],
    consultationType: "Video Call",
    symptoms: "",
    diagnosis: "",
    labTests: "",
    advice: "",
    followUpDate: ""
  });

  const [medicines, setMedicines] = useState([
    { id: Date.now(), name: "", dosage: "", frequency: "Once daily", time: [], duration: "" }
  ]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addMedicine = () => {
    setMedicines([...medicines, { id: Date.now(), name: "", dosage: "", frequency: "Once daily", time: [], duration: "" }]);
  };

  const removeMedicine = (id) => {
    setMedicines(medicines.filter(m => m.id !== id));
  };

  const updateMedicine = (id, field, value) => {
    setMedicines(medicines.map(m => m.id === id ? { ...m, [field]: value } : m));
  };

  const toggleTime = (id, timeOfDay) => {
    setMedicines(medicines.map(m => {
      if (m.id === id) {
        const times = m.time.includes(timeOfDay) 
          ? m.time.filter(t => t !== timeOfDay)
          : [...m.time, timeOfDay];
        return { ...m, time: times };
      }
      return m;
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.patientName || !form.diagnosis) {
      toast.error("Patient name and diagnosis are required");
      return;
    }

    if (medicines.some(m => !m.name || !m.dosage)) {
      toast.error("Please complete all medicine details");
      return;
    }

    const prescriptionData = {
      ...form,
      medicines,
      appointmentId: appointment?._id,
    };

    try {
      const { data } = await client.post("/prescriptions", prescriptionData);
      toast.success("Prescription generated and sent to patient successfully!");
      if (onSubmitSuccess) {
        onSubmitSuccess(data);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save prescription");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl my-8">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur px-6 py-4 rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Digital Prescription</h2>
            <p className="text-sm text-slate-500">Create a new prescription for {form.patientName || "Patient"}</p>
          </div>
          <button 
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
          <form id="prescription-form" onSubmit={handleSubmit} className="space-y-8">
            
            {/* 1. Patient Information Section */}
            <section className="rounded-xl border border-blue-100 bg-blue-50/30 p-5">
              <div className="mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">Patient Information</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Patient Name <span className="text-rose-500">*</span></label>
                  <input required name="patientName" value={form.patientName} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="John Doe" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Age</label>
                    <input type="number" name="age" value={form.age} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="Years" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Gender</label>
                    <select name="gender" value={form.gender} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white">
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Date</label>
                    <input type="date" name="date" value={form.date} onChange={handleFormChange} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-slate-50" readOnly />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-slate-600">Type</label>
                    <input name="consultationType" value={form.consultationType} readOnly className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 bg-slate-50 outline-none" />
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Symptoms & Diagnosis */}
            <section className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
               <div className="mb-4 flex items-center gap-2">
                <svg className="h-5 w-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <h3 className="text-lg font-bold text-slate-800">Clinical Assessment</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Presenting Symptoms</label>
                  <textarea name="symptoms" value={form.symptoms} onChange={handleFormChange} rows="3" className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none" placeholder="E.g., Fever for 3 days, dry cough..." />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Final Diagnosis <span className="text-rose-500">*</span></label>
                  <textarea required name="diagnosis" value={form.diagnosis} onChange={handleFormChange} rows="3" className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none font-medium text-slate-800" placeholder="E.g., Viral Pharyngitis" />
                </div>
              </div>
            </section>

            {/* 3. Medicines Section */}
            <section className="rounded-xl border border-emerald-100 bg-emerald-50/20 p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="rounded bg-emerald-100 p-1">
                    <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.5 20.5l-6-6a4.5 4.5 0 0 1 6.5-6.5l6 6a4.5 4.5 0 0 1-6.5 6.5z"></path>
                      <line x1="8.5" y1="8.5" x2="15.5" y2="15.5"></line>
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Rx Medicines</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                {medicines.map((med, index) => (
                  <div key={med.id} className="group relative rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:border-emerald-300">
                    <div className="absolute -left-3 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-500 border border-slate-200 group-hover:bg-emerald-100 group-hover:text-emerald-700 group-hover:border-emerald-200 transition-colors">
                      {index + 1}
                    </div>
                    
                    <div className="ml-2 grid grid-cols-1 md:grid-cols-12 gap-4">
                      <div className="md:col-span-3">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Medicine Name <span className="text-rose-500">*</span></label>
                        <input required value={med.name} onChange={(e) => updateMedicine(med.id, "name", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. Paracetamol" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Dosage <span className="text-rose-500">*</span></label>
                        <input required value={med.dosage} onChange={(e) => updateMedicine(med.id, "dosage", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="e.g. 500mg" />
                      </div>
                      
                      <div className="md:col-span-2">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Frequency</label>
                        <select value={med.frequency} onChange={(e) => updateMedicine(med.id, "frequency", e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 bg-white">
                          <option>Once daily</option>
                          <option>Twice daily</option>
                          <option>Thrice daily</option>
                          <option>As needed (SOS)</option>
                        </select>
                      </div>
                      
                      <div className="md:col-span-3">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Time</label>
                        <div className="flex items-center gap-2 h-[38px]">
                          {['Morning', 'Afternoon', 'Night'].map(t => (
                            <label key={t} className={`flex cursor-pointer items-center justify-center rounded-lg border px-2 py-1 text-xs font-medium transition-colors ${med.time.includes(t) ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'}`}>
                              <input type="checkbox" className="sr-only" checked={med.time.includes(t)} onChange={() => toggleTime(med.id, t)} />
                              {t === 'Morning' ? 'Morn' : t === 'Afternoon' ? 'Aft' : 'Night'}
                            </label>
                          ))}
                        </div>
                      </div>

                      <div className="md:col-span-1">
                        <label className="mb-1 block text-xs font-semibold text-slate-500">Duration</label>
                        <input value={med.duration} onChange={(e) => updateMedicine(med.id, "duration", e.target.value)} className="w-full rounded-lg border border-slate-200 px-2 py-2 text-sm outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500" placeholder="5 days" />
                      </div>

                      <div className="md:col-span-1 flex items-end justify-end">
                        {medicines.length > 1 && (
                          <button type="button" onClick={() => removeMedicine(med.id)} className="mb-[2px] rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Remove Medicine">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button type="button" onClick={addMedicine} className="mt-4 flex items-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 px-4 py-3 text-sm font-bold text-emerald-700 hover:bg-emerald-100 hover:border-emerald-400 transition-colors w-full justify-center">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Add Another Medicine
              </button>
            </section>

            {/* 4. Additional Features */}
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
                  <svg className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Lab Tests & Investigations
                </h3>
                <textarea name="labTests" value={form.labTests} onChange={handleFormChange} rows="2" className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none" placeholder="E.g., CBC, LFTs..." />
              </div>

              <div className="rounded-xl border border-slate-100 bg-white p-5 shadow-sm">
                 <h3 className="mb-4 text-sm font-bold text-slate-800 flex items-center gap-2">
                  <svg className="h-4 w-4 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  Advice & Follow-up
                </h3>
                <textarea name="advice" value={form.advice} onChange={handleFormChange} rows="2" className="mb-3 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 resize-none" placeholder="General advice, diet instructions..." />
                
                <div className="flex items-center gap-3">
                  <label className="text-xs font-semibold text-slate-600 whitespace-nowrap">Follow-up Date:</label>
                  <input type="date" name="followUpDate" value={form.followUpDate} onChange={handleFormChange} className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" />
                </div>
              </div>
            </section>
          </form>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 border-t border-slate-100 bg-white/90 backdrop-blur px-6 py-4 rounded-b-2xl">
          <button type="button" onClick={onClose} className="rounded-xl px-6 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 transition-colors">
            Cancel
          </button>
          <button 
            type="submit" 
            form="prescription-form"
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 px-8 py-2.5 text-sm font-bold text-white shadow-lg shadow-brand-200 hover:from-brand-700 hover:to-indigo-700 transition-all transform hover:-translate-y-0.5"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            Generate & Send Prescription
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionForm;

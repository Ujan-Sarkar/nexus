import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { GLASS_CARD } from '../../lib/utils';
import { Users, Search, ChevronRight, History, FlaskConical, Pill, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PatientArchive() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [history, setHistory] = useState<any>({ appointments: [], tests: [] });
  const { token } = useAuth();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const res = await fetch('/api/patients', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPatients(data);
  };

  const fetchHistory = async (id: string) => {
    const res = await fetch(`/api/patient/${id}/history`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setHistory(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Patient Archive</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            placeholder="Search archive..." 
            className="bg-white border border-slate-200 rounded-xl py-2 pl-10 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all shadow-sm" 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 space-y-4">
          {patients.map((p) => (
            <motion.div
              key={p.patient_id}
              onClick={() => { setSelectedPatient(p); fetchHistory(p.patient_id); }}
              className={cn(
                GLASS_CARD,
                "cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] bg-white",
                selectedPatient?.patient_id === p.patient_id ? "ring-2 ring-blue-600 bg-blue-50/50" : ""
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-blue-600">
                    {p.name[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{p.name}</h3>
                    <p className="text-xs text-slate-500">{p.age} yrs • {p.gender}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-300" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Details */}
        <div className="lg:col-span-2">
          {selectedPatient ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className={`${GLASS_CARD} bg-white`}>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-xl">
                    {selectedPatient.name[0]}
                  </div>
                  <div>
                    <h2 className="text-3xl font-bold text-slate-900">{selectedPatient.name}</h2>
                    <p className="text-slate-500 font-medium">Patient ID: {selectedPatient.patient_id}</p>
                    <div className="flex gap-4 mt-2">
                      <span className="text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-600">Age: {selectedPatient.age}</span>
                      <span className="text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-600">Gender: {selectedPatient.gender}</span>
                      <span className="text-xs bg-slate-50 px-2 py-1 rounded border border-slate-100 text-slate-600">Contact: {selectedPatient.contact}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Medical History</h4>
                  <p className="text-slate-600 leading-relaxed">{selectedPatient.history || 'No significant medical history recorded.'}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Consultations */}
                <div className={`${GLASS_CARD} bg-white`}>
                  <div className="flex items-center gap-2 mb-6">
                    <History className="w-5 h-5 text-blue-600" />
                    <h3 className="font-bold text-slate-900">Consultation History</h3>
                  </div>
                  <div className="space-y-4">
                    {history.appointments.map((apt: any) => (
                      <div key={apt.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-xs font-bold text-blue-600">{new Date(apt.date).toLocaleDateString()}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Dr. {apt.doctor_name}</p>
                        </div>
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <Activity className="w-3 h-3 text-slate-300 mt-1" />
                            <p className="text-sm text-slate-900"><span className="text-slate-500 font-medium">Diagnosis:</span> {apt.diagnosis}</p>
                          </div>
                          <div className="flex gap-2">
                            <Pill className="w-3 h-3 text-slate-300 mt-1" />
                            <p className="text-sm text-slate-900"><span className="text-slate-500 font-medium">Prescription:</span> {apt.prescription}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lab Reports */}
                <div className={`${GLASS_CARD} bg-white`}>
                  <div className="flex items-center gap-2 mb-6">
                    <FlaskConical className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-slate-900">Lab Reports</h3>
                  </div>
                  <div className="space-y-4">
                    {history.tests.map((test: any) => (
                      <div key={test.id} className="p-4 bg-slate-50 border border-slate-100 rounded-xl">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-bold text-slate-900">{test.test_name}</p>
                          <span className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold ${
                            test.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                          }`}>
                            {test.status}
                          </span>
                        </div>
                        {test.result && (
                          <p className="text-xs text-slate-500 mt-2 italic">"{test.result}"</p>
                        )}
                        <p className="text-[10px] text-slate-400 mt-2">{new Date(test.date).toLocaleDateString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className={`${GLASS_CARD} h-full flex flex-col items-center justify-center text-center p-12 border-dashed bg-white`}>
              <Users className="w-16 h-16 text-slate-100 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">Select a patient to view full archive</h3>
              <p className="text-slate-500 mt-2 max-w-xs">Complete medical records, history, and lab reports will be displayed here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}

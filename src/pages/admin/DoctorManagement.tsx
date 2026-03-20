import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { GLASS_CARD } from '../../lib/utils';
import { User, Stethoscope, Calendar, Clock, ChevronRight, Search, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<any | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    const res = await fetch('/api/doctors', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setDoctors(data);
  };

  const fetchDoctorHistory = async (id: number) => {
    const res = await fetch(`/api/admin/doctor/${id}/history`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setSelectedDoctor(data.doctor);
    setHistory(data.consultations);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Medical Staff Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Doctor List */}
        <div className="lg:col-span-1 space-y-4">
          <div className={GLASS_CARD}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Doctors</h3>
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2">
              {doctors.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => fetchDoctorHistory(doc.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all border ${
                    selectedDoctor?.id === doc.id 
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                    selectedDoctor?.id === doc.id ? "bg-white/20" : "bg-blue-50 text-blue-600"
                  }`}>
                    {doc.name.split(' ')[1]?.[0] || 'D'}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm">{doc.name}</p>
                    <p className={`text-[10px] uppercase tracking-wider font-bold ${
                      selectedDoctor?.id === doc.id ? "text-blue-100" : "text-slate-400"
                    }`}>{doc.specialty}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Doctor Details & History */}
        <div className="lg:col-span-2">
          {selectedDoctor ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className={GLASS_CARD}>
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                    <Stethoscope className="text-white w-10 h-10" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedDoctor.name}</h2>
                    <p className="text-blue-600 font-bold uppercase tracking-widest text-xs mt-1">{selectedDoctor.specialty}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1 text-slate-500 text-sm">
                        <Activity className="w-4 h-4" />
                        <span>{history.length} Consultations</span>
                      </div>
                      <div className="flex items-center gap-1 text-slate-500 text-sm">
                        <User className="w-4 h-4" />
                        <span>Username: {selectedDoctor.username}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={GLASS_CARD}>
                <h3 className="text-lg font-bold text-slate-900 mb-6">Consultation History</h3>
                <div className="space-y-4">
                  {history.length === 0 ? (
                    <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No consultation history found.</p>
                    </div>
                  ) : (
                    history.map((consult) => (
                      <div key={consult.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl hover:border-blue-200 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-slate-100 shadow-sm">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{consult.patient_name}</p>
                              <p className="text-xs text-slate-500">{consult.age}y • {consult.gender}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-xs text-slate-500 font-bold uppercase tracking-wider">
                              <Calendar className="w-3 h-3" />
                              {new Date(consult.date).toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-blue-600 font-bold uppercase tracking-wider mt-1">
                              <Clock className="w-3 h-3" />
                              {new Date(consult.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Diagnosis</p>
                            <p className="text-sm text-slate-700 italic">"{consult.diagnosis}"</p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-1">Prescription</p>
                            <p className="text-sm text-slate-700 italic">"{consult.prescription}"</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <div className={`${GLASS_CARD} h-full flex flex-col items-center justify-center text-center p-12 border-dashed border-slate-200`}>
              <Stethoscope className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">Select a doctor to view detailed records</h3>
              <p className="text-slate-500 mt-2 max-w-xs">Consultation history and patient interactions will be displayed here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

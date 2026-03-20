import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { GLASS_CARD } from '../../lib/utils';
import { Calendar, Clock, User, ChevronRight, Stethoscope, ClipboardList, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DoctorDashboard() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<any | null>(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const { token } = useAuth();

  const labTests = ['Blood Count', 'Lipid Profile', 'X-Ray Chest', 'MRI Brain', 'Blood Sugar', 'Urine Analysis'];

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    const res = await fetch('/api/doctor/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await res.json();
    setAppointments(data);
  };

  const handleSubmitConsultation = async () => {
    if (!selectedAppointment) return;
    const res = await fetch('/api/doctor/consultation', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        appointment_id: selectedAppointment.id,
        diagnosis,
        prescription,
        lab_tests: selectedTests
      })
    });
    if (res.ok) {
      setSelectedAppointment(null);
      setDiagnosis('');
      setPrescription('');
      setSelectedTests([]);
      fetchAppointments();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Today's Schedule</h1>
        <div className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl border border-blue-100 text-sm font-medium">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Appointments List */}
        <div className="lg:col-span-1 space-y-4">
          <AnimatePresence>
            {appointments.length === 0 ? (
              <div className={`${GLASS_CARD} text-center py-12 bg-white`}>
                <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-400">No pending appointments</p>
              </div>
            ) : (
              appointments.map((apt) => (
                <motion.div
                  key={apt.id}
                  layoutId={`apt-${apt.id}`}
                  onClick={() => setSelectedAppointment(apt)}
                  className={cn(
                    GLASS_CARD,
                    "cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98] bg-white",
                    selectedAppointment?.id === apt.id ? "ring-2 ring-blue-600 bg-blue-50/50" : ""
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{apt.patient_name}</h3>
                        <p className="text-xs text-slate-500">{apt.age} yrs • {apt.gender}</p>
                        {apt.query && (
                          <p className="text-[10px] text-blue-600 font-medium mt-1 line-clamp-1 italic">
                            "{apt.query}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-xs text-emerald-600 font-bold uppercase tracking-wider">
                        <Clock className="w-3 h-3" />
                        {new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        {/* Consultation Panel */}
        <div className="lg:col-span-2">
          {selectedAppointment ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${GLASS_CARD} bg-white`}
            >
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                <div className="w-14 h-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                  <Stethoscope className="text-white w-8 h-8" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Consultation</h2>
                  <p className="text-slate-500">Patient: {selectedAppointment.patient_name}</p>
                  {selectedAppointment.query && (
                    <p className="text-xs text-blue-600 font-medium mt-1 bg-blue-50 px-2 py-1 rounded-lg inline-block">
                      Reason: {selectedAppointment.query}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-blue-600" />
                    Diagnosis & Clinical Notes
                  </label>
                  <textarea
                    value={diagnosis}
                    onChange={(e) => setDiagnosis(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 min-h-[120px] focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="Enter clinical findings..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Prescribe Medicines</label>
                  <textarea
                    value={prescription}
                    onChange={(e) => setPrescription(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 min-h-[100px] focus:ring-2 focus:ring-blue-600 outline-none transition-all"
                    placeholder="Dosage, frequency, duration..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Assign Lab Tests</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {labTests.map((test) => (
                      <button
                        key={test}
                        onClick={() => {
                          setSelectedTests(prev => 
                            prev.includes(test) ? prev.filter(t => t !== test) : [...prev, test]
                          );
                        }}
                        className={cn(
                          "px-4 py-2 rounded-xl text-sm font-medium border transition-all",
                          selectedTests.includes(test)
                            ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                        )}
                      >
                        {test}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleSubmitConsultation}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]"
                  >
                    <Send className="w-5 h-5" />
                    Complete Consultation & Update Records
                  </button>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className={`${GLASS_CARD} h-full flex flex-col items-center justify-center text-center p-12 border-dashed bg-white`}>
              <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mb-6">
                <ChevronRight className="w-10 h-10 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-400">Select an appointment to start consultation</h3>
              <p className="text-slate-500 mt-2 max-w-xs">Patient details and clinical history will be loaded here.</p>
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

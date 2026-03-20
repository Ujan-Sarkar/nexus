import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { GLASS_CARD } from '../../lib/utils';
import { Users, UserPlus, Calendar, Activity, TrendingUp, Search, Filter, ArrowLeft, Clock, MapPin, Phone, User as UserIcon, CheckCircle2, AlertCircle, Plus, Stethoscope } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({ patients: 0, doctors: 0, appointments: 0 });
  const [patients, setPatients] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [patientHistory, setPatientHistory] = useState<any>({ appointments: [], tests: [], labResults: [] });
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const { token } = useAuth();

  // Form state for registration
  const [formData, setFormData] = useState({ patient_id: '', name: '', age: '', gender: 'Male', contact: '', history: '' });
  
  // Form state for appointment
  const [appointmentData, setAppointmentData] = useState({ doctor_id: '', date: '', time: '', query: '' });
  
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
    fetchPatients();
    fetchDoctors();
  }, []);

  const fetchStats = async () => {
    const res = await fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setStats(data);
  };

  const fetchPatients = async () => {
    const res = await fetch('/api/patients', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPatients(data);
  };

  const fetchDoctors = async () => {
    const res = await fetch('/api/doctors', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setDoctors(data);
  };

  const fetchPatientHistory = async (patientId: string) => {
    const res = await fetch(`/api/patient/${patientId}/history`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPatientHistory(data);
  };

  const handlePatientClick = async (patient: any) => {
    setSelectedPatient(patient);
    await fetchPatientHistory(patient.patient_id);
  };

  const closeRegister = () => {
    setShowRegister(false);
    setError(null);
    setFormData({ patient_id: '', name: '', age: '', gender: 'Male', contact: '', history: '' });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const res = await fetch('/api/admin/register-patient', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });
    const data = await res.json();
    if (res.ok) {
      closeRegister();
      fetchPatients();
      fetchStats();
    } else {
      setError(data.error || "Failed to register patient");
    }
  };

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient) return;
    
    const dateTime = `${appointmentData.date}T${appointmentData.time}`;
    
    const res = await fetch('/api/admin/appointment', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        patient_id: selectedPatient.patient_id,
        doctor_id: parseInt(appointmentData.doctor_id),
        date: dateTime,
        query: appointmentData.query
      })
    });
    
    if (res.ok) {
      setShowAppointmentModal(false);
      setAppointmentData({ doctor_id: '', date: '', time: '', query: '' });
      fetchPatientHistory(selectedPatient.patient_id);
      fetchStats();
    } else {
      const data = await res.json();
      setError(data.error || "Failed to create appointment");
    }
  };

  if (selectedPatient) {
    return (
      <div className="space-y-6">
        <button 
          onClick={() => setSelectedPatient(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Patient Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className={`${GLASS_CARD} bg-white relative overflow-hidden`}>
              <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />
              <div className="flex flex-col items-center text-center pt-4">
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-4">
                  <UserIcon className="w-10 h-10 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedPatient.name}</h2>
                <p className="text-slate-500 font-mono text-sm">{selectedPatient.patient_id}</p>
                
                <div className="grid grid-cols-2 gap-4 w-full mt-8">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Age</p>
                    <p className="text-slate-900 font-bold">{selectedPatient.age} Years</p>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Gender</p>
                    <p className="text-slate-900 font-bold">{selectedPatient.gender}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-slate-600">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <span className="text-sm">{selectedPatient.contact}</span>
                </div>
                <div className="flex items-start gap-3 text-slate-600">
                  <Activity className="w-4 h-4 text-slate-400 mt-1" />
                  <div className="text-sm">
                    <p className="font-bold text-slate-900 mb-1">Medical History</p>
                    <p className="leading-relaxed">{selectedPatient.history || 'No history recorded'}</p>
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowAppointmentModal(true)}
                className="w-full mt-8 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                New Appointment
              </button>
            </div>
          </div>

          {/* History Tabs */}
          <div className="lg:col-span-2 space-y-6">
            <div className={`${GLASS_CARD} bg-white`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900">Consultation History</h3>
                <span className="px-2.5 py-1 bg-blue-50 text-blue-600 text-[10px] font-bold rounded-md border border-blue-100 uppercase">
                  {patientHistory.appointments.length} Total
                </span>
              </div>

              <div className="space-y-4">
                {patientHistory.appointments.length === 0 ? (
                  <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-2xl">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-slate-400 font-medium">No previous consultations found</p>
                  </div>
                ) : (
                  patientHistory.appointments.map((apt: any) => (
                    <div key={apt.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-white hover:border-blue-200 transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors">
                            <Stethoscope className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{apt.doctor_name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(apt.date).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase border ${
                          apt.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                            : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                      {apt.diagnosis && (
                        <div className="mt-3 pt-3 border-t border-slate-100">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Diagnosis</p>
                          <p className="text-sm text-slate-700">{apt.diagnosis}</p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Lab Tests History */}
            <div className={`${GLASS_CARD} bg-white`}>
              <h3 className="text-lg font-bold text-slate-900 mb-6">Lab Test History</h3>
              <div className="space-y-3">
                {patientHistory.tests.length === 0 ? (
                  <p className="text-center py-8 text-slate-400 text-sm italic">No lab tests recorded</p>
                ) : (
                  patientHistory.tests.map((test: any) => (
                    <div key={test.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center border border-slate-100">
                          <Activity className="w-4 h-4 text-indigo-600" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">{test.test_name}</p>
                          <p className="text-[10px] text-slate-500">{new Date(test.timestamp).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">TNS: {test.tns_score?.toFixed(2) || 'N/A'}</p>
                        <span className="text-[10px] text-emerald-600 font-bold uppercase">{test.status}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Appointment Modal */}
        {showAppointmentModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${GLASS_CARD} w-full max-w-md bg-white shadow-2xl`}
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Schedule Appointment</h2>
              
              <form onSubmit={handleCreateAppointment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Doctor</label>
                  <select 
                    required
                    value={appointmentData.doctor_id}
                    onChange={e => setAppointmentData({...appointmentData, doctor_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none"
                  >
                    <option value="">Choose a doctor...</option>
                    {doctors.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.name} ({doc.specialty})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                    <input 
                      required
                      type="date"
                      value={appointmentData.date}
                      onChange={e => setAppointmentData({...appointmentData, date: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Time</label>
                    <input 
                      required
                      type="time"
                      value={appointmentData.time}
                      onChange={e => setAppointmentData({...appointmentData, time: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Reason for Visit (Query)</label>
                  <textarea 
                    required
                    value={appointmentData.query}
                    onChange={e => setAppointmentData({...appointmentData, query: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 min-h-[80px] transition-all"
                    placeholder="e.g. Regular checkup, chest pain, etc."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAppointmentModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                  >
                    Schedule
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">System Overview</h1>
        <button 
          onClick={() => { setError(null); setShowRegister(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
        >
          <UserPlus className="w-5 h-5" />
          Register Patient
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Patients', value: stats.patients, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Active Doctors', value: stats.doctors, icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Today Appointments', value: stats.appointments, icon: Calendar, color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Revenue Growth', value: '+12.5%', icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className={`${GLASS_CARD} bg-white`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live</span>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{stat.value}</h3>
            <p className="text-slate-500 text-sm font-medium mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Patients */}
        <div className="lg:col-span-2 space-y-4">
          <div className={`${GLASS_CARD} !p-0 overflow-hidden bg-white`}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Recent Registrations</h3>
              <div className="flex gap-2">
                <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><Search className="w-4 h-4" /></button>
                <button className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 transition-colors"><Filter className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider bg-slate-50/50">
                    <th className="px-6 py-4 font-bold">ID</th>
                    <th className="px-6 py-4 font-bold">Patient Name</th>
                    <th className="px-6 py-4 font-bold">Age/Gender</th>
                    <th className="px-6 py-4 font-bold">Contact</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((p) => (
                    <tr 
                      key={p.patient_id} 
                      className="hover:bg-slate-50/50 transition-colors cursor-pointer"
                      onClick={() => handlePatientClick(p)}
                    >
                      <td className="px-6 py-4 font-mono text-xs text-blue-600 font-bold">{p.patient_id}</td>
                      <td className="px-6 py-4 font-medium text-slate-900">{p.name}</td>
                      <td className="px-6 py-4 text-slate-500">{p.age}y / {p.gender}</td>
                      <td className="px-6 py-4 text-slate-500">{p.contact}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100 uppercase">Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Doctor List */}
        <div className="space-y-4">
          <div className={`${GLASS_CARD} bg-white`}>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Medical Staff</h3>
            <div className="space-y-4">
              {doctors.map((doc) => (
                <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:border-slate-200">
                  <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white shadow-sm">
                    {doc.name.split(' ')[1]?.[0] || 'D'}
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-sm">{doc.name}</p>
                    <p className="text-xs text-slate-500">{doc.specialty}</p>
                  </div>
                  <div className="ml-auto w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Register Modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${GLASS_CARD} w-full max-w-lg bg-white shadow-2xl`}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Patient Registration</h2>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                <Activity className="w-4 h-4" />
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Patient ID (e.g. P001)</label>
                  <input 
                    required
                    value={formData.patient_id}
                    onChange={e => setFormData({...formData, patient_id: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all font-mono"
                    placeholder="P001"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
                  <input 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    placeholder="e.g. John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                  <input 
                    required
                    type="number"
                    value={formData.age}
                    onChange={e => setFormData({...formData, age: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    placeholder="Age"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
                  <select 
                    value={formData.gender}
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none"
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Contact Number</label>
                  <input 
                    required
                    value={formData.contact}
                    onChange={e => setFormData({...formData, contact: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medical History</label>
                  <textarea 
                    value={formData.history}
                    onChange={e => setFormData({...formData, history: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 min-h-[80px] transition-all"
                    placeholder="Allergies, chronic conditions, etc."
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={closeRegister}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all active:scale-[0.98]"
                >
                  Register
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

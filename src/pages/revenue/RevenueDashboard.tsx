import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { GLASS_CARD } from '../../lib/utils';
import { Wallet, CreditCard, History, Search, User, DollarSign, Hash } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RevenueDashboard() {
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const { token } = useAuth();

  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    const res = await fetch('/api/patients', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPatients(data);
  };

  const fetchPayments = async (patientId: string) => {
    const res = await fetch(`/api/patient/${patientId}/payments`, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPayments(data);
  };

  const handleCreateBill = async () => {
    if (!selectedPatient) return;
    const res = await fetch('/api/revenue/bill', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ patient_id: selectedPatient.patient_id, amount: parseFloat(amount), reason })
    });
    if (res.ok) {
      setAmount('');
      setReason('');
      fetchPayments(selectedPatient.patient_id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Revenue & Billing</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-bold">
            <DollarSign className="w-4 h-4" />
            Total Collected: $45,280
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Patient List */}
        <div className="lg:col-span-1 space-y-4">
          <div className={GLASS_CARD}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Patients</h3>
              <Search className="w-4 h-4 text-slate-400" />
            </div>
            <div className="space-y-2">
              {patients.map((p) => (
                <button
                  key={p.patient_id}
                  onClick={() => { setSelectedPatient(p); fetchPayments(p.patient_id); }}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-xl transition-all border",
                    selectedPatient?.patient_id === p.patient_id 
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20" 
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center font-bold",
                    selectedPatient?.patient_id === p.patient_id ? "bg-white/20" : "bg-slate-200 text-slate-600"
                  )}>
                    {p.name[0]}
                  </div>
                  <span className="font-medium text-sm">{p.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Billing & History */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPatient ? (
            <>
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={GLASS_CARD}
              >
                <div className="flex items-center gap-3 mb-6">
                  <CreditCard className="w-6 h-6 text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-900">Create New Bill</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-slate-600 mb-2 font-medium">Amount ($)</label>
                    <input 
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 mb-2 font-medium">Payment Reason</label>
                    <input 
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20"
                      placeholder="Consultation, Lab Test, etc."
                    />
                  </div>
                </div>
                <button 
                  onClick={handleCreateBill}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  Generate Bill & Process Payment
                </button>
              </motion.div>

              <div className={GLASS_CARD}>
                <div className="flex items-center gap-3 mb-6">
                  <History className="w-6 h-6 text-emerald-600" />
                  <h3 className="text-xl font-bold text-slate-900">Payment History</h3>
                </div>
                <div className="space-y-4">
                  {payments.length === 0 ? (
                    <p className="text-slate-500 text-center py-8">No payment records found for this patient.</p>
                  ) : (
                    payments.map((pay) => (
                      <div key={pay.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-emerald-700 font-bold text-lg">${pay.amount}</span>
                            <span className="text-slate-600 text-xs">• {pay.reason}</span>
                          </div>
                          <span className="text-slate-500 text-[10px] uppercase font-bold tracking-widest">
                            {new Date(pay.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200">
                          <Hash className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-mono text-slate-500 truncate">{pay.hash}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={`${GLASS_CARD} h-full flex flex-col items-center justify-center text-center p-12 border-dashed border-slate-200`}>
              <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-400">Select a patient to manage billing</h3>
              <p className="text-slate-500 mt-2 max-w-xs">You can create bills, view history, and verify cryptographic hashes here.</p>
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

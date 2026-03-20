import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { GLASS_CARD } from '../../lib/utils';
import { Wallet, DollarSign, History, Search, User, Hash, Calendar, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RevenueManagement() {
  const [payments, setPayments] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchRevenue();
  }, []);

  const fetchRevenue = async () => {
    const res = await fetch('/api/admin/revenue', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPayments(data);
  };

  const totalRevenue = payments.reduce((acc, p) => acc + p.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Revenue & Financials</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-bold">
            <DollarSign className="w-4 h-4" />
            Total Revenue: ${totalRevenue.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={GLASS_CARD}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Growth</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">+12.5%</p>
          <p className="text-xs text-slate-400 mt-1">vs last month</p>
        </div>
        <div className={GLASS_CARD}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-50 rounded-lg">
              <DollarSign className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Avg. Bill</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">${(totalRevenue / (payments.length || 1)).toFixed(2)}</p>
          <p className="text-xs text-slate-400 mt-1">per patient</p>
        </div>
        <div className={GLASS_CARD}>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-amber-50 rounded-lg">
              <History className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Transactions</h3>
          </div>
          <p className="text-3xl font-bold text-slate-900">{payments.length}</p>
          <p className="text-xs text-slate-400 mt-1">total processed</p>
        </div>
      </div>

      <div className={GLASS_CARD}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">Transaction History</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search payments..." className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider bg-slate-50">
                <th className="px-6 py-4 font-bold">Patient</th>
                <th className="px-6 py-4 font-bold">Amount</th>
                <th className="px-6 py-4 font-bold">Reason</th>
                <th className="px-6 py-4 font-bold">Date & Time</th>
                <th className="px-6 py-4 font-bold">Hash Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((pay) => (
                <tr key={pay.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center font-bold text-blue-600 text-xs">
                        {pay.patient_name[0]}
                      </div>
                      <span className="font-bold text-slate-900">{pay.patient_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-emerald-700 font-bold">${pay.amount}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600 text-sm">{pay.reason}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-900 text-sm">{new Date(pay.timestamp).toLocaleDateString()}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(pay.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-slate-200 w-fit">
                      <Hash className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-mono text-slate-500 truncate max-w-[150px]">{pay.hash}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

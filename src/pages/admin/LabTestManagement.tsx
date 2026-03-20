import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { GLASS_CARD } from '../../lib/utils';
import { FlaskConical, Beaker, Search, User, Stethoscope, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function LabTestManagement() {
  const [tests, setTests] = useState<any[]>([]);
  const { token } = useAuth();

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    const res = await fetch('/api/lab/tests', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTests(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Laboratory Test Management</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm font-bold">
            <Beaker className="w-4 h-4" />
            Total Tests: {tests.length}
          </div>
        </div>
      </div>

      <div className={GLASS_CARD}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-900">All Lab Tests</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input placeholder="Search tests..." className="bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-sm text-slate-900 outline-none focus:ring-2 focus:ring-blue-500/20" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-slate-500 text-xs uppercase tracking-wider bg-slate-50">
                <th className="px-6 py-4 font-bold">Test Name</th>
                <th className="px-6 py-4 font-bold">Patient</th>
                <th className="px-6 py-4 font-bold">Requested By</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 font-bold">Date & Time</th>
                <th className="px-6 py-4 font-bold">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tests.map((test) => (
                <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-50 rounded-lg">
                        <FlaskConical className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="font-bold text-slate-900">{test.test_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <User className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600 font-medium">{test.patient_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Stethoscope className="w-3 h-3 text-slate-400" />
                      <span className="text-slate-600">{test.doctor_name || 'Manual Request'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-[10px] font-bold rounded-md border uppercase ${
                      test.status === 'pending' 
                        ? 'bg-amber-50 text-amber-700 border-amber-200' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {test.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-slate-900 text-sm">{new Date(test.date).toLocaleDateString()}</span>
                      <span className="text-slate-400 text-[10px]">{new Date(test.date).toLocaleTimeString()}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {test.status === 'completed' ? (
                      <div className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium truncate max-w-[150px]">{test.result}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-medium italic">Awaiting results...</span>
                      </div>
                    )}
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

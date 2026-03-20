import React, { useState, useEffect } from 'react';
import { useAuth } from '../../store/AuthContext';
import { GLASS_CARD } from '../../lib/utils';
import { FlaskConical, CheckCircle, Clock, User, Beaker, Search, ShieldCheck, Activity, AlertTriangle, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnalysisResponse {
  summary: {
    patient: string;
    test: string;
    score: number;
    verdict: string;
  };
  clinical_evidence: { [key: string]: number };
  security_anchor: string;
  raw_manifest?: any;
}

export default function LabDashboard() {
  const [tests, setTests] = useState<any[]>([]);
  const [selectedTest, setSelectedTest] = useState<any | null>(null);
  const [result, setResult] = useState('');
  const [showManualTest, setShowManualTest] = useState(false);
  const [manualPatientId, setManualPatientId] = useState('');
  const [manualTestName, setManualTestName] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  
  // TNS Analysis States
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResponse | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  
  const [engineStatus, setEngineStatus] = useState<{ status: string; mode?: string; error?: string } | null>(null);
  
  const { token } = useAuth();

  useEffect(() => {
    fetchTests();
    fetchPatients();
    checkEngineHealth();
  }, []);

  const checkEngineHealth = async () => {
    try {
      const res = await fetch('/api/lab/engine-health', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setEngineStatus(data);
    } catch (err) {
      setEngineStatus({ status: 'offline' });
    }
  };

  const fetchTests = async () => {
    const res = await fetch('/api/lab/tests', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setTests(data);
  };

  const fetchPatients = async () => {
    const res = await fetch('/api/patients', { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    setPatients(data);
  };

  const fetchTnsAnalysis = async (patientId: string, testName: string) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);
    
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ patient_id: patientId, test_name: testName })
      });
      
      const data = await res.json();
      if (!res.ok) {
        const errorMsg = data.detail || data.error || (typeof data === 'string' ? data : JSON.stringify(data)) || 'Analysis failed';
        throw new Error(errorMsg);
      }
      
      setAnalysisResult(data);
    } catch (err: any) {
      setAnalysisError(err.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleManualTest = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/lab/manual-test', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ patient_id: manualPatientId, test_name: manualTestName })
    });
    if (res.ok) {
      setShowManualTest(false);
      setManualPatientId('');
      setManualTestName('');
      fetchTests();
    }
  };

  const handleUpdateResult = async () => {
    if (!selectedTest) return;
    const res = await fetch('/api/lab/update-test', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ 
        test_id: selectedTest.id, 
        result,
        tns_score: analysisResult?.summary.score,
        proof_hash: analysisResult?.security_anchor
      })
    });
    if (res.ok) {
      setSelectedTest(null);
      setResult('');
      setAnalysisResult(null);
      fetchTests();
    }
  };

  const getTnsColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (score >= 40) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getTnsBarColor = (score: number) => {
    if (score >= 75) return 'bg-emerald-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Laboratory Queue</h1>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowManualTest(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-600/20"
          >
            <FlaskConical className="w-4 h-4" />
            Manual Test Request
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-bold">
            <Clock className="w-4 h-4" />
            {tests.filter(t => t.status === 'pending').length} Pending
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-bold">
            <CheckCircle className="w-4 h-4" />
            {tests.filter(t => t.status === 'completed').length} Completed
          </div>
          {engineStatus && (
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border ${
              engineStatus.status === 'ok' 
                ? 'bg-indigo-50 text-indigo-700 border-indigo-200' 
                : 'bg-red-50 text-red-700 border-red-200'
            }`}>
              <ShieldCheck className={`w-4 h-4 ${engineStatus.status === 'ok' ? 'animate-pulse' : ''}`} />
              Engine: {engineStatus.status === 'ok' ? `Active (${engineStatus.mode})` : 'Offline'}
            </div>
          )}
        </div>
      </div>

      {/* Manual Test Modal */}
      <AnimatePresence>
        {showManualTest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={`${GLASS_CARD} w-full max-w-md bg-white shadow-2xl`}
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <FlaskConical className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Manual Test Request</h2>
              </div>
              <form onSubmit={handleManualTest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Select Patient</label>
                  <select 
                    required
                    value={manualPatientId}
                    onChange={e => setManualPatientId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all appearance-none"
                  >
                    <option value="">Choose a patient...</option>
                    {patients.map(p => (
                      <option key={p.patient_id} value={p.patient_id}>{p.name} (ID: {p.patient_id})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Test Name</label>
                  <input 
                    required
                    value={manualTestName}
                    onChange={e => setManualTestName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                    placeholder="e.g. Blood Sugar, X-Ray"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowManualTest(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                  >
                    Create Request
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className={`${GLASS_CARD} !p-0 overflow-hidden`}>
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Active Test Requests</h3>
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
                    <th className="px-6 py-4 font-bold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tests.map((test) => (
                    <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Beaker className="w-4 h-4 text-blue-600" />
                          </div>
                          <span className="font-bold text-slate-900">{test.test_name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{test.patient_name}</td>
                      <td className="px-6 py-4 text-slate-600">{test.doctor_name}</td>
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
                        {test.status === 'pending' && (
                          <button 
                            onClick={() => setSelectedTest(test)}
                            className="text-blue-600 hover:text-blue-700 font-bold text-sm transition-colors"
                          >
                            Add Results
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {selectedTest ? (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className={GLASS_CARD}
            >
              <div className="flex items-center gap-3 mb-6">
                <FlaskConical className="w-6 h-6 text-blue-600" />
                <h3 className="text-xl font-bold text-slate-900">Test Entry</h3>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Patient</p>
                      <p className="text-slate-900 font-bold">{selectedTest.patient_name}</p>
                      <p className="text-xs text-slate-500 mt-2 uppercase font-bold tracking-wider mb-1">Test Type</p>
                      <p className="text-blue-600 font-bold">{selectedTest.test_name}</p>
                    </div>
                    <button 
                      onClick={() => fetchTnsAnalysis(selectedTest.patient_id, selectedTest.test_name)}
                      disabled={isAnalyzing}
                      className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
                    >
                      {isAnalyzing ? (
                        <Activity className="w-3 h-3 animate-spin" />
                      ) : (
                        <ShieldCheck className="w-3 h-3" />
                      )}
                      {isAnalyzing ? 'Analyzing...' : 'Run TNS Analysis'}
                    </button>
                  </div>
                </div>

                {/* TNS Analysis Results */}
                <AnimatePresence>
                  {analysisError && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs flex items-center gap-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      {analysisError}
                    </motion.div>
                  )}

                  {analysisResult && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* TNS Score Card */}
                      <div className={`p-4 rounded-xl border ${getTnsColor(analysisResult.summary.score)}`}>
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-bold uppercase tracking-wider">Test Necessity Score (TNS)</h4>
                          <span className="text-2xl font-black">{analysisResult.summary.score}%</span>
                        </div>
                        <div className="w-full bg-white/50 rounded-full h-2 mb-3">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${analysisResult.summary.score}%` }}
                            className={`h-2 rounded-full ${getTnsBarColor(analysisResult.summary.score)}`}
                          />
                        </div>
                        <p className="text-xs font-bold">{analysisResult.summary.verdict}</p>
                      </div>

                      {/* Clinical Evidence Trail */}
                      {/* Clinical Evidence Trail */}
<div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
  <div className="flex items-center gap-2 mb-4">
    <Info className="w-4 h-4 text-slate-400" />
    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Clinical Evidence Trail</h4>
  </div>
  <div className="space-y-3">
    {/* ADD THE '?' AFTER clinical_evidence TO PREVENT CRASHING */}
    {analysisResult.clinical_evidence && Object.entries(analysisResult.clinical_evidence).map(([feature, impact]) => {
      const impactNum = impact as number;
      return (
        <div key={feature} className="space-y-1">
          {/* ... rest of your mapping code ... */}
        </div>
      );
    })}
    {!analysisResult.clinical_evidence && <p className="text-xs text-slate-400">No specific evidence data available.</p>}
  </div>
</div>

                      {/* Security Anchor (Seal) */}
                      <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 shadow-inner">
                        <div className="flex items-center gap-2 mb-2">
                          <ShieldCheck className="w-3 h-3 text-indigo-400" />
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Security Anchor (HMAC-SHA256)</span>
                        </div>
                        <p className="font-mono text-[9px] text-indigo-300 break-all leading-relaxed opacity-80">
                          {analysisResult.security_anchor}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div>
                  <label className="block text-sm text-slate-600 mb-2 font-medium">Findings / Results</label>
                  <textarea 
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 min-h-[150px] outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Enter detailed laboratory findings..."
                  />
                </div>

                <button 
                  onClick={handleUpdateResult}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-600/20 transition-all"
                >
                  Submit Lab Report
                </button>
                <button 
                  onClick={() => setSelectedTest(null)}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          ) : (
            <div className={`${GLASS_CARD} text-center py-12 border-dashed border-slate-200`}>
              <Beaker className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <h4 className="text-slate-400 font-bold">No Test Selected</h4>
              <p className="text-slate-500 text-sm mt-2">Select a pending test from the queue to enter results.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

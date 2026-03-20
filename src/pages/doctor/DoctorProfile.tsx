import React, { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { GLASS_CARD } from '../../lib/utils';
import { User, Mail, Shield, Award, MapPin, Save } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DoctorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: 'dr.smith@nexushealth.com',
    specialty: 'Senior Cardiologist',
    experience: '12 Years',
    location: 'Building A, Room 402',
    bio: 'Dedicated cardiologist with extensive experience in interventional cardiology and patient care.'
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl flex items-center gap-2 font-semibold transition-all active:scale-[0.98]">
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 space-y-6">
          <div className={`${GLASS_CARD} flex flex-col items-center text-center bg-white`}>
            <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl flex items-center justify-center text-4xl font-bold text-white shadow-xl mb-4">
              {profile.name[0]}
            </div>
            <h2 className="text-xl font-bold text-slate-900">{profile.name}</h2>
            <p className="text-blue-600 text-sm font-medium">{profile.specialty}</p>
            <div className="mt-6 w-full pt-6 border-t border-slate-100 space-y-3">
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <Shield className="w-4 h-4" />
                <span>Verified Practitioner</span>
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <Award className="w-4 h-4" />
                <span>Board Certified</span>
              </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className={`${GLASS_CARD} bg-white`}>
            <h3 className="text-lg font-bold text-slate-900 mb-6">Professional Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={profile.name}
                    onChange={e => setProfile({...profile, name: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={profile.email}
                    onChange={e => setProfile({...profile, email: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Specialty</label>
                <input 
                  value={profile.specialty}
                  onChange={e => setProfile({...profile, specialty: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input 
                    value={profile.location}
                    onChange={e => setProfile({...profile, location: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-slate-900 outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Biography</label>
                <textarea 
                  value={profile.bio}
                  onChange={e => setProfile({...profile, bio: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-900 min-h-[120px] outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

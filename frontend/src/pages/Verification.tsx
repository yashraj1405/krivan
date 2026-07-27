import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import type { VerificationSuccess, VerificationFailure } from '../interfaces';
import { formatDate } from '../lib/utils';
import {
  ShieldCheck, AlertTriangle, Sprout, Calendar, Package, Hash,
  Tag, IndianRupee, Layers, FileText, CheckCircle2, Phone, Mail, MapPin,
  Building2, ArrowLeft, RefreshCw, Award
} from 'lucide-react';

import api from '../services/api';

export const Verification: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<VerificationSuccess | VerificationFailure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    api
      .get(`/verify/${token}`)
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        if (err.response?.data) {
          setData(err.response.data);
        } else {
          setData({
            verified: false,
            title: 'Verification Error',
            message: 'Unable to connect to verification server',
            detail: 'Please check your internet connection and try scanning again.',
          });
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center space-y-4">
          <div className="p-4 bg-brand-500/10 border border-brand-500/30 rounded-2xl animate-pulse">
            <Sprout className="h-10 w-10 text-brand-400 animate-bounce" />
          </div>
          <p className="text-sm font-semibold text-slate-300">Verifying Product Authenticity Token...</p>
          <p className="text-xs text-slate-500 font-mono">Token: {token}</p>
        </div>
      </div>
    );
  }

  const isVerified = data?.verified === true;
  const successData = isVerified ? (data as VerificationSuccess) : null;
  const failureData = !isVerified ? (data as VerificationFailure) : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-6 lg:p-8 font-sans">
      {/* Top Portal Header */}
      <header className="w-full max-w-3xl flex items-center justify-between pb-6 border-b border-slate-800/80 mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-brand-500/20 text-brand-400 rounded-xl border border-brand-500/30">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
              KRIVAN <span className="text-brand-400 font-normal text-xs uppercase tracking-widest px-2 py-0.5 bg-brand-500/10 rounded-md border border-brand-500/20">Traceability</span>
            </h1>
            <p className="text-[11px] text-slate-400">Official Product Verification & Authenticity Portal</p>
          </div>
        </div>

        <Link
          to="/login"
          className="text-xs font-semibold text-slate-400 hover:text-white flex items-center gap-1 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Admin Portal</span>
        </Link>
      </header>

      <main className="w-full max-w-3xl space-y-6">
        {/* COUNTERFEIT WARNING CARD */}
        {failureData && (
          <div className="bg-rose-950/40 border-2 border-rose-600/60 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="inline-flex p-4 bg-rose-500/20 text-rose-400 rounded-full border border-rose-500/40 shadow-lg shadow-rose-900/50">
              <AlertTriangle className="h-12 w-12 animate-pulse" />
            </div>

            <div className="space-y-2">
              <span className="px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-rose-500/20 text-rose-300 border border-rose-500/40">
                {failureData.title || 'Invalid Product'}
              </span>
              <h2 className="text-2xl font-black text-rose-100 tracking-tight">
                {failureData.message || 'Possible Counterfeit Product'}
              </h2>
              <p className="text-xs text-rose-200/80 max-w-lg mx-auto leading-relaxed">
                {failureData.detail || 'The scanned QR code token is not registered in our database. This fertilizer product may be unverified, tampered, or counterfeit.'}
              </p>
            </div>

            <div className="p-4 bg-slate-900/80 border border-rose-900/40 rounded-2xl text-left space-y-2 text-xs">
              <span className="font-bold text-slate-300 block uppercase tracking-wider text-[10px]">Security Advisory</span>
              <ul className="list-disc list-inside text-slate-400 space-y-1">
                <li>Do not apply unverified chemical fertilizer products to crops.</li>
                <li>Verify holographic seal on physical packaging.</li>
                <li>Report suspicious stock to Krivan Consumer Protection Helpline: <strong className="text-rose-300">+91-1800-425-7482</strong>.</li>
              </ul>
            </div>
          </div>
        )}

        {/* GENUINE PRODUCT VERIFICATION SHEET */}
        {successData && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Status Banner */}
            <div className="bg-emerald-950/40 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 text-center space-y-4 shadow-2xl backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <ShieldCheck size={160} className="text-emerald-400" />
              </div>

              <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-widest shadow-md">
                <ShieldCheck size={16} className="text-emerald-400" />
                <span>Genuine Krivan Product</span>
              </div>

              <h2 className="text-3xl font-black text-white tracking-tight">
                {successData.product_name}
              </h2>
              <p className="text-xs text-slate-400 font-mono">
                Product Code: <strong className="text-slate-200">{successData.product_code}</strong> | Category: <strong className="text-slate-200">{successData.category}</strong>
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-900/80 border border-slate-700/80 text-emerald-400 rounded-xl text-xs font-bold">
                  <CheckCircle2 size={14} />
                  <span>Scan #{successData.scan_count}</span>
                </span>

                {successData.first_scanned && (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold">
                    <Award size={14} />
                    <span>First Scan Verification</span>
                  </span>
                )}
              </div>
            </div>

            {/* Batch & Manufacturing Details Grid */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                <Layers size={16} className="text-brand-400" />
                Batch & Production Parameters
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Batch Number</span>
                  <span className="font-mono font-bold text-slate-100 text-sm block">{successData.batch_number}</span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Manufacturing Date</span>
                  <span className="font-semibold text-slate-200 block">{formatDate(successData.manufacturing_date)}</span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Expiry Date</span>
                  <span className="font-semibold text-slate-200 block">{formatDate(successData.expiry_date)}</span>
                </div>

                <div className="p-3 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Net Content & MRP</span>
                  <span className="font-bold text-emerald-400 block">
                    {successData.net_content || '—'} {successData.mrp != null ? `(₹${successData.mrp.toLocaleString('en-IN')})` : ''}
                  </span>
                </div>
              </div>
            </div>

            {/* Product Composition & Usage Guide */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileText size={16} className="text-brand-400" />
                Composition & Application Guide
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {successData.composition && (
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Chemical Composition</span>
                    <p className="text-slate-200 leading-relaxed">{successData.composition}</p>
                  </div>
                )}

                {successData.dosage && (
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Recommended Dosage</span>
                    <p className="text-slate-200 leading-relaxed">{successData.dosage}</p>
                  </div>
                )}

                {successData.recommended_crops && (
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Recommended Crops</span>
                    <p className="text-slate-200 leading-relaxed">{successData.recommended_crops}</p>
                  </div>
                )}

                {successData.benefits && (
                  <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Agronomic Benefits</span>
                    <p className="text-slate-200 leading-relaxed">{successData.benefits}</p>
                  </div>
                )}
              </div>

              {successData.description && (
                <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800/80 space-y-1 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Directions & Product Overview</span>
                  <p className="text-slate-300 leading-relaxed">{successData.description}</p>
                </div>
              )}
            </div>

            {/* Authorized Dealer Info (if linked) */}
            {successData.dealer && (
              <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-3 text-xs">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2 border-b border-slate-800 pb-3">
                  <Building2 size={16} className="text-brand-400" />
                  Authorized Distributor / Dealer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Dealer Name</span>
                    <span className="font-bold text-white text-sm">{successData.dealer.dealer_name}</span>
                    {successData.dealer.owner_name && <span className="block text-slate-400">Prop: {successData.dealer.owner_name}</span>}
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Contact & Location</span>
                    <span className="block">{successData.dealer.phone || 'N/A'}</span>
                    <span className="block text-slate-400">{[successData.dealer.city, successData.dealer.state].filter(Boolean).join(', ')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Manufacturer & Company Details Footer */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 text-xs text-slate-400 space-y-3">
              <div className="flex items-center space-x-2 text-slate-200 font-bold text-sm">
                <Building2 size={16} className="text-brand-400" />
                <span>{successData.manufacturer_name}</span>
              </div>
              <p className="flex items-start gap-2">
                <MapPin size={14} className="shrink-0 mt-0.5 text-slate-500" />
                <span>{successData.company_address}</span>
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-800/80">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Phone size={14} className="text-emerald-400" />
                  Toll-Free Customer Care: <strong className="text-white">{successData.customer_care}</strong>
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <Mail size={14} className="text-sky-400" />
                  Email Support: <strong className="text-white">{successData.support_email}</strong>
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer copyright */}
      <footer className="mt-12 text-center text-[11px] text-slate-600">
        © {new Date().getFullYear()} Krivan Agri-Inputs Pvt. Ltd. All rights reserved. Encrypted Traceability Standard v2.0
      </footer>
    </div>
  );
};

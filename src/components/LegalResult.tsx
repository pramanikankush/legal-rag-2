import React, { useState } from 'react';
import { LegalResponse } from '../types';

interface Props {
  data: LegalResponse;
}

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-all p-1.5 rounded-lg"
      title="Copy to clipboard"
    >
      {copied ? (
        <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
};

export const LegalResult: React.FC<Props> = ({ data }) => {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'LOW': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'MEDIUM': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
      case 'HIGH': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'CRITICAL': return 'text-red-500 bg-red-500/10 border-red-500/20';
      default: return 'text-slate-500 bg-slate-500/10';
    }
  };

  return (
    <div className="w-full max-w-5xl space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-24">
      
      {/* 1. Executive Summary Card */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 shadow-xl backdrop-blur-sm relative group">
        <div className="flex items-center justify-between mb-4">
          <h3 className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Executive Summary
          </h3>
          <CopyButton text={data.executiveSummary} />
        </div>
        <p className="text-lg text-slate-200 leading-relaxed font-light">
          {data.executiveSummary}
        </p>
      </section>

      {/* 2. Risk Assessment Card (Unified Two-Column) */}
      <section className="bg-slate-900/50 border border-slate-800 rounded-2xl shadow-xl overflow-hidden relative">
         {/* Sidebar Accent Line */}
         <div className={`absolute top-0 left-0 w-1 h-full ${
            data.riskAssessment.level === 'CRITICAL' ? 'bg-red-500' :
            data.riskAssessment.level === 'HIGH' ? 'bg-orange-500' :
            data.riskAssessment.level === 'MEDIUM' ? 'bg-yellow-500' :
            'bg-emerald-500'
         }`}></div>
         
         <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Score Column */}
            <div className="md:col-span-1 flex flex-col items-center justify-center text-center relative">
                 {/* Background Glow Blob */}
                 <div className={`absolute w-full h-full opacity-10 blur-3xl rounded-full ${
                    data.riskAssessment.level === 'CRITICAL' ? 'bg-red-600' :
                    data.riskAssessment.level === 'HIGH' ? 'bg-orange-600' : 
                    data.riskAssessment.level === 'MEDIUM' ? 'bg-yellow-600' : 'bg-emerald-600'
                 }`}></div>

                 <div className="relative z-10">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Risk Score</h4>
                    <div className="text-6xl font-bold text-slate-100 mb-2 tracking-tighter">
                        {data.riskAssessment.score}<span className="text-2xl text-slate-600 font-normal">/10</span>
                    </div>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getRiskColor(data.riskAssessment.level)}`}>
                        {data.riskAssessment.level} RISK
                    </div>
                 </div>
            </div>

            {/* Reasoning Column */}
            <div className="md:col-span-2 flex flex-col justify-center border-t md:border-t-0 md:border-l border-slate-800 pt-6 md:pt-0 md:pl-8">
               <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Risk Reasoning</h3>
                  <CopyButton text={data.riskAssessment.reasoning} />
               </div>
               <p className="text-slate-300 text-base leading-relaxed">
                  {data.riskAssessment.reasoning}
               </p>
            </div>
         </div>
      </section>

      {/* 3. Citations & Precedents */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-8">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
            Statutory Framework
          </h3>
          <div className="space-y-4">
            {data.relevantStatutes.length === 0 ? (
               <p className="text-slate-500 italic text-sm">No statutes cited.</p>
            ) : (
              data.relevantStatutes.map((stat, i) => (
                <div key={i} className="group">
                  <div className="flex items-baseline justify-between mb-1">
                    <span className="text-sm font-medium text-purple-200">{stat.name}</span>
                    <span className="text-xs font-mono text-slate-500">{stat.section}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed border-l border-slate-700 pl-3 mt-1 group-hover:border-purple-500/50 transition-colors">
                    {stat.relevance}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-slate-900/30 border border-slate-800/50 rounded-2xl p-8">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-200 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            Case Law Precedents
          </h3>
          <div className="space-y-6">
            {data.caseLawPrecedents.length === 0 ? (
              <p className="text-slate-500 italic text-sm">No precedents found.</p>
            ) : (
              data.caseLawPrecedents.map((caseLaw, i) => (
                <div key={i}>
                  <div className="text-sm font-medium text-blue-200 mb-1">{caseLaw.caseName}</div>
                  <div className="text-xs text-slate-500 font-mono mb-2">{caseLaw.citation}</div>
                  <p className="text-xs text-slate-400 bg-slate-800/50 p-3 rounded border border-slate-800/50">
                    {caseLaw.application}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 4. Action Plan */}
      <section className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-8 shadow-2xl relative">
        <div className="flex items-center justify-between mb-6">
          <h3 className="flex items-center gap-2 text-xs font-bold text-legal-gold uppercase tracking-widest">
             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
             </svg>
             Strategic Action Plan
          </h3>
          <CopyButton text={data.recommendedActionPlan.map((step, i) => `${i + 1}. ${step}`).join('\n')} />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {data.recommendedActionPlan.map((step, i) => (
            <div key={i} className="flex items-start gap-4 group">
              <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 text-slate-400 flex items-center justify-center text-sm font-mono group-hover:text-legal-gold group-hover:border-legal-gold/50 transition-colors">
                {i + 1}
              </div>
              <div className="pt-1.5 text-sm text-slate-300 leading-relaxed border-b border-slate-800/50 pb-4 w-full group-last:border-0 group-last:pb-0">
                {step}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
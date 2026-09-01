import React, { useState } from 'react';
import { CallData } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ThumbsUp, AlertCircle, MessageSquare, TrendingUp, User, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface DashboardProps {
  data: CallData;
  onReset: () => void;
}

export function Dashboard({ data, onReset }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'transcript'>('overview');
  const { transcript, analysis } = data;
  const { sentiment, coaching } = analysis;

  return (
    <div className="w-full max-w-6xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Sales Call Intelligence</h2>
          <p className="text-slate-500">AI-powered insights and coaching</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === 'overview' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('transcript')}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-md transition-all",
              activeTab === 'transcript' ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            )}
          >
            Transcript
          </button>
        </div>
      </div>

      {activeTab === 'overview' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Sentiment Graph Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Engagement & Sentiment Timeline</h3>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sentiment} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="timeCode" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    domain={[0, 100]}
                  />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                    labelStyle={{ fontWeight: 'bold', color: '#0f172a', marginBottom: '4px' }}
                    itemStyle={{ color: '#3b82f6' }}
                    formatter={(value: number) => [`${value}%`, 'Engagement']}
                  />
                  <Area
                    type="monotone"
                    dataKey="engagementLevel"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorEngagement)"
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Coaching Card Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ThumbsUp size={20} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">What went well</h3>
              </div>
              <ul className="space-y-4">
                {coaching.doneWell.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                    <span className="text-slate-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                  <AlertCircle size={20} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900">Opportunities to improve</h3>
              </div>
              <ul className="space-y-4">
                {coaching.missedOpportunities.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <div className="mt-1 h-2 w-2 rounded-full bg-amber-400 shrink-0" />
                    <span className="text-slate-700 leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === 'transcript' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                <MessageSquare size={20} />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Full Transcript</h3>
            </div>
          </div>
          <div className="p-6 overflow-y-auto max-h-[600px]">
            <div className="prose prose-slate max-w-none whitespace-pre-wrap font-sans text-[15px] leading-relaxed">
              {transcript}
            </div>
          </div>
        </motion.div>
      )}

      <div className="mt-8 flex justify-center">
        <button
          onClick={onReset}
          className="text-sm font-medium text-slate-500 hover:text-slate-700 underline underline-offset-4 transition-colors"
        >
          Upload another call
        </button>
      </div>
    </div>
  );
}

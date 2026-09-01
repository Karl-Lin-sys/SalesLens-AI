/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AudioUploader } from './components/AudioUploader';
import { Dashboard } from './components/Dashboard';
import { CallData } from './types';
import { Headphones } from 'lucide-react';
import { motion } from 'motion/react';

export default function App() {
  const [data, setData] = useState<CallData | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-100">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 text-white p-2 rounded-lg">
              <Headphones size={20} />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">SalesLens AI</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {!data ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center min-h-[60vh]"
          >
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight mb-4">
                Unlock insights from your sales calls
              </h1>
              <p className="text-lg text-slate-500 mb-8 leading-relaxed">
                Upload a recording of your sales conversation. Our AI will analyze the engagement, structure the transcript, and provide actionable coaching feedback instantly.
              </p>
            </div>
            
            <AudioUploader 
              isUploading={isUploading} 
              setIsUploading={setIsUploading} 
              onUploadSuccess={setData} 
            />
          </motion.div>
        ) : (
          <Dashboard data={data} onReset={() => setData(null)} />
        )}
      </main>
    </div>
  );
}

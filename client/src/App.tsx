import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { InsightTable } from './components/InsightTable';
import type { Insight } from './components/InsightTable';
import { InsightDetailModal } from './components/InsightDetailModal';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield, Activity, Globe, Scale } from 'lucide-react';

const SOCKET_URL = 'http://localhost:3001';

function App() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [selectedInsight, setSelectedInsight] = useState<Insight | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    // 1. Fetch initial insights
    axios.get(`${SOCKET_URL}/api/insights`)
      .then(res => setInsights(res.data))
      .catch(err => console.error('Initial fetch error:', err));

    // 2. Connect to socket
    const socket = io(SOCKET_URL);

    socket.on('insight_updated', (data) => {
      console.log('Real-time update received:', data);
      
      // Refresh insights from API to ensure state consistency
      axios.get(`${SOCKET_URL}/api/insights`)
        .then(res => setInsights(res.data))
        .catch(err => console.error('Socket refresh error:', err));
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleRowClick = (insight: Insight) => {
    setSelectedInsight(insight);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col antialiased">
      {/* Notion-style Header */}
      <header className="border-b border-slate-100 px-8 py-6 flex items-center justify-between bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-950 rounded-lg flex items-center justify-center shadow-lg">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Axiom Truth Ledger</h1>
            <div className="flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-widest mt-0.5">
              <Activity className="w-3 h-3 text-green-500" />
              <span>Engine Status: Live</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Verified State</span>
            <span className="text-sm font-mono font-bold text-slate-800">
              {insights.filter(i => i.status === 'verified').length}
            </span>
          </div>
          <div className="w-px h-8 bg-slate-100" />
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Contested</span>
            <span className="text-sm font-mono font-bold text-amber-600">
              {insights.filter(i => i.status === 'contested').length}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
          <div className="px-8 pt-10 pb-6 flex items-end justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Globe className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Knowledge Graph v1.4</span>
              </div>
              <h2 className="text-4xl font-black text-slate-900">State of Truth</h2>
              <p className="text-slate-500 mt-2 max-w-xl leading-relaxed">
                The living ledger of validated insights. Each entry is synthesized across multiple evidence vectors to maintain an objective reality.
              </p>
            </div>
            
            <div className="bg-slate-50 border border-slate-100 px-4 py-3 rounded-xl flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <Scale className="w-4 h-4 text-blue-500" />
                 <span className="text-sm font-bold text-slate-700">Equilibrium Index</span>
               </div>
               <div className="text-lg font-mono font-black text-blue-600">
                 0.92
               </div>
            </div>
          </div>

          <ScrollArea className="flex-1 px-8">
            <InsightTable insights={insights} onRowClick={handleRowClick} />
            <div className="h-20" /> {/* Spacer */}
          </ScrollArea>
      </main>

      <InsightDetailModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        insightId={selectedInsight?.id || null}
        insightClaim={selectedInsight?.claim || null}
      />

      {/* Footer Branding */}
      <footer className="border-t border-slate-50 px-8 py-4 bg-slate-50/50 flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Proprietary Axiom Architecture</span>
        <span className="text-[10px] font-mono text-slate-400">SESSION_ID_{Math.random().toString(36).substring(7).toUpperCase()}</span>
      </footer>
    </div>
  );
}

export default App;

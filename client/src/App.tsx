import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { InsightTable } from './components/InsightTable';
import type { Insight } from './components/InsightTable';
import { InsightDetailModal } from './components/InsightDetailModal';
import { ScrollArea } from "@/components/ui/scroll-area"
import { Shield } from 'lucide-react';

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
      {/* Simplified Header */}
      <header className="border-b border-slate-100 px-8 py-4 flex items-center justify-between bg-white sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-slate-950 rounded flex items-center justify-center shadow-sm">
            <Shield className="text-white w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Axiom</h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
          <div className="px-8 pt-10 pb-6">
            <h1 className="text-3xl font-bold text-slate-900">Research Insights</h1>
            <p className="text-slate-500 mt-2 max-w-xl leading-relaxed">
              The repository of validated insights synthesized from research evidence.
            </p>
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

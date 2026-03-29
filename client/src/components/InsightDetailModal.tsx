import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Lightbulb, TrendingUp, ShieldCheck } from 'lucide-react';
import axios from 'axios';
import { formatDistanceToNow } from 'date-fns';

interface Evidence {
  type: 'support' | 'conflict';
  content: string;
  source_uuid: string;
  created_at: string;
}

interface Decision {
  implication: string;
  recommended_action: string;
  confidence: number;
  evidence: Evidence[];
}

interface InsightDetailModalProps {
  insightId: string | null;
  insightClaim: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InsightDetailModal: React.FC<InsightDetailModalProps> = ({ insightId, insightClaim, isOpen, onClose }) => {
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && insightId) {
      setLoading(true);
      axios.get(`http://localhost:3001/api/insights/${insightId}/decision`)
        .then(res => setDecision(res.data))
        .catch(err => console.error('Error fetching decision:', err))
        .finally(() => setLoading(false));
    } else {
      setDecision(null);
    }
  }, [isOpen, insightId]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white border-slate-200 shadow-2xl rounded-xl p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4">
          <div className="flex items-center gap-2 mb-2 text-slate-400">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Insight Synthesis</span>
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-900 leading-tight">
            {insightClaim}
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-2">
            Analysis of research insights and strategic implications.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh] p-8 pt-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-slate-400 font-medium animate-pulse">Analyzing Insight...</p>
            </div>
          ) : decision ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-slate-100 shadow-none bg-blue-50/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3 text-blue-600">
                      <Lightbulb className="w-4 h-4" />
                      <h3 className="font-bold text-sm">Strategic Implication</h3>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm antialiased">
                      {decision.implication}
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-slate-100 shadow-none bg-green-50/30">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-2 mb-3 text-green-600">
                      <TrendingUp className="w-4 h-4" />
                      <h3 className="font-bold text-sm">Recommended Action</h3>
                    </div>
                    <p className="text-slate-700 leading-relaxed text-sm antialiased">
                      {decision.recommended_action}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-100">
                <span className="text-sm font-semibold text-slate-600">Confidence Score</span>
                <Badge className="bg-white border-slate-200 text-slate-900 hover:bg-white px-3 py-1 font-mono text-base">
                  {decision.confidence.toFixed(0)}%
                </Badge>
              </div>

              {/* Traceable Evidence Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2 text-slate-900">
                  <h3 className="text-sm font-bold uppercase tracking-wider">Evidence Base</h3>
                  <span className="text-xs text-slate-400 font-normal">({decision.evidence.length} points)</span>
                </div>
                
                <div className="space-y-3">
                  {decision.evidence.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="group p-4 rounded-lg bg-white border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-center gap-2">
                          {item.type === 'support' ? (
                            <Badge className="bg-green-50 text-green-700 border-green-100 hover:bg-green-50 px-2 py-0 text-[10px] font-bold uppercase">
                              ✅ Support
                            </Badge>
                          ) : (
                            <Badge className="bg-red-50 text-red-700 border-red-100 hover:bg-red-50 px-2 py-0 text-[10px] font-bold uppercase">
                              ❌ Conflict
                            </Badge>
                          )}
                          <span className="text-[10px] font-mono text-slate-400 group-hover:text-slate-600 transition-colors">
                            src: {item.source_uuid.slice(0, 8)}...
                          </span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 whitespace-nowrap">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        "{item.content}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              Insight data unavailable or processing.
            </div>
          )}
        </ScrollArea>
        
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors uppercase tracking-wider"
          >
            Close Analysis
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

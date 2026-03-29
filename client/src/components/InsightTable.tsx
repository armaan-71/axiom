import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, AlertCircle, Circle } from 'lucide-react';

export interface Insight {
  id: string;
  claim: string;
  support_count: number;
  conflict_count: number;
  status: 'verified' | 'contested' | 'pending';
  last_mention: string;
}

interface InsightTableProps {
  insights: Insight[];
  onRowClick: (insight: Insight) => void;
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'verified':
      return (
        <Badge variant="outline" className="flex items-center gap-1.5 border-green-200 bg-green-50 text-green-700 font-medium px-2 py-0.5 rounded-full">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Verified
        </Badge>
      );
    case 'contested':
      return (
        <Badge variant="outline" className="flex items-center gap-1.5 border-amber-200 bg-amber-50 text-amber-700 font-medium px-2 py-0.5 rounded-full">
          <AlertCircle className="w-3.5 h-3.5" />
          Contested
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="flex items-center gap-1.5 border-slate-200 bg-slate-50 text-slate-600 font-medium px-2 py-0.5 rounded-full">
          <Circle className="w-3.5 h-3.5" />
          Pending
        </Badge>
      );
  }
};

export const InsightTable: React.FC<InsightTableProps> = ({ insights, onRowClick }) => {
  return (
    <div className="w-full border-t border-slate-100 mt-4 overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent border-b border-slate-100">
            <TableHead className="w-[50%] font-semibold text-slate-900 py-4 px-6">Insight / Truth Claim</TableHead>
            <TableHead className="text-center font-semibold text-slate-900 py-4 px-4">Status</TableHead>
            <TableHead className="text-center font-semibold text-slate-900 py-4 px-4">Support</TableHead>
            <TableHead className="text-center font-semibold text-slate-900 py-4 px-4">Conflict</TableHead>
            <TableHead className="text-right font-semibold text-slate-900 py-4 px-6">Last Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {insights.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-20 text-slate-400 font-medium">
                No insights captured yet. Axiom is listening...
              </TableCell>
            </TableRow>
          ) : (
            insights.map((insight) => (
              <TableRow 
                key={insight.id} 
                onClick={() => onRowClick(insight)}
                className="cursor-pointer hover:bg-slate-50/50 transition-colors border-b border-slate-50 group"
              >
                <TableCell className="py-4 px-6 font-medium text-slate-700 group-hover:text-slate-900 transition-colors">
                  {insight.claim}
                </TableCell>
                <TableCell className="text-center py-4 px-4">
                  <div className="flex justify-center">
                    <StatusBadge status={insight.status} />
                  </div>
                </TableCell>
                <TableCell className="text-center py-4 px-4 font-mono text-slate-600">
                  {insight.support_count}
                </TableCell>
                <TableCell className="text-center py-4 px-4 font-mono text-slate-600">
                  {insight.conflict_count}
                </TableCell>
                <TableCell className="text-right py-4 px-6 text-slate-400 text-sm italic whitespace-nowrap">
                  {formatDistanceToNow(new Date(insight.last_mention), { addSuffix: true })}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};

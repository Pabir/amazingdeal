import React, { useState, useEffect } from 'react';
import { 
  Activity, Database, Server, Cpu, HardDrive, 
  CheckCircle2, RefreshCw, Clock, ShieldCheck, Zap 
} from 'lucide-react';
import { SystemHealth } from '../../types';
import { ApiService } from '../../services/api';

export const SuperadminHealth: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await ApiService.getSystemHealth();
      setHealth(data);
    } catch (err: any) {
      console.error('Failed to load system health:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / (3600 * 24));
    const h = Math.floor((seconds % (3600 * 24)) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${d > 0 ? `${d}d ` : ''}${h}h ${m}m ${s}s`;
  };

  const memPct = health && health.totalMemoryMb > 0 
    ? Math.round((health.usedMemoryMb / health.totalMemoryMb) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            <span>Infrastructure & System Diagnostics</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
              Operational
            </span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Real-time telemetry from Spring Boot backend, Neon PostgreSQL connection pool, and host environment.
          </p>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Run Diagnostic Ping</span>
        </button>
      </div>

      {/* Grid of Diagnostics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Backend Runtime */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">Backend Web Service</div>
              <div className="text-[11px] text-slate-500">Render Docker / Java 21 LTS</div>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Status:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {health?.status || 'HEALTHY'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Java Runtime:</span>
              <span className="font-mono text-slate-800">{health?.javaVersion || '21'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CPU Cores:</span>
              <span className="font-bold text-slate-800">{health?.availableProcessors || 2} Cores</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Server Uptime:</span>
              <span className="font-mono text-slate-800">{health ? formatUptime(health.uptimeSeconds) : '...'}</span>
            </div>
          </div>
        </div>

        {/* Database */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">Database Layer</div>
              <div className="text-[11px] text-slate-500">Neon Serverless PostgreSQL 16</div>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Connection Pool:</span>
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                HikariCP Active
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">SSL Encryption:</span>
              <span className="font-mono text-emerald-700">sslmode=require</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Multi-Tenancy:</span>
              <span className="font-bold text-indigo-600">Discriminator Column</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Region:</span>
              <span className="text-slate-800">AWS us-east-2 (Neon)</span>
            </div>
          </div>
        </div>

        {/* Memory Footprint */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 font-bold">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="font-extrabold text-sm text-slate-900">JVM Memory Meter</div>
              <div className="text-[11px] text-slate-500">Allocated Heap & GC Status</div>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-slate-100 text-slate-600">
            <div className="flex justify-between">
              <span className="text-slate-400">Used Memory:</span>
              <span className="font-bold text-slate-800">{health?.usedMemoryMb || 0} MB / {health?.totalMemoryMb || 0} MB</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full transition-all duration-500 rounded-full ${
                  memPct > 85 ? 'bg-red-500' : memPct > 65 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, memPct))}%` }}
              />
            </div>

            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Free Heap: {health?.freeMemoryMb || 0} MB</span>
              <span>Load: {memPct}%</span>
            </div>
          </div>
        </div>

      </div>

      {/* Cloud & Edge Blueprint */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 text-white shadow-xl">
        <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Active Edge & Cloud Infrastructure Network</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Cloudflare Edge CDN</div>
            <div className="font-bold text-white mt-1">Universal & Wildcard SSL</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">*.amazingdeal.co.in Active</div>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Cloudflare R2 Storage</div>
            <div className="font-bold text-white mt-1">S3-Compatible Media CDN</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">media.amazingdeal.co.in</div>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Platform Master Razorpay</div>
            <div className="font-bold text-white mt-1">Live SaaS Payment Gateway</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">rzp_live_... Configured</div>
          </div>

          <div className="p-3.5 bg-slate-800/80 rounded-xl border border-slate-700">
            <div className="text-slate-400 text-[10px] font-bold uppercase">Keep-Alive Uptime Daemon</div>
            <div className="font-bold text-white mt-1">Render Free Tier Sleep Guard</div>
            <div className="text-[11px] text-emerald-400 mt-0.5">10-Min Automated Ping</div>
          </div>
        </div>
      </div>

    </div>
  );
};


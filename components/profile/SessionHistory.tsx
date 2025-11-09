import React, { useState, useMemo, useEffect } from 'react';
import type { Session, User, SessionType } from '../../types';
import SessionHistoryCard from './SessionHistoryCard';
import * as supabaseService from '../../lib/supabaseService';

interface SessionHistoryProps {
  user: User;
}

type TypeFilter = 'All' | 'Created' | 'Joined' | 'Cookies Given';
type DateFilter = 'Last Week' | 'Last Month' | 'All Time';

const sessionTypeIcons: Record<SessionType, string> = {
  vibe: '🎉',
  seek: '🙋',
  cookie: '🍪',
  borrow: '🤝',
};

const SkeletonCard: React.FC = () => (
    <div className="bg-[--color-bg-primary] rounded-lg shadow-sm p-3 flex items-center gap-3 animate-pulse">
        <div className="w-10 h-10 bg-[--color-bg-tertiary] rounded-md"></div>
        <div className="flex-grow space-y-2">
            <div className="h-4 bg-[--color-bg-tertiary] rounded w-3/4"></div>
            <div className="h-3 bg-[--color-bg-tertiary] rounded w-1/2"></div>
        </div>
    </div>
);

const SessionHistory: React.FC<SessionHistoryProps> = ({ user }) => {
  const [userHistory, setUserHistory] = useState<Session[]>([]);
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('All Time');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadHistory = async () => {
        setIsLoading(true);
        const { data } = await supabaseService.fetchUserSessionHistory(user.id);
        setUserHistory(data || []);
        setIsLoading(false);
    };
    loadHistory();
  }, [user.id]);

  const stats = useMemo(() => {
    const created = userHistory.filter(s => s.creator_id === user.id);
    const joined = userHistory.filter(s => s.creator_id !== user.id);
    const cookiesGiven = created.filter(s => s.sessionType === 'cookie');
    
    const totalDuration = userHistory.reduce((acc, s) => acc + s.duration, 0);
    const avgDuration = userHistory.length > 0 ? Math.round(totalDuration / userHistory.length) : 0;
    
    const typeCounts = userHistory.reduce((acc, s) => {
      acc[s.sessionType] = (acc[s.sessionType] || 0) + 1;
      return acc;
    }, {} as Record<SessionType, number>);

    // FIX: The value from Object.entries might not be correctly inferred as a number.
    // Using Number() coercion ensures the subtraction is a valid arithmetic operation.
    const mostFrequentType = Object.entries(typeCounts).sort((a, b) => Number(b[1]) - Number(a[1]))[0];

    return {
      totalJoined: userHistory.length,
      sessionsCreated: created.length,
      cookieSessionsTaught: cookiesGiven.length,
      avgSessionDuration: avgDuration,
      mostFrequentVibe: mostFrequentType ? { type: mostFrequentType[0] as SessionType, icon: sessionTypeIcons[mostFrequentType[0] as SessionType] } : { type: 'N/A', icon: '❓' },
    };
  }, [userHistory, user.id]);

  const filteredHistory = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(new Date().setDate(now.getDate() - 7));
    const monthAgo = new Date(new Date().setMonth(now.getMonth() - 1));

    let dateFiltered = userHistory;

    if (dateFilter === 'Last Week') {
      dateFiltered = userHistory.filter(s => new Date(s.event_time) >= weekAgo);
    } else if (dateFilter === 'Last Month') {
      dateFiltered = userHistory.filter(s => new Date(s.event_time) >= monthAgo);
    }
    
    switch (typeFilter) {
      case 'Created':
        return dateFiltered.filter(s => s.creator_id === user.id);
      case 'Joined':
        return dateFiltered.filter(s => s.participants.includes(user.id) && s.creator_id !== user.id);
      case 'Cookies Given':
        return dateFiltered.filter(s => s.sessionType === 'cookie' && s.creator_id === user.id);
      case 'All':
      default:
        return dateFiltered;
    }
  }, [userHistory, typeFilter, dateFilter, user.id]);
  
  useEffect(() => {
      setIsLoading(true);
      const timer = setTimeout(() => {
          // This simulates the filtering being applied
          setIsLoading(false);
      }, 300);
      return () => clearTimeout(timer);
  }, [typeFilter, dateFilter]);


  const StatCard: React.FC<{ label: string; value: string | number; icon?: string }> = ({ label, value, icon }) => (
    <div className="bg-[--color-bg-tertiary] p-3 rounded-lg text-center">
      <p className="text-sm text-[--color-text-secondary]">{label}</p>
      <p className="text-2xl font-bold text-[--color-text-primary]">
        {icon && <span className="mr-1">{icon}</span>}
        {value}
      </p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Sessions Joined" value={stats.totalJoined} />
        <StatCard label="Sessions Created" value={stats.sessionsCreated} />
        <StatCard label="Cookies Taught" value={stats.cookieSessionsTaught} icon="🍪" />
        <StatCard label="Avg. Duration" value={`${stats.avgSessionDuration}m`} />
        <StatCard label="Top Vibe" value={stats.mostFrequentVibe.type} icon={stats.mostFrequentVibe.icon} />
      </div>

      {/* Filters */}
      <div className="space-y-2 pt-2">
        <div className="flex flex-wrap gap-2">
          {(['All', 'Created', 'Joined', 'Cookies Given'] as TypeFilter[]).map(f => (
            <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${typeFilter === f ? 'bg-[--color-accent-primary] text-[--color-text-on-accent]' : 'bg-[--color-bg-tertiary] text-[--color-text-primary] hover:bg-[--color-border]'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
           {(['Last Week', 'Last Month', 'All Time'] as DateFilter[]).map(f => (
            <button key={f} onClick={() => setDateFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${dateFilter === f ? 'bg-[--color-accent-secondary] text-[--color-text-on-accent]' : 'bg-[--color-bg-tertiary] text-[--color-text-primary] hover:bg-[--color-border]'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3 pt-2">
        {isLoading ? (
            Array.from({length: 3}).map((_, i) => <SkeletonCard key={i} />)
        ) : filteredHistory.length > 0 ? (
          filteredHistory.map(session => <SessionHistoryCard key={session.id} session={session} />)
        ) : (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🗓️</p>
            <h3 className="font-semibold text-[--color-text-primary]">No history found</h3>
            <p className="text-sm text-[--color-text-secondary] mt-1">Try adjusting your filters or join a session!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
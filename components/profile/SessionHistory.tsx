import React, { useState, useMemo } from 'react';
import type { Session, User, SessionType } from '../../types';
import SessionHistoryCard from './SessionHistoryCard';

interface SessionHistoryProps {
  user: User;
  allSessions: Session[];
}

type TypeFilter = 'All' | 'Created' | 'Joined' | 'Cookies Given';
type DateFilter = 'Last Week' | 'Last Month' | 'All Time';

const sessionTypeIcons: Record<SessionType, string> = {
  vibe: '🎉',
  seek: '🙋',
  cookie: '🍪',
  borrow: '🤝',
};

const SessionHistory: React.FC<SessionHistoryProps> = ({ user, allSessions }) => {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [dateFilter, setDateFilter] = useState<DateFilter>('All Time');

  const userHistory = useMemo(() => {
    return allSessions
      .filter(s => s.status === 'closed' && (s.creator_id === user.id || s.participants.includes(user.id)))
      .sort((a, b) => new Date(b.event_time).getTime() - new Date(a.event_time).getTime());
  }, [allSessions, user.id]);

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

    const mostFrequentType = Object.entries(typeCounts).sort(([, a], [, b]) => b - a)[0];

    return {
      totalJoined: userHistory.length,
      sessionsCreated: created.length,
      cookieSessionsTaught: cookiesGiven.length,
      avgSessionDuration: avgDuration,
      mostFrequentVibe: mostFrequentType ? { type: mostFrequentType[0] as SessionType, icon: sessionTypeIcons[mostFrequentType[0] as SessionType] } : { type: 'N/A', icon: '❓' },
    };
  }, [userHistory]);

  const filteredHistory = useMemo(() => {
    let filtered = userHistory;

    // Type Filter
    switch (typeFilter) {
      case 'Created':
        filtered = filtered.filter(s => s.creator_id === user.id);
        break;
      case 'Joined':
        filtered = filtered.filter(s => s.creator_id !== user.id);
        break;
      case 'Cookies Given':
        filtered = filtered.filter(s => s.creator_id === user.id && s.sessionType === 'cookie');
        break;
      default: // 'All'
        break;
    }

    // Date Filter
    const now = new Date();
    switch (dateFilter) {
      case 'Last Week':
        filtered = filtered.filter(s => new Date(s.event_time).getTime() > now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'Last Month':
        filtered = filtered.filter(s => new Date(s.event_time).getTime() > now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default: // 'All Time'
        break;
    }

    return filtered;
  }, [userHistory, typeFilter, dateFilter, user.id]);

  const StatCard: React.FC<{ label: string; value: string | number; icon?: string }> = ({ label, value, icon }) => (
    <div className="bg-gray-100 p-3 rounded-lg text-center">
      <p className="text-sm text-gray-600">{label}</p>
      <p className="text-2xl font-bold text-gray-800">
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
            <button key={f} onClick={() => setTypeFilter(f)} className={`px-3 py-1 text-sm font-semibold rounded-full transition-colors ${typeFilter === f ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
           {(['Last Week', 'Last Month', 'All Time'] as DateFilter[]).map(f => (
            <button key={f} onClick={() => setDateFilter(f)} className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${dateFilter === f ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* History List */}
      <div className="space-y-3 pt-2">
        {filteredHistory.length > 0 ? (
          filteredHistory.map(session => <SessionHistoryCard key={session.id} session={session} />)
        ) : (
          <div className="text-center py-10">
            <p className="text-4xl mb-3">🗓️</p>
            <h3 className="font-semibold text-gray-700">No history found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your filters or join a session!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
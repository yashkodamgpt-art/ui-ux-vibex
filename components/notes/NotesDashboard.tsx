

import React, { useState, useEffect, useCallback } from 'react';
// FIX: The 'Note' type has been removed. This component is repurposed to show past Sessions.
import type { User, Session } from '../../types';
import NoteCard from './NoteCard';
// import AddNoteForm from './AddNoteForm'; // FIX: AddNoteForm is obsolete as sessions are created from the map.
import { supabase } from '../../lib/supabaseClient';

interface NotesDashboardProps {
  user: User;
}

const NotesDashboard: React.FC<NotesDashboardProps> = ({ user }) => {
  // FIX: State now holds Sessions, not Notes.
  const [notes, setNotes] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // FIX: Functionality changed to fetch past sessions (status: 'closed')
  const fetchNotes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('sessions') // FIX: Table changed from 'notes' to 'sessions'.
      .select('*')
      .eq('status', 'closed') // FIX: Fetching closed sessions for history.
      // FIX: Fetch sessions where the user is either the creator or a participant.
      .or(`creator_id.eq.${user.id},participants.cs.{${user.id}}`) 
      .order('event_time', { ascending: false }); // FIX: Order by event_time.

    if (error) {
      console.error("Error fetching notes:", error);
    } else {
      // FIX: Data is cast to Session[].
      setNotes(data as Session[]);
    }
    setLoading(false);
  }, [user.id]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  // FIX: handleAddNote and AddNoteForm are removed as they are part of the old 'notes' feature.

  return (
    <div className="space-y-8">
      {/* <AddNoteForm onAddNote={handleAddNote} /> */}
      
      <div className="mt-8">
        <h2 className="text-2xl font-bold text-[--color-text-primary] mb-6">Your Past Sessions</h2>
        {loading ? (
            <div className="text-center py-16"><p className="text-[--color-text-secondary]">Loading your history...</p></div>
        ) : notes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {notes.map((note) => (
              // FIX: The 'note' object is now a Session, passed to the repurposed NoteCard.
              <NoteCard key={note.id} note={note} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-[--color-bg-primary] rounded-xl shadow-md">
            <h3 className="text-xl font-semibold text-[--color-text-secondary]">No vibes yet!</h3>
            <p className="text-[--color-text-secondary] mt-2">Join or create a session to see your history here.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesDashboard;


import React from 'react';
// FIX: The 'Note' type has been removed. This component is repurposed to display a Session from history.
import type { Session } from '../../types';

interface NoteCardProps {
  note: Session; // FIX: Using Session type, but keeping prop name for compatibility with parent.
}

const NoteCard: React.FC<NoteCardProps> = ({ note }) => {
  // FIX: Using event_time from the Session type.
  const formattedDate = new Date(note.event_time).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-[--color-bg-primary] p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
       <div>
        <h4 className="font-bold text-[--color-text-primary]">{note.title}</h4>
        <p className="text-[--color-text-secondary] whitespace-pre-wrap mt-2">{note.description}</p>
      </div>
      <p className="text-right text-xs text-[--color-text-secondary]/70 mt-4">{formattedDate}</p>
    </div>
  );
};

export default NoteCard;
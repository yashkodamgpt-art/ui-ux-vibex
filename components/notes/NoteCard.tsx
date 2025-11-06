
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
    <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 flex flex-col justify-between">
       <div>
        <h4 className="font-bold text-gray-800">{note.title}</h4>
        <p className="text-gray-600 whitespace-pre-wrap mt-2">{note.description}</p>
      </div>
      <p className="text-right text-xs text-gray-400 mt-4">{formattedDate}</p>
    </div>
  );
};

export default NoteCard;

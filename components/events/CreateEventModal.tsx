
import React, { useState } from 'react';
// FIX: Replaced obsolete 'Event' and 'Topic' types with 'Session'.
import type { Session } from '../../types';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    // FIX: The onSubmit prop now expects data conforming to the Session type.
    onSubmit: (eventData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants' | 'creator'>) => void;
}

// FIX: ALL_TOPICS and Topic type are removed as they are obsolete.

const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    // FIX: Removed state for selectedTopics and isPublic.
    const [eventTimeOffset, setEventTimeOffset] = useState(5); // in minutes
    const [duration, setDuration] = useState(60); // in minutes
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        // FIX: Validation updated to only check for title.
        if (!title.trim()) {
            setError('Please provide a title.');
            return;
        }

        const eventTime = new Date(Date.now() + eventTimeOffset * 60 * 1000).toISOString();

        // FIX: Submitting a Session object, not an Event. Added new required fields with defaults.
        onSubmit({
            title,
            description,
            event_time: eventTime,
            duration,
            status: 'active',
            sessionType: 'vibe',
            emoji: '👋',
            genderFilter: 'neutral',
            flow: 'offering', // Required by type, default for vibe
        });
        // Reset form for next time
        setTitle('');
        setDescription('');
        setEventTimeOffset(5);
        setDuration(60);
    };

    if (!isOpen) return null;

    return (
        <>
            <div 
                onClick={onClose}
                className="fixed inset-0 bg-black/50 z-[2000] transition-opacity duration-300 opacity-100" 
                aria-hidden="true"
            />
            <div 
                className="fixed inset-0 z-[2010] flex items-center justify-center p-4"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-event-title"
            >
                <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 sm:p-8 space-y-6 transform transition-all duration-300 scale-100">
                    <h2 id="create-event-title" className="text-2xl font-bold text-gray-800">Create a New Vibe</h2>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div>
                        <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500" placeholder="e.g., Sunset Movie Night" />
                    </div>

                    <div>
                        <label htmlFor="description" className="text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className="mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500" rows={3} placeholder="Add a few details..."></textarea>
                    </div>

                    {/* FIX: Removed Topics section as it's no longer part of the data model. */}
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                         <div>
                            <span className="text-sm font-medium text-gray-700">When?</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {[5, 10, 15, 20, 25, 30].map(min => (
                                    <button type="button" key={min} onClick={() => setEventTimeOffset(min)} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${eventTimeOffset === min ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                        In {min} min
                                    </button>
                                ))}
                            </div>
                         </div>
                         <div>
                            <span className="text-sm font-medium text-gray-700">For how long?</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {[30, 60, 90, 120].map(d => (
                                    <button type="button" key={d} onClick={() => setDuration(d)} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${duration === d ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                        {d < 60 ? `${d}m` : `${d / 60}h`}
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>

                    {/* FIX: Removed Visibility (is_public) toggle as it's no longer part of the data model. */}

                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Cancel</button>
                        <button type="submit" className="px-6 py-2 bg-purple-600 text-white font-semibold rounded-lg shadow-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2">Create Vibe</button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default CreateEventModal;

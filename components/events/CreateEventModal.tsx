
import React, { useState, useEffect } from 'react';
import type { Session, SessionType } from '../../types';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (eventData: Omit<Session, 'id' | 'creator' | 'creator_id' | 'lat' | 'lng' | 'participants' | 'creator'>) => void;
    sessionType: SessionType | null;
}

const sessionConfigs = {
  vibe: { title: 'Vibe', emoji: '🎉', flow: 'offering' as const, color: 'purple', placeholder: "e.g., Sunset Movie Night" },
  seek: { title: 'Seek Session', emoji: '🙋', flow: 'seeking' as const, color: 'blue', placeholder: "e.g., Help with Calculus problem" },
  cookie: { title: 'Cookie Session', emoji: '🍪', flow: 'offering' as const, color: 'orange', placeholder: "e.g., Offering Python tutoring" },
  borrow: { title: 'Borrow Request', emoji: '🤝', flow: 'seeking' as const, color: 'green', placeholder: "e.g., Need a T-Square for class" },
};


const CreateEventModal: React.FC<CreateEventModalProps> = ({ isOpen, onClose, onSubmit, sessionType }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [eventTimeOffset, setEventTimeOffset] = useState(5); // in minutes
    const [duration, setDuration] = useState(60); // in minutes
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setTitle('');
            setDescription('');
            setEventTimeOffset(5);
            setDuration(60);
            setError('');
        }
    }, [isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        
        if (!title.trim()) {
            setError('Please provide a title.');
            return;
        }

        if (!sessionType) {
            setError('A session type must be selected.');
            return;
        }

        const eventTime = new Date(Date.now() + eventTimeOffset * 60 * 1000).toISOString();
        const config = sessionConfigs[sessionType];

        onSubmit({
            title,
            description,
            event_time: eventTime,
            duration,
            status: 'active',
            sessionType: sessionType,
            emoji: config.emoji,
            genderFilter: 'neutral',
            flow: config.flow,
        });
    };

    if (!isOpen || !sessionType) return null;

    const config = sessionConfigs[sessionType];
    const colors = {
      purple: { ring: 'focus:ring-purple-500', bg: 'bg-purple-600', hoverBg: 'hover:bg-purple-700', text: 'text-purple-600' },
      blue: { ring: 'focus:ring-blue-500', bg: 'bg-blue-600', hoverBg: 'hover:bg-blue-700', text: 'text-blue-600' },
      orange: { ring: 'focus:ring-orange-500', bg: 'bg-orange-600', hoverBg: 'hover:bg-orange-700', text: 'text-orange-600' },
      green: { ring: 'focus:ring-green-600', bg: 'bg-green-600', hoverBg: 'hover:bg-green-700', text: 'text-green-600' },
    }[config.color];


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
                    <h2 id="create-event-title" className="text-2xl font-bold text-gray-800">Create a New {config.title}</h2>
                    {error && <p className="text-red-500 text-sm">{error}</p>}
                    
                    <div>
                        <label htmlFor="title" className="text-sm font-medium text-gray-700">Title</label>
                        <input id="title" type="text" value={title} onChange={e => setTitle(e.target.value)} required className={`mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 ${colors.ring}`} placeholder={config.placeholder} />
                    </div>

                    <div>
                        <label htmlFor="description" className="text-sm font-medium text-gray-700">Description (Optional)</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} className={`mt-1 block w-full px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 ${colors.ring}`} rows={3} placeholder="Add a few details..."></textarea>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-4 gap-y-6">
                         <div>
                            <span className="text-sm font-medium text-gray-700">When?</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {[5, 10, 15, 20, 25, 30].map(min => (
                                    <button type="button" key={min} onClick={() => setEventTimeOffset(min)} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${eventTimeOffset === min ? `${colors.bg} text-white` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                        In {min} min
                                    </button>
                                ))}
                            </div>
                         </div>
                         <div>
                            <span className="text-sm font-medium text-gray-700">For how long?</span>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {[30, 60, 90, 120].map(d => (
                                    <button type="button" key={d} onClick={() => setDuration(d)} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${duration === d ? `${colors.bg} text-white` : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                                        {d < 60 ? `${d}m` : `${d / 60}h`}
                                    </button>
                                ))}
                            </div>
                         </div>
                    </div>

                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2">Cancel</button>
                        <button type="submit" className={`px-6 py-2 ${colors.bg} text-white font-semibold rounded-lg shadow-md ${colors.hoverBg} focus:outline-none focus:ring-2 ${colors.ring} focus:ring-offset-2`}>Create</button>
                    </div>
                </form>
            </div>
        </>
    );
};

export default CreateEventModal;

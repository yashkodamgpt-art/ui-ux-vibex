import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { Session, User, Friend } from '../../types';
import type { CampusZoneName } from '../../lib/campusConfig';
import { DEFAULT_CAMPUS_COORDS } from '../../lib/campusConfig';

declare const L: any;

const INITIAL_ZOOM = 13;
const LOCATION_FOUND_ZOOM = 16;
const CREATE_RADIUS_METERS = 5000;

interface MapViewProps {
  isCreateMode: boolean;
  userLocation: [number, number] | null;
  onSetUserLocation: (coords: [number, number]) => void;
  onMapClick: (coords: { lat: number, lng: number }) => void;
  events: Session[];
  user: User;
  friends: Friend[]; // NEW
  activeVibe: Session | null;
  onCloseEvent: (eventId: number) => void;
  onExtendEvent: (eventId: number, minutes: number) => void;
  onJoinVibe: (eventId: number, role?: 'seeking' | 'offering' | 'participant' | 'giver') => void;
  onViewChat: () => void;
  isVisible: boolean;
  activeFilter: CampusZoneName;
  campusZones: { [key in CampusZoneName]: { coords: [number, number]; zoom: number; radius: number } };
}

export interface MapViewRef {
  recenter: () => void;
  flyToSession: (session: Session) => void; // NEW
}

// --- HELPER FUNCTIONS ---
function formatPopupTime(event: Session, now: Date, isJoined: boolean): string {
    const startTime = new Date(event.event_time);
    const endTime = new Date(startTime.getTime() + event.duration * 60 * 1000);
    const nowTime = now.getTime();
    
    const isScheduled = startTime.getTime() > nowTime;
    const isActive = !isScheduled;
    
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    const formattedStartTime = startTime.toLocaleTimeString([], timeOptions).replace(' ', '');
    const formattedEndTime = endTime.toLocaleTimeString([], timeOptions).replace(' ', '');

    if (isScheduled) {
        const minutesToStart = Math.round((startTime.getTime() - nowTime) / 60000);
        return `<p class="text-xs text-gray-500">Starts in ${minutesToStart}m (${formattedStartTime})</p>`;
    }
    
    if (isActive) {
        const minutesToEnd = Math.round((endTime.getTime() - nowTime) / 60000);
        if (minutesToEnd < 1) return `<p class="text-sm font-bold text-red-600">Ending soon</p>`;
        
        const hours = Math.floor(minutesToEnd / 60);
        const mins = Math.round(minutesToEnd % 60);
        let remainingStr = '';
        if (hours > 0) remainingStr += `${hours}h `;
        if (mins > 0 || hours === 0) remainingStr += `${mins}m left`;
        
        if (isJoined) {
            return `<p class="text-sm font-bold text-green-600">${remainingStr.trim()} (ends ${formattedEndTime})</p>`;
        } else {
             return `<p class="text-xs text-gray-500">Ends at: ${formattedEndTime}</p>`;
        }
    }
    
    return ''; // Should not happen for active sessions
}

const stringToColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
        const value = (hash >> (i * 8)) & 0xFF;
        color += ('00' + value.toString(16)).substr(-2);
    }
    return color;
};
const generateAvatar = (participantId: string, allFriends: Friend[], user: User, session: Session): string => {
    let username = 'Unknown';
    if (participantId === user.id) {
        username = user.profile.username;
    } else if (participantId === session.creator_id) {
        username = session.creator.username;
    } else {
        const friend = allFriends.find(f => f.id === participantId);
        username = friend?.username || 'Guest';
    }
    const initial = username.charAt(0).toUpperCase();
    const bgColor = stringToColor(participantId);
    return `<div title="${username}" style="display: inline-block; width: 28px; height: 28px; border-radius: 50%; background-color: ${bgColor}; color: white; text-align: center; line-height: 28px; font-weight: bold; font-size: 14px; margin-right: -8px; border: 2px solid white;">${initial}</div>`;
};


const MapView = forwardRef<MapViewRef, MapViewProps>((props, ref) => {
  const { isCreateMode, userLocation, onSetUserLocation, onMapClick, events, isVisible, activeFilter, campusZones } = props;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const eventsLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  
  // Use a ref to hold props for use in event handlers, preventing stale closures
  const propsRef = useRef(props);
  useEffect(() => {
    propsRef.current = props;
  });


  const [displayCoords, setDisplayCoords] = useState<{ lat: number; lng: number }>({ lat: DEFAULT_CAMPUS_COORDS[0], lng: DEFAULT_CAMPUS_COORDS[1] });
  const [error, setError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useImperativeHandle(ref, () => ({
    recenter: () => { if (mapInstanceRef.current && userLocation) { mapInstanceRef.current.flyTo(userLocation, LOCATION_FOUND_ZOOM); } },
    flyToSession: (session: Session) => { if (mapInstanceRef.current && session?.lat && session?.lng) { mapInstanceRef.current.flyTo([session.lat, session.lng], 18); } }
  }));

  useEffect(() => { if (!mapRef.current || typeof L === 'undefined') { console.error("MapView: Leaflet library (L) is not defined or map container is not available."); setError("Map could not be loaded."); return; } const map = L.map(mapRef.current, { center: DEFAULT_CAMPUS_COORDS, zoom: INITIAL_ZOOM, zoomControl: false }); mapInstanceRef.current = map; L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 19, keepBuffer: 2, }).addTo(map); L.control.scale({ position: 'bottomright' }).addTo(map); userMarkerRef.current = L.marker(DEFAULT_CAMPUS_COORDS).addTo(map); eventsLayerRef.current = L.layerGroup().addTo(map); setTimeout(() => map.invalidateSize(), 100); return () => { map.remove(); }; }, []);
  useEffect(() => { if (!mapInstanceRef.current) return; setLoadingLocation(true); setError(null); const locationTimeout = setTimeout(() => { setError('Could not get your location in time. Using default campus location.'); setLoadingLocation(false); }, 5000); navigator.geolocation.getCurrentPosition( (position) => { clearTimeout(locationTimeout); const userCoords: [number, number] = [position.coords.latitude, position.coords.longitude]; onSetUserLocation(userCoords); if (mapInstanceRef.current) { mapInstanceRef.current.flyTo(userCoords, LOCATION_FOUND_ZOOM); if (userMarkerRef.current) userMarkerRef.current.setLatLng(userCoords); } setDisplayCoords({ lat: userCoords[0], lng: userCoords[1] }); setError(null); setLoadingLocation(false); }, (geoError: GeolocationPositionError) => { clearTimeout(locationTimeout); let errorMessage = 'Using default location. Enable GPS for accuracy.'; if (geoError.code === geoError.PERMISSION_DENIED) { errorMessage = 'Location access denied. Enable it for full functionality.'; } setError(errorMessage); setLoadingLocation(false); }, { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 } ); return () => clearTimeout(locationTimeout); }, [onSetUserLocation]);
  useEffect(() => { if (isVisible && mapInstanceRef.current) { setTimeout(() => mapInstanceRef.current.invalidateSize(), 100); } }, [isVisible]);
  useEffect(() => { if (mapInstanceRef.current && activeFilter && campusZones[activeFilter]) { const zone = campusZones[activeFilter]; mapInstanceRef.current.flyTo(zone.coords, zone.zoom); } }, [activeFilter, campusZones]);
  useEffect(() => { const map = mapInstanceRef.current; if (!map) return; const handleClick = (e: any) => { if (!isCreateMode || !userLocation) return; const clickLatLng = e.latlng; const userLatLng = L.latLng(userLocation[0], userLocation[1]); if (userLatLng.distanceTo(clickLatLng) <= CREATE_RADIUS_METERS) { onMapClick({ lat: clickLatLng.lat, lng: clickLatLng.lng }); } else { alert("Please select a location within the 5km radius."); } }; map.on('click', handleClick); return () => { map.off('click', handleClick); }; }, [isCreateMode, onMapClick, userLocation]);
  
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !mapRef.current) return;

    if (isCreateMode && userLocation) {
        if (!radiusCircleRef.current) {
            radiusCircleRef.current = L.circle(userLocation, {
                radius: CREATE_RADIUS_METERS,
                color: '#a855f7',
                fillColor: '#c084fc',
                fillOpacity: 0.1,
                weight: 2,
            }).addTo(map);
        }
        mapRef.current.style.cursor = 'crosshair';
    } else {
        if (radiusCircleRef.current) {
            radiusCircleRef.current.remove();
            radiusCircleRef.current = null;
        }
        mapRef.current.style.cursor = '';
        map.dragging.enable();
        map.touchZoom.enable();
        map.doubleClickZoom.enable();
        map.scrollWheelZoom.enable();
    }
  }, [isCreateMode, userLocation]);

  useEffect(() => {
    const layer = eventsLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map) return;

    layer.clearLayers();
    
    events.slice(0, 50).forEach(event => {
        const startTime = new Date(event.event_time).getTime(); 
        const endTime = startTime + event.duration * 60 * 1000; 
        const nowTime = Date.now();
        if (event.status !== 'active' || nowTime > endTime) return;
        if (event.sessionType === 'borrow' && nowTime > (startTime + 30 * 60 * 1000) && event.participants.length <= 1) return;

        const isScheduled = startTime > nowTime; 
        const isActive = !isScheduled; 

        const participantCount = event.participants?.length || 1;
        const markerSize = Math.min(40 + (participantCount - 1) * 4, 60);
        
        // SIMPLIFIED MARKER HTML FOR STABILITY
        let markerHtml = `<div class="emoji-container" style="font-size: ${markerSize * 0.7}px; text-align: center; line-height: ${markerSize}px;">${event.emoji}</div>`;

        const iconClasses = ['event-marker'];
        if (isActive) iconClasses.push('active'); else iconClasses.push('scheduled');
        if (event.privacy === 'private') iconClasses.push('private-marker');

        const eventIcon = L.divIcon({
          className: iconClasses.join(' '),
          html: markerHtml,
          iconSize: [markerSize, markerSize],
          iconAnchor: [markerSize / 2, markerSize / 2],
        });
        const eventMarker = L.marker([event.lat, event.lng], { icon: eventIcon }).addTo(layer);
        
        eventMarker.bindPopup(() => {
            // Access latest props via ref to avoid stale closures and massive dependency array
            const { onExtendEvent, onCloseEvent, onJoinVibe, onViewChat, user, friends, activeVibe } = propsRef.current;
            
            const popupNode = document.createElement('div');
            popupNode.className = "p-1 font-sans";
            
            const popupNow = new Date();
            const popupNowTime = popupNow.getTime();
            let avatarsHtml = event.participants?.map(pId => generateAvatar(pId, friends, user, event)).join('') ?? '';

            const isUserJoined = event.participants.includes(user.id);
            const timeStatusHtml = formatPopupTime(event, popupNow, isUserJoined);
            
            let cookieScoreHtml = '';
            if (event.sessionType === 'cookie' && event.skillTag) {
                const creatorProfile = event.creator_id === user.id ? user.profile : friends.find(f => f.id === event.creator_id);
                const score = creatorProfile ? creatorProfile.cookieScore : '??';
                cookieScoreHtml = `<div class="mt-1 text-sm text-yellow-600 font-semibold">Creator's Score (${event.skillTag}): 🍪 ${score}</div>`;
            }

            let borrowInfoHtml = '';
            if (event.sessionType === 'borrow') {
                const urgencyColors = { Low: 'text-green-600', Medium: 'text-yellow-600', High: 'text-red-600' };
                const urgencyColor = event.urgency ? urgencyColors[event.urgency] : 'text-gray-500';
                const autoCloseTime = new Date(event.event_time).getTime() + 30 * 60 * 1000;
                const minutesToAutoClose = (autoCloseTime - popupNowTime) / 60000;
                const returnTimeDate = event.returnTime ? new Date(event.returnTime) : null;

                borrowInfoHtml += `<div class="mt-2 text-sm space-y-1">`;
                if (event.urgency) { borrowInfoHtml += `<div><span class="font-semibold">Urgency:</span> <span class="font-bold ${urgencyColor}">${event.urgency}</span></div>`; }
                if (returnTimeDate) { borrowInfoHtml += `<div><span class="font-semibold">Return by:</span> ${returnTimeDate.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>`; }
                if (minutesToAutoClose > 0 && event.participants.length <= 1) { borrowInfoHtml += `<div class="text-xs text-red-500 font-semibold">Auto-closes in ${Math.round(minutesToAutoClose)}m</div>`; }
                borrowInfoHtml += `</div>`;
            }

            popupNode.innerHTML = `<h3 class="font-bold text-lg text-purple-800 flex items-center gap-2">${event.title}</h3> ${event.description ? `<p class="text-gray-700 my-1">${event.description}</p>` : ''} ${cookieScoreHtml} ${borrowInfoHtml} <div class="flex items-center justify-between mt-2"> <div class="participant-avatars">${avatarsHtml}</div> ${timeStatusHtml} </div>`;
            
            const controlsContainer = document.createElement('div');
            controlsContainer.className = "mt-2 pt-2 border-t border-gray-200 flex flex-wrap items-center gap-2";

            if (user.id === event.creator_id) {
                const extend5mButton = document.createElement('button'); extend5mButton.className = "text-xs bg-green-100 text-green-800 font-semibold px-2 py-1 rounded hover:bg-green-200 transition-colors"; extend5mButton.innerText = "+5m"; controlsContainer.appendChild(extend5mButton); L.DomEvent.on(extend5mButton, 'click', () => { onExtendEvent(event.id, 5); map.closePopup(); });
                const extend15mButton = document.createElement('button'); extend15mButton.className = "text-xs bg-green-100 text-green-800 font-semibold px-2 py-1 rounded hover:bg-green-200 transition-colors"; extend15mButton.innerText = "+15m"; controlsContainer.appendChild(extend15mButton); L.DomEvent.on(extend15mButton, 'click', () => { onExtendEvent(event.id, 15); map.closePopup(); });
                const closeButton = document.createElement('button'); closeButton.className = "text-xs bg-red-100 text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-200 transition-colors ml-auto"; closeButton.innerText = "Close"; controlsContainer.appendChild(closeButton); L.DomEvent.on(closeButton, 'click', () => { onCloseEvent(event.id); map.closePopup(); });
            }

            if (event.participants?.includes(user.id)) {
                const viewChatButton = document.createElement('button');
                viewChatButton.className = "w-full text-center font-bold bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors";
                viewChatButton.innerText = "View Chat"; controlsContainer.appendChild(viewChatButton);
                L.DomEvent.on(viewChatButton, 'click', () => { onJoinVibe(event.id); onViewChat(); map.closePopup(); });
            } else {
                const cannotJoin = !!activeVibe;
                let disabledTooltip = '';
                if (activeVibe) disabledTooltip = "You are already in another session.";

                const createJoinButton = (text: string, role: 'seeking' | 'offering' | 'participant' | 'giver', primary = true) => {
                    const button = document.createElement('button');
                    button.className = `w-full text-center font-bold px-3 py-2 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${primary ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`;
                    button.disabled = cannotJoin;
                    button.title = cannotJoin ? disabledTooltip : '';
                    button.innerText = text;
                    if (!cannotJoin) { L.DomEvent.on(button, 'click', () => { onJoinVibe(event.id, role); map.closePopup(); }); }
                    return button;
                };

                if (event.sessionType === 'borrow') {
                    controlsContainer.appendChild(createJoinButton('Offer Item', 'giver'));
                } else if (event.sessionType === 'seek') {
                    controlsContainer.appendChild(createJoinButton('Offer Help', 'offering'));
                    controlsContainer.appendChild(createJoinButton('I also need help', 'seeking', false));
                } else {
                    const joinText = event.sessionType === 'cookie' ? 'Join to Learn' : 'Join Vibe';
                    controlsContainer.appendChild(createJoinButton(joinText, 'participant'));
                }
            }
            
            if(controlsContainer.hasChildNodes()) popupNode.appendChild(controlsContainer);
            return popupNode;
        });
    });
  }, [events]); // This effect now ONLY depends on the events data, ensuring maximum stability.

  return (
    <div className="relative w-full h-full bg-[--color-bg-tertiary] z-0">
      <div ref={mapRef} className="w-full h-full" role="application" aria-label="Interactive map" />
      {error && ( <p className="absolute top-20 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-md text-center text-sm text-yellow-800 dark:text-yellow-200 bg-yellow-100 dark:bg-yellow-500/20 p-3 rounded-lg shadow-md" role="alert">{error}</p>)}
      <div className="absolute bottom-20 left-4 z-[1000] p-3 bg-[--color-bg-primary]/80 backdrop-blur-sm rounded-lg shadow-md">
        {loadingLocation ? ( <p className="text-[--color-text-secondary] font-semibold text-sm animate-pulse">Finding you...</p> ) : ( <div> <p className="text-[--color-text-primary] font-mono text-xs">Lat: {displayCoords.lat.toFixed(4)}</p> <p className="text-[--color-text-primary] font-mono text-xs">Lon: {displayCoords.lng.toFixed(4)}</p> </div> )}
      </div>
    </div>
  );
});

export default React.memo(MapView);
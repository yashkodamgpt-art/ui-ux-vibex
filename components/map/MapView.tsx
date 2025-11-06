import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import type { Session, User } from '../../types';
import type { CampusZoneName } from '../filters/FilterChipBar';

declare const L: any;

const IITGN_COORDS: [number, number] = [23.1925, 72.6844];
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
  activeVibe: Session | null;
  onCloseEvent: (eventId: number) => void;
  onExtendEvent: (eventId: number, minutes: number) => void;
  onJoinVibe: (eventId: number) => void;
  onViewChat: () => void;
  isVisible: boolean;
  activeFilter: CampusZoneName;
  campusZones: { [key in CampusZoneName]: { coords: [number, number]; zoom: number; radius: number } };
}

export interface MapViewRef {
  recenter: () => void;
}

// --- HELPER FUNCTIONS ---

function formatRemainingTime(minutes: number): string {
    if (minutes < 1) return 'Ending soon';
    if (minutes < 60) return `Ends in ${Math.round(minutes)}m`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `Ends in ${hours}h ${mins}m`;
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
}

const generateAvatar = (participantId: string, username?: string): string => {
    const initial = (username || participantId).charAt(0).toUpperCase();
    const color = stringToColor(participantId);
    return `<div class="avatar-circle" style="background-color: ${color};">${initial}</div>`;
};


const MapView = forwardRef<MapViewRef, MapViewProps>(({ isCreateMode, userLocation, onSetUserLocation, onMapClick, events, user, activeVibe, onCloseEvent, onExtendEvent, onJoinVibe, onViewChat, isVisible, activeFilter, campusZones }, ref) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const eventsLayerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const [now, setNow] = useState(() => new Date());

  const [displayCoords, setDisplayCoords] = useState<{ lat: number; lng: number }>({ lat: IITGN_COORDS[0], lng: IITGN_COORDS[1] });
  const [error, setError] = useState<string | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);

  useImperativeHandle(ref, () => ({
    recenter: () => {
      if (mapInstanceRef.current && userLocation) {
        mapInstanceRef.current.flyTo(userLocation, LOCATION_FOUND_ZOOM);
      }
    }
  }));

  useEffect(() => {
      const timerId = setInterval(() => setNow(new Date()), 60000);
      return () => clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!mapRef.current || typeof L === 'undefined') {
        console.error("MapView: Leaflet library (L) is not defined or map container is not available.");
        setError("Map could not be loaded.");
        return;
    }
    const map = L.map(mapRef.current, { center: IITGN_COORDS, zoom: INITIAL_ZOOM, zoomControl: false, preferCanvas: true });
    mapInstanceRef.current = map;
    
    L.control.zoom({ position: 'topright' }).addTo(map);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      keepBuffer: 2,
    }).addTo(map);
    L.control.scale({ position: 'bottomright' }).addTo(map);

    userMarkerRef.current = L.marker(IITGN_COORDS).addTo(map);
    eventsLayerRef.current = L.layerGroup().addTo(map);
    
    setTimeout(() => map.invalidateSize(), 100);

    return () => { map.remove(); };
  }, []);

  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    setLoadingLocation(true);
    setError(null);

    const locationTimeout = setTimeout(() => {
        setError('Could not get your location in time. Showing default location.');
        setLoadingLocation(false);
    }, 5000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(locationTimeout);
        const userCoords: [number, number] = [position.coords.latitude, position.coords.longitude];
        onSetUserLocation(userCoords);

        if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(userCoords, LOCATION_FOUND_ZOOM);
            if (userMarkerRef.current) userMarkerRef.current.setLatLng(userCoords);
        }
        setDisplayCoords({ lat: userCoords[0], lng: userCoords[1] });
        setError(null);
        setLoadingLocation(false);
      },
      (geoError: GeolocationPositionError) => {
        clearTimeout(locationTimeout);
        let errorMessage = 'Unable to retrieve your location.';
        if (geoError.code === geoError.PERMISSION_DENIED) {
          errorMessage = 'Location access denied. Please enable it in your browser settings.';
        }
        setError(errorMessage);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 30000 }
    );

    return () => clearTimeout(locationTimeout);
  }, [onSetUserLocation]);

  useEffect(() => {
    if (isVisible && mapInstanceRef.current) {
      setTimeout(() => mapInstanceRef.current.invalidateSize(), 100);
    }
  }, [isVisible]);

  useEffect(() => {
      if (mapInstanceRef.current && activeFilter && campusZones[activeFilter]) {
          const zone = campusZones[activeFilter];
          mapInstanceRef.current.flyTo(zone.coords, zone.zoom);
      }
  }, [activeFilter, campusZones]);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: any) => {
      if (!isCreateMode || !userLocation) return;
      
      const clickLatLng = e.latlng;
      const userLatLng = L.latLng(userLocation[0], userLocation[1]);

      if (userLatLng.distanceTo(clickLatLng) <= CREATE_RADIUS_METERS) {
        onMapClick({ lat: clickLatLng.lat, lng: clickLatLng.lng });
      } else {
        alert("Please select a location within the 5km radius.");
      }
    };

    map.on('click', handleClick);
    return () => { map.off('click', handleClick); };
  }, [isCreateMode, onMapClick, userLocation]);

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
    }
  }, [isCreateMode, userLocation]);

  useEffect(() => {
    const layer = eventsLayerRef.current;
    const map = mapInstanceRef.current;
    if (!layer || !map || !user) return;

    layer.clearLayers();
    
    events.forEach(event => {
        const startTime = new Date(event.event_time).getTime();
        const endTime = startTime + event.duration * 60 * 1000;
        const nowTime = now.getTime();

        if (event.status !== 'active' || nowTime > endTime) return;

        const isScheduled = startTime > nowTime;
        const isActive = !isScheduled;
        const minutesToStart = (startTime - nowTime) / 60000;

        if (isScheduled && minutesToStart <= 5) return;

        const participantCount = event.participants?.length || 1;
        const markerSize = Math.min(32 + (participantCount - 1) * 4, 56);

        let markerHtml = `<div class="emoji-container" style="font-size: ${markerSize * 0.7}px; text-align: center; line-height: ${markerSize}px;">${event.emoji}</div>`;
        if (isActive) {
            markerHtml += '<div class="active-indicator"></div>';
        } else {
            markerHtml += `<div class="countdown-timer">Starts in ${Math.round(minutesToStart)}m</div>`;
        }

        if (event.privacy === 'private') {
            markerHtml += '<div class="private-indicator">🔒</div>';
        }

        const eventIcon = L.divIcon({
            className: `event-marker ${isActive ? 'active' : 'scheduled'}`,
            html: markerHtml,
            iconSize: [markerSize, markerSize],
        });
      
        const eventMarker = L.marker([event.lat, event.lng], { icon: eventIcon }).addTo(layer);
        
        const popupNode = document.createElement('div');
        popupNode.className = "p-1 font-sans";

        let avatarsHtml = event.participants.map(pId => generateAvatar(pId, pId === event.creator_id ? event.creator.username : undefined)).join('');

        let timeStatusHtml = '';
        if (isActive) {
            if (event.participants.includes(user.id)) {
                const minutesToEnd = (endTime - nowTime) / 60000;
                timeStatusHtml = `<p class="text-sm font-bold text-green-600">${formatRemainingTime(minutesToEnd)}</p>`;
            } else {
                timeStatusHtml = `<p class="text-xs text-gray-500">Ends at: ${new Date(endTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>`;
            }
        } else {
            timeStatusHtml = `<p class="text-xs text-gray-500">Starts at: ${new Date(startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>`;
        }
        
        const isGenderFiltered = event.genderFilter === 'same_gender';

        popupNode.innerHTML = `
            <h3 class="font-bold text-lg text-purple-800 flex items-center gap-2">${event.title} ${isGenderFiltered ? '<span title="Same gender only">⚧️</span>' : ''}</h3>
            ${event.description ? `<p class="text-gray-700 my-1">${event.description}</p>` : ''}
            <div class="flex items-center justify-between mt-2">
                <div class="participant-avatars">${avatarsHtml}</div>
                ${timeStatusHtml}
            </div>
        `;
        
        const controlsContainer = document.createElement('div');
        controlsContainer.className = "mt-2 pt-2 border-t border-gray-200 flex flex-wrap items-center gap-2";

        if (user.id === event.creator_id) {
            const extend5mButton = document.createElement('button');
            extend5mButton.className = "text-xs bg-green-100 text-green-800 font-semibold px-2 py-1 rounded hover:bg-green-200 transition-colors";
            extend5mButton.innerText = "+5m";
            controlsContainer.appendChild(extend5mButton);
            L.DomEvent.on(extend5mButton, 'click', () => { onExtendEvent(event.id, 5); map.closePopup(); });
            
            const extend15mButton = document.createElement('button');
            extend15mButton.className = "text-xs bg-green-100 text-green-800 font-semibold px-2 py-1 rounded hover:bg-green-200 transition-colors";
            extend15mButton.innerText = "+15m";
            controlsContainer.appendChild(extend15mButton);
            L.DomEvent.on(extend15mButton, 'click', () => { onExtendEvent(event.id, 15); map.closePopup(); });

            const closeButton = document.createElement('button');
            closeButton.className = "text-xs bg-red-100 text-red-800 font-semibold px-2 py-1 rounded hover:bg-red-200 transition-colors ml-auto";
            closeButton.innerText = "Close Vibe";
            controlsContainer.appendChild(closeButton);
            L.DomEvent.on(closeButton, 'click', () => { onCloseEvent(event.id); map.closePopup(); });
        }

        if (event.participants.includes(user.id)) {
            const viewChatButton = document.createElement('button');
            viewChatButton.className = "w-full text-center font-bold bg-purple-600 text-white px-3 py-2 rounded-lg hover:bg-purple-700 transition-colors";
            viewChatButton.innerText = "View Chat";
            controlsContainer.appendChild(viewChatButton);
            L.DomEvent.on(viewChatButton, 'click', () => { onJoinVibe(event.id); onViewChat(); map.closePopup(); });
        } else {
            const joinButton = document.createElement('button');
            joinButton.className = "w-full text-center font-bold bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed";
            
            const isGenderMismatch = isGenderFiltered && user.profile.gender !== event.creatorGender;
            // FIX: Coerce `activeVibe` to a boolean. The `||` operator returns the first truthy value,
            // which could be the `activeVibe` object itself, causing a type error for `joinButton.disabled`.
            const cannotJoin = !!activeVibe || isGenderMismatch;

            joinButton.disabled = cannotJoin;
            if (isGenderMismatch) {
                joinButton.innerText = "Same Gender Only";
            } else if (activeVibe) {
                joinButton.innerText = "In another Vibe";
            } else {
                joinButton.innerText = "Join Vibe";
            }

            controlsContainer.appendChild(joinButton);
            if (!cannotJoin) {
                L.DomEvent.on(joinButton, 'click', () => { onJoinVibe(event.id); map.closePopup(); });
            }
        }
        
        if(controlsContainer.hasChildNodes()) popupNode.appendChild(controlsContainer);
        eventMarker.bindPopup(popupNode);
    });
  }, [events, user, activeVibe, onCloseEvent, onExtendEvent, onJoinVibe, onViewChat, now]);

  return (
    <div className="relative w-full h-full bg-green-200 z-0">
      <div ref={mapRef} className="w-full h-full" role="application" aria-label="Interactive map" />
      
      {error && (
        <p className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] w-11/12 max-w-md text-center text-sm text-yellow-800 bg-yellow-100 p-3 rounded-lg shadow-md" role="alert">
          {error}
        </p>
      )}
      
      <div className="absolute bottom-20 left-4 z-[1000] p-3 bg-white/80 backdrop-blur-sm rounded-lg shadow-md">
        {loadingLocation ? (
          <p className="text-gray-700 font-semibold text-sm animate-pulse">Finding you...</p>
        ) : (
          <div>
            <p className="text-gray-900 font-mono text-xs">Lat: {displayCoords.lat.toFixed(4)}</p>
            <p className="text-gray-900 font-mono text-xs">Lon: {displayCoords.lng.toFixed(4)}</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default MapView;

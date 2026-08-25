import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Loja, CidadeInfo } from '../data/lojas';

interface MapaProps {
  lojas: Loja[];
  cidadeAtiva?: CidadeInfo | null;
  selectedLojaId?: string | null;
  onSelectLoja?: (id: string) => void;
  userLocation?: { lat: number; lng: number } | null;
}

export default function Mapa({
  lojas,
  cidadeAtiva,
  selectedLojaId,
  onSelectLoja,
  userLocation,
}: MapaProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const initialLat = cidadeAtiva?.lat ?? -3.119;
      const initialLng = cidadeAtiva?.lng ?? -60.021;
      const initialZoom = cidadeAtiva?.zoom ?? 12;

      const map = L.map(mapContainerRef.current, {
        center: [initialLat, initialLng],
        zoom: initialZoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Pan to city when active city changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !cidadeAtiva) return;

    map.flyTo([cidadeAtiva.lat, cidadeAtiva.lng], cidadeAtiva.zoom, {
      duration: 1.2,
    });
  }, [cidadeAtiva]);

  // Update store markers whenever lojas list or selectedLojaId changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    lojas.forEach((loja) => {
      const isSelected = loja.id === selectedLojaId;
      const isErvas = loja.categoria === 'Ervas & Plantas';
      const isProdutosNaturais = loja.categoria === 'Produtos Naturais';

      const pinColor = isSelected
        ? '#047857'
        : isErvas
        ? '#059669'
        : isProdutosNaturais
        ? '#0284c7'
        : '#d97706';

      const badgeIcon = isErvas ? '🌿' : isProdutosNaturais ? '🍃' : '🌾';

      const customDivIcon = L.divIcon({
        className: 'custom-leaflet-marker',
        html: `
          <div style="
            position: relative;
            width: ${isSelected ? '38px' : '32px'};
            height: ${isSelected ? '38px' : '32px'};
            background-color: ${pinColor};
            border-radius: 50% 50% 50% 0;
            transform: rotate(-45deg);
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,0,0,0.25);
            border: 2.5px solid white;
            transition: all 0.2s ease;
          ">
            <span style="
              transform: rotate(45deg);
              font-size: ${isSelected ? '16px' : '13px'};
              line-height: 1;
            ">${badgeIcon}</span>
          </div>
        `,
        iconSize: [isSelected ? 38 : 32, isSelected ? 38 : 32],
        iconAnchor: [isSelected ? 19 : 16, isSelected ? 38 : 32],
        popupAnchor: [0, isSelected ? -38 : -32],
      });

      const marker = L.marker([loja.lat, loja.lng], { icon: customDivIcon });

      const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `${loja.nome} ${loja.endereco}`
      )}`;

      const popupContent = document.createElement('div');
      popupContent.className = 'p-1 font-sans';
      popupContent.innerHTML = `
        <div style="min-width: 210px; max-width: 270px;">
          <div style="display: flex; align-items: center; justify-content: space-between; gap: 4px; margin-bottom: 4px;">
            <span style="background: ${isErvas ? '#d1fae5' : '#fef3c7'}; color: ${isErvas ? '#065f46' : '#92400e'}; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px;">
              ${loja.categoria}
            </span>
            <span style="color: #64748b; font-size: 10px; font-weight: 600;">${loja.cidade} - ${loja.uf}</span>
          </div>
          <h3 style="font-weight: 700; color: #0f172a; font-size: 13px; line-height: 1.3; margin: 0 0 4px 0;">
            ${loja.nome}
          </h3>
          <p style="font-size: 11px; color: #475569; margin: 0 0 6px 0; line-height: 1.35;">
            ${loja.endereco}
          </p>
          ${
            loja.distancia !== undefined
              ? `<div style="font-size: 11px; font-weight: 600; color: #047857; margin-bottom: 6px;">📍 ${loja.distancia} km de você</div>`
              : ''
          }
          <div style="display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 8px;">
            ${loja.destaques
              .map(
                (d) =>
                  `<span style="background: #f1f5f9; color: #334155; font-size: 10px; padding: 1px 5px; border-radius: 3px;">${d}</span>`
              )
              .join('')}
          </div>
          <a
            href="${googleMapsUrl}"
            target="_blank"
            rel="noopener noreferrer"
            style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; width: 100%; padding: 6px 10px; background: #059669; color: white; border-radius: 6px; font-size: 11px; font-weight: 600; text-decoration: none;"
          >
            Abrir Rota no Google Maps ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('click', () => {
        if (onSelectLoja) {
          onSelectLoja(loja.id);
        }
      });

      markersLayer.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    // If user has chosen a specific loja, pan to it
    if (selectedLojaId) {
      const selected = lojas.find((l) => l.id === selectedLojaId);
      if (selected) {
        map.flyTo([selected.lat, selected.lng], 15, { duration: 0.8 });
      }
    }
  }, [lojas, selectedLojaId, onSelectLoja]);

  // Handle user GPS location marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (userLocation) {
      if (userMarkerRef.current) {
        userMarkerRef.current.remove();
      }

      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div style="
            position: relative;
            width: 22px;
            height: 22px;
            background: #2563eb;
            border: 3px solid white;
            border-radius: 50%;
            box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.25);
          "></div>
        `,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
      });

      const userMarker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).bindPopup('<b>Você está aqui!</b>');

      userMarker.addTo(map);
      userMarkerRef.current = userMarker;
    }
  }, [userLocation]);

  return (
    <div className="relative h-[380px] sm:h-[430px] w-full rounded-2xl overflow-hidden border border-emerald-200/80 shadow-md">
      <div ref={mapContainerRef} className="h-full w-full z-0" />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 right-3 z-[400] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-xl shadow-md border border-slate-200 text-xs flex flex-col gap-1.5 pointer-events-auto">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-600 inline-block"></span>
          <span className="text-slate-700 font-medium">Ervas & Plantas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
          <span className="text-slate-700 font-medium">Empórios & Granel</span>
        </div>
        {userLocation && (
          <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
            <span className="w-3 h-3 rounded-full bg-blue-600 inline-block animate-pulse"></span>
            <span className="text-blue-700 font-medium">Sua Posição GPS</span>
          </div>
        )}
      </div>
    </div>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as L from 'leaflet';
import { ArrowUpRight, LocateFixed, RefreshCw, TrainFront, AlertTriangle } from 'lucide-react';
import {
  BOROUGH_VIEWS, distanceMiles, fetchRecent311, fetchStations,
  type GeoBounds, type ServiceRequest, type SubwayStation,
} from './nycData';
import 'leaflet/dist/leaflet.css';
import './nyc-map.css';

type Selection = { kind: 'station' | 'report'; id: string } | null;
type Viewport = { bounds: GeoBounds; center: [number, number]; zoom: number };

const INITIAL_CENTER: [number, number] = [40.714, -73.987];
const INITIAL_BOUNDS: GeoBounds = { south: 40.68, west: -74.04, north: 40.75, east: -73.94 };

function getViewport(map: L.Map): Viewport {
  const bounds = map.getBounds();
  const center = map.getCenter();
  return {
    bounds: { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() },
    center: [center.lat, center.lng],
    zoom: map.getZoom(),
  };
}

function relativeDate(iso: string): string {
  if (!iso) return 'DATE NOT AVAILABLE';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso.slice(0, 10);
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function hasPoint(bounds: GeoBounds, lat: number, lon: number): boolean {
  return lat >= bounds.south && lat <= bounds.north && lon >= bounds.west && lon <= bounds.east;
}

export default function NYCMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const [viewport, setViewport] = useState<Viewport>({ bounds: INITIAL_BOUNDS, center: INITIAL_CENTER, zoom: 13 });
  const [stations, setStations] = useState<SubwayStation[]>([]);
  const [reports, setReports] = useState<ServiceRequest[]>([]);
  const [stationError, setStationError] = useState('');
  const [reportError, setReportError] = useState('');
  const [stationLoading, setStationLoading] = useState(true);
  const [reportLoading, setReportLoading] = useState(false);
  const [lastScanned, setLastScanned] = useState('');
  const [scanCenter, setScanCenter] = useState<[number, number] | null>(null);
  const [showStations, setShowStations] = useState(true);
  const [showReports, setShowReports] = useState(true);
  const [selection, setSelection] = useState<Selection>(null);

  const scanView = useCallback(async (map: L.Map) => {
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;
    const { bounds, center } = getViewport(map);
    setReportLoading(true);
    setReportError('');
    try {
      const result = await fetchRecent311(bounds, controller.signal);
      if (controller.signal.aborted) return;
      setReports(result);
      setLastScanned(new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }));
      setScanCenter(center);
      setSelection((current) => current?.kind === 'report' && !result.some((report) => report.id === current.id) ? null : current);
    } catch (error) {
      if (!controller.signal.aborted) {
        setReportError(error instanceof Error ? error.message : '311 FEED UNAVAILABLE');
        setReports([]);
        setLastScanned('');
        setScanCenter(null);
      }
    } finally {
      if (!controller.signal.aborted) setReportLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setStationLoading(true);
    fetchStations(controller.signal).then((result) => {
      if (!controller.signal.aborted) {
        setStations(result);
        setStationError(result.length ? '' : 'STATION FEED RETURNED NO LOCATIONS');
      }
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setStationError(error instanceof Error ? error.message : 'STATION FEED UNAVAILABLE');
    }).finally(() => {
      if (!controller.signal.aborted) setStationLoading(false);
    });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = L.map(containerRef.current, {
      zoomControl: true,
      scrollWheelZoom: false,
      minZoom: 10,
      maxZoom: 18,
      maxBounds: [[40.46, -74.35], [40.96, -73.64]],
      maxBoundsViscosity: 0.8,
    }).setView(INITIAL_CENTER, 13);
    mapRef.current = map;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>',
      maxZoom: 19,
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    const onMove = () => setViewport(getViewport(map));
    map.on('moveend', onMove);
    onMove();
    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize();
      void scanView(map);
    });
    return () => {
      window.cancelAnimationFrame(frame);
      requestRef.current?.abort();
      map.off('moveend', onMove);
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [scanView]);

  const visibleStations = useMemo(
    () => stations.filter((station) => hasPoint(viewport.bounds, station.latitude, station.longitude)),
    [stations, viewport.bounds],
  );
  const nearestStations = useMemo(
    () => stations.map((station) => ({
      station,
      miles: distanceMiles(viewport.center, [station.latitude, station.longitude]),
    })).sort((a, b) => a.miles - b.miles).slice(0, 3),
    [stations, viewport.center],
  );

  useEffect(() => {
    const group = layerRef.current;
    if (!group) return;
    group.clearLayers();

    if (showStations && viewport.zoom >= 12) {
      visibleStations.slice(0, 180).forEach((station) => {
        const active = selection?.kind === 'station' && selection.id === station.id;
        L.circleMarker([station.latitude, station.longitude], {
          radius: active ? 8 : 5,
          color: active ? '#f8e1a0' : '#b8f589',
          fillColor: '#123c25',
          fillOpacity: 0.95,
          weight: active ? 3 : 1.5,
        }).addTo(group).on('click', () => setSelection({ kind: 'station', id: station.id }));
      });
    }

    if (showReports) {
      reports.forEach((report) => {
        const active = selection?.kind === 'report' && selection.id === report.id;
        L.circleMarker([report.latitude, report.longitude], {
          radius: active ? 7 : 4,
          color: active ? '#ffe3a1' : '#f7b45b',
          fillColor: active ? '#f7b45b' : '#7f4b28',
          fillOpacity: 0.85,
          weight: active ? 3 : 1,
        }).addTo(group).on('click', () => setSelection({ kind: 'report', id: report.id }));
      });
    }
  }, [showStations, showReports, visibleStations, reports, selection, viewport.zoom]);

  const selectedStation = selection?.kind === 'station' ? stations.find((s) => s.id === selection.id) : undefined;
  const selectedReport = selection?.kind === 'report' ? reports.find((r) => r.id === selection.id) : undefined;
  const scanOutdated = scanCenter !== null && distanceMiles(scanCenter, viewport.center) > 0.35;
  const nearest = nearestStations[0];

  const flyTo = (latitude: number, longitude: number, zoom = 15) => {
    mapRef.current?.flyTo([latitude, longitude], zoom, { duration: 0.7 });
  };
  const chooseStation = (station: SubwayStation) => {
    setSelection({ kind: 'station', id: station.id });
    flyTo(station.latitude, station.longitude);
  };
  const chooseReport = (report: ServiceRequest) => {
    setSelection({ kind: 'report', id: report.id });
    flyTo(report.latitude, report.longitude);
  };

  return (
    <div className="nyc-map-widget">
      <div className="nyc-map-toolbar">
        <span className="nyc-map-kicker">NYC / 5 BOROUGHS</span>
        <div className="nyc-boroughs" aria-label="Jump to a New York City borough">
          {BOROUGH_VIEWS.map((area) => (
            <button key={area.name} type="button" onClick={() => {
              setSelection(null);
              mapRef.current?.flyTo(area.center, area.zoom, { duration: 0.8 });
            }}>{area.name === 'Staten Island' ? 'STATEN IS.' : area.name.toUpperCase()}</button>
          ))}
        </div>
      </div>

      <div className="nyc-map-main">
        <div className="nyc-map-frame">
          <div ref={containerRef} className="nyc-leaflet" role="region" aria-label="Interactive street map of New York City" />
          <div className="nyc-map-coordinate">LAT {viewport.center[0].toFixed(4)} / LON {viewport.center[1].toFixed(4)} <span>ZOOM {viewport.zoom}</span></div>
        </div>
        <aside className="nyc-map-intel" aria-label="NYC map information">
          <div className="nyc-intel-title"><span>FIELD INTELLIGENCE</span><LocateFixed size={15}/></div>
          <div className="nyc-layer-row">
            <button type="button" aria-pressed={showStations} className={showStations ? 'active' : ''} onClick={() => setShowStations(!showStations)}><TrainFront size={13}/> SUBWAY</button>
            <button type="button" aria-pressed={showReports} className={showReports ? 'active warning' : ''} onClick={() => setShowReports(!showReports)}><AlertTriangle size={13}/> 311</button>
          </div>
          <div className="nyc-map-intel-scroll">
            <div className="nyc-intel-box">
              <span>NEAREST SUBWAY TO MAP CENTER</span>
              <strong>{stationLoading ? 'SCANNING STATIONS…' : nearest ? nearest.station.name : 'NO STATION DATA'}</strong>
              <small>{nearest ? nearest.miles.toFixed(2) + ' MI · STRAIGHT-LINE DISTANCE · ' + nearest.station.routes : stationError || 'MTA STATION LOCATIONS'}</small>
            </div>

            {(selectedStation || selectedReport) && (
              <div className="nyc-intel-selected">
                <div className="nyc-intel-label">SELECTED {selectedStation ? 'STATION' : '311 REQUEST'} <button type="button" onClick={() => setSelection(null)} aria-label="Clear map selection">×</button></div>
                {selectedStation ? (
                  <>
                    <h3>{selectedStation.name}</h3>
                    <p>ROUTES: {selectedStation.routes}</p>
                    <p>ACCESSIBILITY: {selectedStation.accessible === true ? 'ADA ACCESS LISTED' : selectedStation.accessible === false ? 'NOT MARKED FULLY ACCESSIBLE' : 'CHECK MTA DETAILS'}</p>
                    <p>DATA: MTA STATION CATALOG · NOT LIVE ARRIVALS</p>
                  </>
                ) : selectedReport ? (
                  <>
                    <h3>{selectedReport.type}</h3>
                    <p>{selectedReport.detail || selectedReport.address}</p>
                    <p>{selectedReport.address}</p>
                    <p>STATUS: {selectedReport.status}</p>
                    <p>REPORTED: {relativeDate(selectedReport.created)}</p>
                  </>
                ) : null}
              </div>
            )}

            <div className="nyc-scan-heading"><span>RECENT 311 REPORTS</span><button type="button" onClick={() => { if (mapRef.current) void scanView(mapRef.current); }} disabled={reportLoading}><RefreshCw size={13} className={reportLoading ? 'nyc-spinning' : ''}/> SCAN VIEW</button></div>
            <div className="nyc-feed-caption">{reportLoading ? 'FETCHING CITY DATA…' : reportError || (lastScanned ? reports.length + ' MOST RECENT REPORTS IN VIEW · SCANNED ' + lastScanned : 'SCANNING NYC 311…')}</div>
            {scanOutdated && <div className="nyc-map-warning">MAP MOVED · RESCAN FOR THIS AREA</div>}
            {reports.length > 0 ? (
              <div className="nyc-report-list">
                {reports.slice(0, 5).map((report) => (
                  <button type="button" key={report.id} onClick={() => chooseReport(report)} className={selection?.kind === 'report' && selection.id === report.id ? 'active' : ''}>
                    <span>{report.type}</span><small>{relativeDate(report.created)} · {report.status}</small>
                  </button>
                ))}
              </div>
            ) : !reportLoading && !reportError ? <p className="nyc-no-results">NO RECENT GEOLOCATED 311 REPORTS RETURNED.</p> : null}
            <div className="nyc-scan-heading"><span>NEARBY STATIONS</span><span>{visibleStations.length} IN VIEW</span></div>
            {stationError && <div className="nyc-map-warning">{stationError}</div>}
            {viewport.zoom < 12 && <p className="nyc-no-results">ZOOM IN TO SEE SUBWAY PINS.</p>}
            {nearestStations.map(({station,miles}) => (
              <button type="button" className="nyc-nearest" key={station.id} onClick={() => chooseStation(station)}>
                <span><TrainFront size={12}/> {station.name}</span><small>{miles.toFixed(2)} MI</small>
              </button>
            ))}
            <p className="nyc-disclosure">311 REPORTS ARE A LIMITED SAMPLE FROM THE LAST 7 DAYS, NOT A CRIME OR SAFETY SCORE. PUBLIC DATA CAN LAG. SUBWAY STATIONS ARE NOT LIVE ARRIVALS.</p>
            <div className="nyc-sources">
              <a href="https://data.cityofnewyork.us/d/erm2-nwe9" target="_blank" rel="noopener noreferrer">NYC OPEN DATA <ArrowUpRight size={11}/></a>
              <a href="https://data.ny.gov/d/39hk-dx4f" target="_blank" rel="noopener noreferrer">MTA STATIONS <ArrowUpRight size={11}/></a>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

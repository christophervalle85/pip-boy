import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowDownToLine, CarFront, Check, ChevronRight,
  Crosshair, Headphones, KeyRound, Laptop, Minus, Pause, Play, Power, Radio, RotateCcw,
  Package, PackageSearch, Pencil, Plus, ScanFace, Settings2, Trash2, Unlock, Volume2, Wallet,
} from 'lucide-react';
import {
  initialGame, loadGame, saveGame, special, stations,
  type GameState, type Item, type Tab,
} from './data';
import BootScreen, { BOOT_CHECKS } from './BootScreen';
import NYCMap from './NYCMap';
import InventoryEditor from './InventoryEditor';
import PipBoyImported3D from './PipBoyImported3D';
import WandererMascot from './WandererMascot';
import { useDeviceAudio } from './device-audio';
import './device-effects.css';

const TABS: Tab[] = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO'];
const FILTERS = ['ALL', 'TECH', 'PERSONAL', 'KEYS', 'OTHER'] as const;
type PowerState = 'booting' | 'ready' | 'off';
type EditorState = { mode: 'add' } | { mode: 'edit'; id: string; confirmRemove?: boolean };
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

function InventoryIcon({ item }: { item: Item }) {
  const props = { size: 100, strokeWidth: 1.1 };
  if (item.id.startsWith('macbook')) return <Laptop {...props} />;
  if (item.id === 'wallet') return <Wallet {...props} />;
  if (item.id === 'car-keys') return <CarFront {...props} />;
  if (item.id === 'house-key') return <KeyRound {...props} />;
  if (item.id === 'airpods') return <Headphones {...props} />;
  if (item.category === 'TECH') return <Laptop {...props} />;
  if (item.category === 'KEYS') return <KeyRound {...props} />;
  return <Package {...props} />;
}

function Meter({ label, value, max, suffix = '', small = false }: {
  label: string; value: number; max: number; suffix?: string; small?: boolean;
}) {
  return (
    <div className={`meter ${small ? 'meter-small' : ''}`}>
      <div className="meter-label"><span>{label}</span><strong>{value}{suffix} <em>/ {max}{suffix}</em></strong></div>
      <div className="meter-track"><div className="meter-fill" style={{ width: `${clamp((value / max) * 100, 0, 100)}%` }} /></div>
    </div>
  );
}

function SignalBars() { return <span className="signal-bars" aria-label="Strong signal"><i/><i/><i/><i/><i/></span>; }

function useRadio() {
  const audio = useRef<{ context: AudioContext; gain: GainNode; timer: ReturnType<typeof setInterval> } | null>(null);
  const [playing, setPlaying] = useState(false);
  const [station, setStation] = useState(stations[0].id);
  const [volume, setVolume] = useState(35);

  const stop = useCallback(() => {
    const active = audio.current;
    if (active) {
      clearInterval(active.timer);
      void active.context.close();
      audio.current = null;
    }
  }, []);

  const start = useCallback((stationId: string, level: number) => {
    stop();
    try {
      const context = new AudioContext();
      void context.resume();
      const master = context.createGain();
      master.gain.value = (level / 100) * 0.14;
      master.connect(context.destination);
      const stationData = stations.find((entry) => entry.id === stationId) ?? stations[0];
      const voice = context.createOscillator();
      const harmony = context.createOscillator();
      const harmonicGain = context.createGain();
      voice.type = 'sine';
      harmony.type = 'triangle';
      voice.frequency.value = stationData.note;
      harmony.frequency.value = stationData.note * 1.5;
      harmonicGain.gain.value = 0.24;
      voice.connect(master);
      harmony.connect(harmonicGain);
      harmonicGain.connect(master);
      voice.start();
      harmony.start();
      let beat = 0;
      const notes = stationId === 'echo' ? [1, 1.01, 0.75, 0.75] : stationId === 'mojave' ? [1, 1.25, 1.5, 1.25] : [1, 1.125, 1.333, 1.125];
      const timer = setInterval(() => {
        beat += 1;
        const pitch = stationData.note * notes[beat % notes.length];
        voice.frequency.setTargetAtTime(pitch, context.currentTime, 0.18);
        harmony.frequency.setTargetAtTime(pitch * 1.5, context.currentTime, 0.22);
      }, stationId === 'echo' ? 850 : 1300);
      audio.current = { context, gain: master, timer };
    } catch {
      setPlaying(false);
    }
  }, [stop]);

  useEffect(() => {
    if (playing) start(station, volume);
    else stop();
    return stop;
    // The volume is adjusted live by the separate effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [station, playing, start, stop]);

  useEffect(() => {
    if (audio.current) audio.current.gain.gain.setTargetAtTime((volume / 100) * 0.14, audio.current.context.currentTime, 0.05);
  }, [volume]);

  return { station, setStation, volume, setVolume, playing, setPlaying };
}

export default function App() {
  const [tab, setTab] = useState<Tab>('STAT');
  const [game, setGame] = useState<GameState>(loadGame);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL');
  const [selectedItem, setSelectedItem] = useState('macbook-1');
  const [selectedQuest, setSelectedQuest] = useState('signals');
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [amber, setAmber] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [powerState, setPowerState] = useState<PowerState>('booting');
  const [stabilized, setStabilized] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    try { return localStorage.getItem('pipboy-sfx-enabled') === 'true'; } catch { return false; }
  });
  const [crtMode, setCrtMode] = useState<'off' | 'subtle' | 'vivid'>(() => {
    try {
      const saved = localStorage.getItem('pipboy-crt-mode');
      return saved === 'off' || saved === 'vivid' ? saved : 'subtle';
    } catch { return 'subtle'; }
  });
  // This site is 3D-only. Never silently switch back to the old flat UI.
  const [webglAvailable] = useState(() => {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('webgl2');
      context?.getExtension('WEBGL_lose_context')?.loseContext();
      return Boolean(context);
    } catch {
      return false;
    }
  });
  const [bootStep, setBootStep] = useState(0);
  const [notice, setNotice] = useState('ALL SYSTEMS NOMINAL');
  const radio = useRadio();
  const playDeviceSound = useDeviceAudio(soundEnabled);
  const changeTab = useCallback((next: Tab) => {
    setTab(next);
    playDeviceSound('select');
  }, [playDeviceSound]);
  const tuneNextStation = useCallback(() => {
    const i = stations.findIndex((item) => item.id === radio.station);
    const next = stations[(i + 1) % stations.length];
    radio.setStation(next.id);
    setTab('RADIO');
    setNotice(`TUNED TO ${next.mhz} MHz`);
    playDeviceSound('dial');
  }, [radio.station, radio.setStation, playDeviceSound]);

  useEffect(() => saveGame(game), [game]);
  useEffect(() => {
    try {
      localStorage.setItem('pipboy-sfx-enabled', String(soundEnabled));
      localStorage.setItem('pipboy-crt-mode', crtMode);
    } catch { /* Private storage is optional. */ }
  }, [soundEnabled, crtMode]);
  useEffect(() => {
    if (powerState !== 'booting') return;
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setPowerState('ready');
      return;
    }
    const timers = BOOT_CHECKS.map((_, index) => window.setTimeout(() => setBootStep(index + 1), 560 + index * 390));
    const ready = window.setTimeout(() => {
      setPowerState('ready');
      setNotice('ALL SYSTEMS NOMINAL');
    }, 560 + BOOT_CHECKS.length * 390 + 500);
    return () => {
      timers.forEach(window.clearTimeout);
      window.clearTimeout(ready);
    };
  }, [powerState]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.altKey || event.metaKey || event.ctrlKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes((event.target as HTMLElement).tagName)) return;
      if (powerState === 'ready' && event.key >= '1' && event.key <= '5') changeTab(TABS[Number(event.key) - 1]);
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [powerState, changeTab]);

  const inform = (message: string) => setNotice(message);
  const items = game.inventory.filter((entry) => entry.count > 0 && (filter === 'ALL' || entry.category === filter));
  const currentItem = items.find((entry) => entry.id === selectedItem) ?? items[0];
  const editingItem = editor?.mode === 'edit' ? game.inventory.find((entry) => entry.id === editor.id) : undefined;
  const currentQuest = game.quests.find((entry) => entry.id === selectedQuest) ?? game.quests[0];
  const currentStation = stations.find((entry) => entry.id === radio.station) ?? stations[0];
  const itemCount = game.inventory.reduce((sum, item) => sum + item.count, 0);
  const cashOnHand = game.inventory.reduce((sum, item) => sum + (item.cash ?? 0), 0);
  const xpToLevel = 1000;

  const saveInventoryItem = (item: Item) => {
    const editing = editor?.mode === 'edit';
    setGame((old) => ({
      ...old,
      inventory: editing
        ? old.inventory.map((entry) => entry.id === item.id ? item : entry)
        : [...old.inventory, item],
    }));
    setSelectedItem(item.id);
    setFilter('ALL');
    setEditor(null);
    inform(editing ? 'INVENTORY ENTRY UPDATED' : 'NEW ITEM REGISTERED');
  };

  const deleteInventoryItem = (id: string) => {
    const remaining = game.inventory.filter((entry) => entry.id !== id);
    setGame((old) => ({ ...old, inventory: old.inventory.filter((entry) => entry.id !== id) }));
    setSelectedItem(remaining[0]?.id ?? '');
    setFilter('ALL');
    setEditor(null);
    inform('INVENTORY ENTRY REMOVED');
  };

  // Reboot only the CRT. Keep the physical 3D model and camera exactly where
  // the visitor left them—there is no separate cinematic introduction.
  const beginStartup = () => {
    radio.setPlaying(false);
    setSettingsOpen(false);
    setBootStep(0);
    setPowerState('booting');
    playDeviceSound('boot');
  };
  const reboot = () => beginStartup();
  const finishBoot = () => {
    setPowerState('ready');
    setNotice('ALL SYSTEMS NOMINAL');
  };
  const togglePower = () => {
    if (powerState === 'off') {
      beginStartup();
    } else {
      radio.setPlaying(false);
      setSettingsOpen(false);
      setPowerState('off');
      playDeviceSound('power');
    }
  };

  const reset = () => {
    setGame(structuredClone(initialGame));
    setSelectedItem('macbook-1');
    setFilter('ALL');
    setEditor(null);
    setSelectedQuest('signals');
    setSettingsOpen(false);
    inform('SAVE DATA RESET');
  };

  const display = (
            <div className={`screen screen-${powerState === 'ready' ? 'online' : powerState}`}>
              <div className="scanlines" aria-hidden="true" />
              {powerState === 'booting' && <BootScreen step={bootStep} onSkip={finishBoot} />}
              {powerState === 'off' && <div className="power-off-panel"><Power size={28}/><strong>DISPLAY OFFLINE</strong><p>PRESS THE POWER BUTTON TO RESTART</p><button type="button" onClick={togglePower}><Power size={14}/> POWER ON</button></div>}
              {powerState === 'ready' && (
              <div className="screen-content" key={tab}>
                <div className="screen-meta"><span>ROBCO INDUSTRIES (TM)</span><span className="meta-right"><SignalBars/> SECURE LINK ESTABLISHED</span></div>
                <nav className="tab-bar" aria-label="Pip-Boy main sections">
                  {TABS.map((item, index) => (
                    <button type="button" className={`tab ${item === tab ? 'active' : ''}`} key={item} onClick={() => changeTab(item)} aria-current={item === tab ? 'page' : undefined}><span>{item}</span><small>0{index + 1}</small></button>
                  ))}
                </nav>
                <div className="screen-heading"><div><span className="breadcrumb">PIP-BOY / {tab}</span><h1>{tab === 'STAT' ? 'PERSONNEL STATUS' : tab === 'INV' ? 'ITEM INVENTORY' : tab === 'DATA' ? 'QUEST DATABASE' : tab === 'MAP' ? 'NEW YORK CITY' : 'FREQUENCY TUNER'}</h1></div><span className="heading-side">{tab === 'STAT' ? `LVL ${String(game.character.level).padStart(2, '0')}` : tab === 'INV' ? `${items.length} LISTED` : tab === 'DATA' ? `${game.quests.filter((q) => !q.completed).length} ACTIVE` : tab === 'MAP' ? '5 BOROUGHS' : `${currentStation.mhz} MHz`}</span></div>
                <div className="workspace">
                  {tab === 'STAT' && <div className="stat-layout">
                    <div className="character-card"><div className="corner-label">FIELD OPERATIVE  //  #017</div><WandererMascot hp={game.character.hp} maxHp={game.character.maxHp} rads={game.character.rads}/><div className="person-label">THE WANDERER <span>• {game.character.hp > 0 ? 'ALIVE' : 'OFFLINE'}</span></div></div>
                    <div className="stat-main">
                      <div className="meter-stack"><Meter label="HIT POINTS" value={game.character.hp} max={game.character.maxHp}/><Meter label="ACTION POINTS" value={game.character.ap} max={110}/><Meter label="RADIATION" value={game.character.rads} max={1000}/></div>
                      <div className="triple-stats"><div><span>LEVEL</span><strong>{String(game.character.level).padStart(2, '0')}</strong></div><div><span>CAPS</span><strong>{game.character.caps}</strong></div><div><span>XP</span><strong>{game.character.xp}</strong></div></div>
                      <div className="mini-heading"><span>S.P.E.C.I.A.L. ATTRIBUTES</span><span>BASE VALUES</span></div>
                      <div className="special-grid">{special.map((entry) => <div key={entry.short} title={entry.name}><small>{entry.short}</small><strong>{entry.score}</strong></div>)}</div>
                      <div className="test-actions"><button type="button" onClick={() => { setGame((old) => ({ ...old, character: { ...old.character, hp: Math.max(0, old.character.hp - 25) } })); inform('SIMULATED DAMAGE: -25 HP'); }}><Crosshair size={13}/> TEST DAMAGE</button><button type="button" onClick={() => { setGame((old) => ({ ...old, character: { ...old.character, hp: old.character.maxHp } })); inform('HIT POINTS RESTORED'); }}><Activity size={13}/> RESTORE HP</button></div>
                    </div>
                  </div>}

                  {tab === 'INV' && <div className="two-column inventory-layout">
                    <section className="index-pane">
                      <div className="inventory-manager-toolbar">
                        <span>PERSONAL LOADOUT</span>
                        <button type="button" className="inventory-add-button" onClick={() => setEditor({ mode: 'add' })}><Plus size={13} /> ADD ITEM</button>
                      </div>
                      <div className="filter-row" aria-label="Inventory categories">
                        {FILTERS.map((option) => <button key={option} type="button" className={filter === option ? 'selected' : ''} onClick={() => {
                          setFilter(option);
                          const first = game.inventory.find((item) => item.count > 0 && (option === 'ALL' || item.category === option));
                          setSelectedItem(first?.id ?? '');
                        }}>{option}</button>)}
                      </div>
                      <div className="scroll-list">
                        {items.map((item) => <button key={item.id} type="button" className={'list-row ' + (currentItem?.id === item.id ? 'selected' : '')} onClick={() => setSelectedItem(item.id)}>
                          <span>{item.name}</span>
                          <span className="row-count">{item.cash !== undefined ? '$' + item.cash.toFixed(2) : item.count > 1 ? '×' + item.count : <ChevronRight size={14} />}</span>
                        </button>)}
                        {!items.length && <p className="empty">NO ITEMS IN THIS CATEGORY</p>}
                      </div>
                      <div className="pane-bottom">{itemCount} ITEMS &nbsp; • &nbsp; CASH {'$' + cashOnHand.toFixed(2)}</div>
                    </section>
                    {currentItem ? (
                      <section className="detail-pane">
                        <span className="eyebrow">PERSONAL LOADOUT / {currentItem.category}</span>
                        <div className="item-illustration" aria-hidden="true"><InventoryIcon item={currentItem} /></div>
                        <h2>{currentItem.name}</h2>
                        <div className="item-stat">{currentItem.stat}</div>
                        <p>{currentItem.description}</p>
                        <div className="detail-stats">
                          <span>CATEGORY <strong>{currentItem.category}</strong></span>
                          <span>OWNED <strong>{currentItem.count}</strong></span>
                          <span>{currentItem.cash !== undefined ? 'CASH' : 'RECORD'} <strong>{currentItem.cash !== undefined ? '$' + currentItem.cash.toFixed(2) : 'ON FILE'}</strong></span>
                        </div>
                        <div className="inventory-detail-actions">
                          <button type="button" onClick={() => setEditor({ mode: 'edit', id: currentItem.id })}><Pencil size={13} /> EDIT ITEM</button>
                          <button type="button" className="inventory-remove-button" onClick={() => setEditor({ mode: 'edit', id: currentItem.id, confirmRemove: true })}><Trash2 size={13} /> REMOVE</button>
                        </div>
                      </section>
                    ) : (
                      <section className="detail-pane inventory-empty-detail">
                        <PackageSearch size={42} />
                        <h2>NO ITEMS FOUND</h2>
                        <p>{game.inventory.length ? 'Try another category or register a new item.' : 'Your inventory is empty. Start with your first belonging.'}</p>
                        <button type="button" className="inventory-add-button" onClick={() => setEditor({ mode: 'add' })}><Plus size={13} /> ADD ITEM</button>
                      </section>
                    )}
                  </div>}

                  {tab === 'DATA' && <div className="two-column">
                    <section className="index-pane"><div className="pane-title">QUESTS <span>{game.quests.length} ENTRIES</span></div><div className="scroll-list">{game.quests.map((quest) => <button key={quest.id} type="button" className={`list-row quest-row ${selectedQuest === quest.id ? 'selected' : ''}`} onClick={() => setSelectedQuest(quest.id)}><span>{quest.completed ? <Check size={15}/> : <span className="quest-diamond"/>}{quest.title}</span><span className="quest-status">{quest.completed ? 'DONE' : 'ACTIVE'}</span></button>)}</div><div className="pane-bottom">MISSION DATA // LOCAL CACHE</div></section>
                    <section className="detail-pane quest-detail"><span className="eyebrow">{currentQuest.completed ? 'MISSION COMPLETED' : 'ACTIVE MISSION'} / {currentQuest.location.toUpperCase()}</span><div className="quest-icon"><Crosshair size={46} strokeWidth={1}/></div><h2>{currentQuest.title}</h2><p>{currentQuest.description}</p><div className="objective"><span>CURRENT OBJECTIVE</span><strong>{currentQuest.objective}</strong></div><button type="button" className="primary-action" onClick={() => { setGame((old) => ({ ...old, quests: old.quests.map((quest) => quest.id === currentQuest.id ? { ...quest, completed: !quest.completed } : quest) })); inform(currentQuest.completed ? 'MISSION REACTIVATED' : 'MISSION COMPLETED'); }}>{currentQuest.completed ? 'REOPEN QUEST' : 'MARK COMPLETE'} {currentQuest.completed ? <RotateCcw size={14}/> : <Check size={15}/>}</button></section>
                  </div>}

                  {tab === 'MAP' && <NYCMap />}

                  {tab === 'RADIO' && <div className="two-column radio-layout">
                    <section className="index-pane"><div className="pane-title">AVAILABLE FREQUENCIES <span><SignalBars/></span></div><div className="scroll-list">{stations.map((entry) => <button key={entry.id} type="button" className={`list-row station-row ${radio.station === entry.id ? 'selected' : ''}`} onClick={() => { radio.setStation(entry.id); playDeviceSound('static'); inform(`TUNED TO ${entry.mhz} MHz`); }}><span><Radio size={15}/> {entry.name}</span><span className="station-freq">{entry.mhz}</span></button>)}</div><div className="pane-bottom">SCANNING COMPLETE // 03 STATIONS</div></section>
                    <section className="radio-detail"><div className="radio-heading"><span className="eyebrow">NOW TUNED</span><span className={radio.playing ? 'on-air' : 'off-air'}><span/> {radio.playing ? 'SIGNAL LIVE' : 'STANDBY'}</span></div><div className={`frequency-display ${radio.playing ? 'playing' : ''}`}><span>{currentStation.mhz}</span><small>MHz</small></div><div className={`waveform ${radio.playing ? 'animated' : ''}`} aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <span key={i} style={{ height: `${12 + (Math.abs(Math.sin(i * 0.69) * Math.cos(i * 0.18)) * 72)}%`, animationDelay: `${i * -0.055}s` }}/>)}</div><h2>{currentStation.name}</h2><p>{currentStation.description}</p><div className="radio-controls"><button type="button" className="play-button" onClick={() => radio.setPlaying(!radio.playing)} aria-label={radio.playing ? 'Stop radio' : 'Play radio'}>{radio.playing ? <Pause size={21} fill="currentColor"/> : <Play size={21} fill="currentColor"/>}</button><div className="volume-control"><Volume2 size={17}/><input aria-label="Radio volume" type="range" min={0} max={100} value={radio.volume} onChange={(event) => radio.setVolume(Number(event.target.value))} /><span>{radio.volume}%</span></div></div><div className="radio-disclaimer">ORIGINAL SYNTHESIZED SIGNALS · NO COPYRIGHTED AUDIO</div></section>
                  </div>}
                </div>
                <div className="screen-footer"><span><span className="tiny-block"/> {tab === 'MAP' ? 'NYC MAP / PUBLIC DATA FEEDS' : notice}</span><span>{tab === 'STAT' ? `XP ${game.character.xp} / ${xpToLevel}` : tab === 'MAP' ? 'NYC 311 / MTA / OSM' : 'VAULT-TEC OS 1.0'}</span></div>
              </div>
              )}
            </div>
  );

  return (
    <div className={`page ${amber ? 'theme-amber' : ''} ${powerState === 'off' ? 'page-off' : ''} page-three crt-${crtMode}`}>
      <div className="ambient-blob ambient-blob-one"/><div className="ambient-blob ambient-blob-two"/>
      <header className="page-header" aria-label="Pip-Boy controls">
        <div className="view-header-actions">
          <button
            type="button"
            className={'view-control' + (stabilized ? ' is-stabilized' : '')}
            onClick={() => setStabilized((value) => !value)}
            aria-pressed={stabilized}
            aria-label={stabilized ? 'Unlock 3D and return to free rotation' : 'Stabilize the 3D Pip-Boy for easier screen interaction'}
            title={stabilized ? 'Return to the rotatable 3D view' : 'Animate closer to the screen and lock rotation'}
            disabled={!webglAvailable}
          >
            {stabilized ? <Unlock size={14} aria-hidden="true" /> : <ScanFace size={14} aria-hidden="true" />}
            {stabilized ? 'UNLOCK 3D' : 'STABILIZE VIEW'}
          </button>
          <button type="button" className="view-control" onClick={() => setSettingsOpen(true)} aria-label="Open Pip-Boy settings"><Settings2 size={14} /> CONFIG</button>
          <button type="button" className="view-control" onClick={togglePower} aria-label={powerState === 'off' ? 'Power on Pip-Boy' : 'Power off Pip-Boy'}><Power size={14} /> POWER</button>
        </div>
      </header>

      {webglAvailable ? (
        <PipBoyImported3D
          display={display}
          activeTab={tab}
          onTabChange={changeTab}
          onRadioNext={tuneNextStation}
          onPower={togglePower}
          powerState={powerState}
          amber={amber}
          stabilized={stabilized}
        />
      ) : (
        <main className="three-device-stage imported-device-stage" role="status">
          <div className="pipboy-asset-status">
            <strong>3D RENDERING UNAVAILABLE</strong>
            <p>This Pip-Boy requires a browser with WebGL2 enabled to display its interactive 3D model.</p>
          </div>
        </main>
      )}

      {editor && (editor.mode === 'add' || editingItem) && (
        <InventoryEditor
          key={editor.mode === 'add' ? 'new-item' : editor.id}
          item={editor.mode === 'edit' ? editingItem : undefined}
          startWithDelete={editor.mode === 'edit' && editor.confirmRemove === true}
          onSave={saveInventoryItem}
          onDelete={deleteInventoryItem}
          onClose={() => setEditor(null)}
        />
      )}

      {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}><div className="settings-modal" role="dialog" aria-modal="true" aria-label="Pip-Boy settings" onClick={(event) => event.stopPropagation()}><div className="modal-header"><h2>SYSTEM CONFIGURATION</h2><button type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><Minus size={18}/></button></div><div className="setting-row"><div><strong>PHOSPHOR DISPLAY</strong><p>Change the monochrome display color.</p></div><button type="button" className="setting-toggle" onClick={() => setAmber(!amber)}>{amber ? 'AMBER' : 'GREEN'} <ChevronRight size={14}/></button></div><div className="setting-row"><div><strong>CRT EFFECTS</strong><p>Switch between a clean, subtle or stronger vintage display.</p></div><button type="button" className="setting-toggle" onClick={() => setCrtMode((old) => old === 'off' ? 'subtle' : old === 'subtle' ? 'vivid' : 'off')} aria-label="Cycle CRT effects">CRT: {crtMode.toUpperCase()} <ChevronRight size={14}/></button></div><div className="setting-row"><div><strong>HARDWARE SOUND</strong><p>Optional original clicks and tuning tones. Off by default.</p></div><button type="button" className="setting-toggle" onClick={() => setSoundEnabled((old) => !old)} aria-pressed={soundEnabled}>{soundEnabled ? 'SOUND: ON' : 'SOUND: OFF'} <ChevronRight size={14}/></button></div><div className="setting-row"><div><strong>RESTART SYSTEM</strong><p>Replay startup diagnostics without changing saved progress.</p></div><button type="button" className="setting-toggle" onClick={reboot}><RotateCcw size={14}/> REBOOT</button></div><div className="setting-row"><div><strong>RESTORE DEFAULT SAVE</strong><p>Erase local character, item, quest, and map progress.</p></div><button type="button" className="setting-toggle danger" onClick={reset}><RotateCcw size={14}/> RESET</button></div><div className="settings-tip"><ArrowDownToLine size={17}/> Progress saves automatically in this browser. Nothing is uploaded.</div></div></div>}
    </div>
  );
}

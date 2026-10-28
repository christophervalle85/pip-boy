import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity, ArrowDownToLine, BatteryFull, Check, ChevronRight,
  Crosshair, Minus, Pause, Play, Power, Radio, RotateCcw,
  Settings2, Shield, Volume2, Zap,
} from 'lucide-react';
import {
  initialGame, loadGame, saveGame, special, stations,
  type GameState, type Item, type Tab,
} from './data';
import BootScreen, { BOOT_CHECKS } from './BootScreen';
import NYCMap from './NYCMap';

const TABS: Tab[] = ['STAT', 'INV', 'DATA', 'MAP', 'RADIO'];
const FILTERS = ['ALL', 'WEAPONS', 'APPAREL', 'AID', 'MISC'] as const;
type PowerState = 'booting' | 'ready' | 'off';
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(value, max));

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

function Dweller() {
  return (
    <svg className="dweller" viewBox="0 0 230 288" role="img" aria-label="Smiling retro-futurist vault explorer illustration">
      <defs><pattern id="hatch" patternUnits="userSpaceOnUse" width="6" height="6"><path d="M0 6 L6 0" stroke="currentColor" strokeWidth=".5" opacity=".24" /></pattern></defs>
      <g fill="none" stroke="currentColor" strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M78 52 Q70 25 97 17 Q132 7 149 30 Q157 39 151 57 L149 82 Q135 107 111 103 Q90 100 81 81Z"/>
        <path d="M78 48 Q81 17 109 19 Q136 14 150 35 Q126 40 101 37 Q90 54 78 48Z" fill="currentColor" opacity=".7" />
        <path d="M83 53 Q74 37 67 52 Q64 65 82 73 M151 54 Q161 42 168 55 Q169 68 150 73"/>
        <path d="M99 67 Q104 63 110 67 M132 66 Q137 63 142 66" strokeWidth="3" />
        <path d="M118 69 Q114 80 125 81 M101 84 Q120 99 140 82" strokeWidth="3"/>
        <path d="M97 107 Q114 118 135 108 M101 106 L91 119 L75 127 L57 191 L69 202 L91 165 L87 219 L143 219 L142 165 L161 199 L175 191 L155 127 L137 118 L130 108"/>
        <path d="M91 119 Q116 135 137 118 M101 128 L101 213 M128 128 L128 214 M87 161 L143 161 M86 213 L144 213"/>
        <path d="M91 218 L87 259 L83 274 L111 274 L115 218 M118 218 L119 274 L150 274 L145 259 L141 218"/>
        <path d="M85 272 L79 282 L113 282 L111 274 M120 275 L118 282 L154 282 L150 273"/>
        <path d="M64 196 L51 217 L65 224 L77 201 M166 195 L180 220 L166 229 L152 202" />
        <path d="M170 191 Q191 180 197 161 L212 158 Q214 179 200 195 L180 207"/>
        <path d="M199 164 L194 146 M207 162 L205 148 M215 158 L218 145" strokeWidth="3.2"/>
        <path d="M95 163 L135 163 M93 172 L139 172" strokeWidth="2.4" />
        <path d="M107 142 L121 137 L121 151 L107 150Z" fill="currentColor" opacity=".5" strokeWidth="1"/>
      </g>
      <path d="M90 119 L141 120 L141 215 L89 215Z" fill="url(#hatch)" opacity=".5"/>
    </svg>
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
  const [selectedItem, setSelectedItem] = useState('pistol');
  const [selectedQuest, setSelectedQuest] = useState('signals');
  const [amber, setAmber] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [powerState, setPowerState] = useState<PowerState>('booting');
  const [bootStep, setBootStep] = useState(0);
  const [notice, setNotice] = useState('ALL SYSTEMS NOMINAL');
  const radio = useRadio();

  useEffect(() => saveGame(game), [game]);
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
      if (powerState === 'ready' && event.key >= '1' && event.key <= '5') setTab(TABS[Number(event.key) - 1]);
      if (event.key === 'Escape') setSettingsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [powerState]);

  const inform = (message: string) => setNotice(message);
  const useItem = (item: Item) => {
    if (item.count < 1) return;
    if (item.equipable) {
      setGame((old) => ({ ...old, character: {
        ...old.character,
        ...(item.category === 'WEAPONS' ? { equippedWeapon: item.id } : { equippedArmor: item.id }),
      } }));
      inform(`${item.name.toUpperCase()} EQUIPPED`);
      return;
    }
    if (!item.usable) return;
    setGame((old) => {
      const next = { ...old, character: { ...old.character }, inventory: old.inventory.map((i) => ({ ...i })) };
      if (item.id === 'stimpak') next.character.hp = clamp(next.character.hp + 75, 0, next.character.maxHp);
      if (item.id === 'radaway') next.character.rads = clamp(next.character.rads - 50, 0, 1000);
      if (item.id === 'nuka') {
        next.character.hp = clamp(next.character.hp + 15, 0, next.character.maxHp);
        next.character.rads = clamp(next.character.rads + 3, 0, 1000);
      }
      const consumed = next.inventory.find((i) => i.id === item.id);
      if (consumed) consumed.count = Math.max(0, consumed.count - 1);
      return next;
    });
    inform(`${item.name.toUpperCase()} USED`);
  };

  const currentItem = game.inventory.find((entry) => entry.id === selectedItem) ?? game.inventory[0];
  const items = game.inventory.filter((entry) => entry.count > 0 && (filter === 'ALL' || entry.category === filter));
  const currentQuest = game.quests.find((entry) => entry.id === selectedQuest) ?? game.quests[0];
  const currentStation = stations.find((entry) => entry.id === radio.station) ?? stations[0];
  const carryWeight = game.inventory.reduce((sum, item) => sum + (item.count * item.weight), 0);
  const xpToLevel = 1000;

  const reboot = () => {
    radio.setPlaying(false);
    setSettingsOpen(false);
    setBootStep(0);
    setPowerState('booting');
  };
  const togglePower = () => {
    if (powerState === 'off') {
      setBootStep(0);
      setPowerState('booting');
    } else {
      radio.setPlaying(false);
      setSettingsOpen(false);
      setPowerState('off');
    }
  };

  const reset = () => {
    setGame(structuredClone(initialGame));
    setSelectedItem('pistol');
    setSelectedQuest('signals');
    setSettingsOpen(false);
    inform('SAVE DATA RESET');
  };

  return (
    <div className={`page ${amber ? 'theme-amber' : ''} ${powerState === 'off' ? 'page-off' : ''}`}>
      <div className="ambient-blob ambient-blob-one"/><div className="ambient-blob ambient-blob-two"/>
      <header className="page-header">
        <div className="brand-lockup"><div className="brand-mark" aria-label="Pip-Boy logo"><Zap size={20} fill="currentColor"/></div></div>
        <span className="build-label"><span className="online-dot"/> BUILD 0.3.0 — {powerState === 'ready' ? 'ONLINE' : powerState === 'booting' ? 'STARTING' : 'STANDBY'}</span>
      </header>

      <main className="console-wrap"><div className="side-grip side-grip-left" aria-hidden="true"><i/><i/><i/></div><div className="side-grip side-grip-right" aria-hidden="true"><i/><i/><i/></div>
        <div className="console-cap"><div className="screw"/><span>MODEL 3000 Mk IV</span><div className="grille"><i/><i/><i/><i/><i/><i/></div><div className="screw"/></div>
        <div className="console">
          <div className="console-top"><span className="stamped">PIP-BOY <strong>3000</strong></span><span className="console-series">GENERAL PURPOSE COMPUTER<br/>PERSONAL EDITION / 2077</span><div className="power-unit"><div className={`power-indicator ${powerState === 'off' ? 'is-off' : powerState === 'booting' ? 'is-starting' : ''}`}><span/> PWR</div><button type="button" className="power-control" onClick={togglePower} aria-label={powerState === 'off' ? 'Power on Pip-Boy' : 'Power off Pip-Boy'} title={powerState === 'off' ? 'Power on' : 'Power off'}><Power size={17}/></button></div></div>
          <div className="screen-bezel">
            <div className={`screen screen-${powerState === 'ready' ? 'online' : powerState}`}>
              <div className="scanlines" aria-hidden="true" />
              {powerState === 'booting' && <BootScreen step={bootStep} onSkip={() => setPowerState('ready')} />}
              {powerState === 'off' && <div className="power-off-panel"><Power size={28}/><strong>DISPLAY OFFLINE</strong><p>PRESS THE POWER BUTTON TO RESTART</p><button type="button" onClick={togglePower}><Power size={14}/> POWER ON</button></div>}
              {powerState === 'ready' && (
              <div className="screen-content">
                <div className="screen-meta"><span>ROBCO INDUSTRIES (TM)</span><span className="meta-right"><SignalBars/> SECURE LINK ESTABLISHED</span></div>
                <nav className="tab-bar" aria-label="Pip-Boy main sections">
                  {TABS.map((item, index) => (
                    <button type="button" className={`tab ${item === tab ? 'active' : ''}`} key={item} onClick={() => setTab(item)} aria-current={item === tab ? 'page' : undefined}><span>{item}</span><small>0{index + 1}</small></button>
                  ))}
                </nav>
                <div className="screen-heading"><div><span className="breadcrumb">PIP-BOY / {tab}</span><h1>{tab === 'STAT' ? 'PERSONNEL STATUS' : tab === 'INV' ? 'ITEM INVENTORY' : tab === 'DATA' ? 'QUEST DATABASE' : tab === 'MAP' ? 'NEW YORK CITY' : 'FREQUENCY TUNER'}</h1></div><span className="heading-side">{tab === 'STAT' ? `LVL ${String(game.character.level).padStart(2, '0')}` : tab === 'INV' ? `${items.length} LISTED` : tab === 'DATA' ? `${game.quests.filter((q) => !q.completed).length} ACTIVE` : tab === 'MAP' ? '5 BOROUGHS' : `${currentStation.mhz} MHz`}</span></div>
                <div className="workspace">
                  {tab === 'STAT' && <div className="stat-layout">
                    <div className="character-card"><div className="corner-label">VAULT DWELLER  //  #017</div><Dweller/><div className="person-label">THE WANDERER <span>• ALIVE</span></div></div>
                    <div className="stat-main">
                      <div className="meter-stack"><Meter label="HIT POINTS" value={game.character.hp} max={game.character.maxHp}/><Meter label="ACTION POINTS" value={game.character.ap} max={110}/><Meter label="RADIATION" value={game.character.rads} max={1000}/></div>
                      <div className="triple-stats"><div><span>LEVEL</span><strong>{String(game.character.level).padStart(2, '0')}</strong></div><div><span>CAPS</span><strong>{game.character.caps}</strong></div><div><span>XP</span><strong>{game.character.xp}</strong></div></div>
                      <div className="mini-heading"><span>S.P.E.C.I.A.L. ATTRIBUTES</span><span>BASE VALUES</span></div>
                      <div className="special-grid">{special.map((entry) => <div key={entry.short} title={entry.name}><small>{entry.short}</small><strong>{entry.score}</strong></div>)}</div>
                      <div className="test-actions"><button type="button" onClick={() => { setGame((old) => ({ ...old, character: { ...old.character, hp: Math.max(0, old.character.hp - 25) } })); inform('SIMULATED DAMAGE: -25 HP'); }}><Crosshair size={13}/> TEST DAMAGE</button><button type="button" onClick={() => { const stimpak = game.inventory.find((i) => i.id === 'stimpak'); if (stimpak?.count) useItem(stimpak); else inform('NO STIMPAKS REMAINING'); }}><Activity size={13}/> USE STIMPAK</button></div>
                    </div>
                  </div>}

                  {tab === 'INV' && <div className="two-column inventory-layout">
                    <section className="index-pane"><div className="filter-row" aria-label="Inventory categories">{FILTERS.map((option) => <button key={option} type="button" className={filter === option ? 'selected' : ''} onClick={() => { setFilter(option); const first = game.inventory.find((item) => item.count > 0 && (option === 'ALL' || item.category === option)); if (first) setSelectedItem(first.id); }}>{option}</button>)}</div><div className="scroll-list">{items.map((item) => <button key={item.id} type="button" className={`list-row ${selectedItem === item.id ? 'selected' : ''}`} onClick={() => setSelectedItem(item.id)}><span>{item.name}{(game.character.equippedWeapon === item.id || game.character.equippedArmor === item.id) && <Check size={13}/>}</span><span className="row-count">{item.count > 1 ? `×${item.count}` : <ChevronRight size={14}/>}</span></button>)}{!items.length && <p className="empty">NO ITEMS IN CATEGORY</p>}</div><div className="pane-bottom">WT {carryWeight.toFixed(1)} / 150 &nbsp; • &nbsp; CAPS {game.character.caps}</div></section>
                    <section className="detail-pane"><span className="eyebrow">ITEM INSPECTOR / {currentItem.category}</span><div className="item-illustration" aria-hidden="true">{currentItem.category === 'WEAPONS' ? <Crosshair size={100} strokeWidth={1} /> : currentItem.category === 'APPAREL' ? <Shield size={100} strokeWidth={1} /> : currentItem.category === 'AID' ? <Activity size={100} strokeWidth={1} /> : <BatteryFull size={100} strokeWidth={1} />}</div><h2>{currentItem.name}</h2><div className="item-stat">{currentItem.stat}</div><p>{currentItem.description}</p><div className="detail-stats"><span>WEIGHT <strong>{currentItem.weight}</strong></span><span>VALUE <strong>{currentItem.value}</strong></span><span>OWNED <strong>{currentItem.count}</strong></span></div>{(currentItem.usable || currentItem.equipable) && <button type="button" className="primary-action" disabled={currentItem.count < 1} onClick={() => useItem(currentItem)}>{currentItem.usable ? 'USE ITEM' : (game.character.equippedWeapon === currentItem.id || game.character.equippedArmor === currentItem.id) ? 'EQUIPPED' : 'EQUIP ITEM'} <ChevronRight size={15}/></button>}</section>
                  </div>}

                  {tab === 'DATA' && <div className="two-column">
                    <section className="index-pane"><div className="pane-title">QUESTS <span>{game.quests.length} ENTRIES</span></div><div className="scroll-list">{game.quests.map((quest) => <button key={quest.id} type="button" className={`list-row quest-row ${selectedQuest === quest.id ? 'selected' : ''}`} onClick={() => setSelectedQuest(quest.id)}><span>{quest.completed ? <Check size={15}/> : <span className="quest-diamond"/>}{quest.title}</span><span className="quest-status">{quest.completed ? 'DONE' : 'ACTIVE'}</span></button>)}</div><div className="pane-bottom">MISSION DATA // LOCAL CACHE</div></section>
                    <section className="detail-pane quest-detail"><span className="eyebrow">{currentQuest.completed ? 'MISSION COMPLETED' : 'ACTIVE MISSION'} / {currentQuest.location.toUpperCase()}</span><div className="quest-icon"><Crosshair size={46} strokeWidth={1}/></div><h2>{currentQuest.title}</h2><p>{currentQuest.description}</p><div className="objective"><span>CURRENT OBJECTIVE</span><strong>{currentQuest.objective}</strong></div><button type="button" className="primary-action" onClick={() => { setGame((old) => ({ ...old, quests: old.quests.map((quest) => quest.id === currentQuest.id ? { ...quest, completed: !quest.completed } : quest) })); inform(currentQuest.completed ? 'MISSION REACTIVATED' : 'MISSION COMPLETED'); }}>{currentQuest.completed ? 'REOPEN QUEST' : 'MARK COMPLETE'} {currentQuest.completed ? <RotateCcw size={14}/> : <Check size={15}/>}</button></section>
                  </div>}

                  {tab === 'MAP' && <NYCMap />}

                  {tab === 'RADIO' && <div className="two-column radio-layout">
                    <section className="index-pane"><div className="pane-title">AVAILABLE FREQUENCIES <span><SignalBars/></span></div><div className="scroll-list">{stations.map((entry) => <button key={entry.id} type="button" className={`list-row station-row ${radio.station === entry.id ? 'selected' : ''}`} onClick={() => { radio.setStation(entry.id); inform(`TUNED TO ${entry.mhz} MHz`); }}><span><Radio size={15}/> {entry.name}</span><span className="station-freq">{entry.mhz}</span></button>)}</div><div className="pane-bottom">SCANNING COMPLETE // 03 STATIONS</div></section>
                    <section className="radio-detail"><div className="radio-heading"><span className="eyebrow">NOW TUNED</span><span className={radio.playing ? 'on-air' : 'off-air'}><span/> {radio.playing ? 'SIGNAL LIVE' : 'STANDBY'}</span></div><div className={`frequency-display ${radio.playing ? 'playing' : ''}`}><span>{currentStation.mhz}</span><small>MHz</small></div><div className={`waveform ${radio.playing ? 'animated' : ''}`} aria-hidden="true">{Array.from({ length: 42 }, (_, i) => <span key={i} style={{ height: `${12 + (Math.abs(Math.sin(i * 0.69) * Math.cos(i * 0.18)) * 72)}%`, animationDelay: `${i * -0.055}s` }}/>)}</div><h2>{currentStation.name}</h2><p>{currentStation.description}</p><div className="radio-controls"><button type="button" className="play-button" onClick={() => radio.setPlaying(!radio.playing)} aria-label={radio.playing ? 'Stop radio' : 'Play radio'}>{radio.playing ? <Pause size={21} fill="currentColor"/> : <Play size={21} fill="currentColor"/>}</button><div className="volume-control"><Volume2 size={17}/><input aria-label="Radio volume" type="range" min={0} max={100} value={radio.volume} onChange={(event) => radio.setVolume(Number(event.target.value))} /><span>{radio.volume}%</span></div></div><div className="radio-disclaimer">ORIGINAL SYNTHESIZED SIGNALS · NO COPYRIGHTED AUDIO</div></section>
                  </div>}
                </div>
                <div className="screen-footer"><span><span className="tiny-block"/> {tab === 'MAP' ? 'NYC MAP / PUBLIC DATA FEEDS' : notice}</span><span>{tab === 'STAT' ? `XP ${game.character.xp} / ${xpToLevel}` : tab === 'MAP' ? 'NYC 311 / MTA / OSM' : 'VAULT-TEC OS 1.0'}</span></div>
              </div>
              )}
            </div>
          </div>
          <div className="hardware-footer"><div className="hardware-controls"><div className="vent"><i/><i/><i/><i/><i/><i/><i/></div><button type="button" className="round-control" title="Toggle device settings" aria-label="Open settings" onClick={() => setSettingsOpen(true)}><Settings2 size={19}/></button><div className="hardware-legend"><span>CONFIG</span><small>ROTARY SELECTOR</small></div></div><div className="hardware-stamp">PROPERTY OF<br/><strong>VAULT-TEC</strong></div><div className="hardware-controls right-hardware"><span>BATTERY <strong>100%</strong></span><BatteryFull size={23}/><div className="screw"/></div></div>
        </div>
        <div className="console-foot"><div className="screw"/><span>DESIGNED FOR THE WORLD OF TOMORROW</span><div className="screw"/></div>
      </main>

      <footer className="page-footer"><span><Power size={13}/> {powerState === 'off' ? 'SYSTEM OFFLINE' : powerState === 'booting' ? 'STARTING UP' : 'SYSTEM ACTIVE'} <span className="footer-separator">/</span> LOCAL STORAGE ENABLED</span><span>PRESS <kbd>1</kbd>–<kbd>5</kbd> TO SWITCH TABS</span></footer>

      {settingsOpen && <div className="modal-backdrop" onClick={() => setSettingsOpen(false)}><div className="settings-modal" role="dialog" aria-modal="true" aria-label="Pip-Boy settings" onClick={(event) => event.stopPropagation()}><div className="modal-header"><h2>SYSTEM CONFIGURATION</h2><button type="button" aria-label="Close settings" onClick={() => setSettingsOpen(false)}><Minus size={18}/></button></div><div className="setting-row"><div><strong>PHOSPHOR DISPLAY</strong><p>Change the monochrome display color.</p></div><button type="button" className="setting-toggle" onClick={() => setAmber(!amber)}>{amber ? 'AMBER' : 'GREEN'} <ChevronRight size={14}/></button></div><div className="setting-row"><div><strong>RESTART SYSTEM</strong><p>Replay startup diagnostics without changing saved progress.</p></div><button type="button" className="setting-toggle" onClick={reboot}><RotateCcw size={14}/> REBOOT</button></div><div className="setting-row"><div><strong>RESTORE DEFAULT SAVE</strong><p>Erase local character, item, quest, and map progress.</p></div><button type="button" className="setting-toggle danger" onClick={reset}><RotateCcw size={14}/> RESET</button></div><div className="settings-tip"><ArrowDownToLine size={17}/> Progress saves automatically in this browser. Nothing is uploaded.</div></div></div>}
    </div>
  );
}

export type Tab = 'STAT' | 'INV' | 'DATA' | 'MAP' | 'RADIO';
export type ItemCategory = 'WEAPONS' | 'APPAREL' | 'AID' | 'MISC';
export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  count: number;
  weight: number;
  value: number;
  description: string;
  stat: string;
  equipable?: boolean;
  usable?: boolean;
};
export type Quest = {
  id: string;
  title: string;
  location: string;
  objective: string;
  description: string;
  completed: boolean;
};
export type MapLocation = {
  id: string;
  name: string;
  x: number;
  y: number;
  type: string;
  notes: string;
  discovered: boolean;
};
export type Character = { hp: number; maxHp: number; ap: number; rads: number; level: number; caps: number; xp: number; equippedWeapon: string | null; equippedArmor: string | null };
export type GameState = { character: Character; inventory: Item[]; quests: Quest[]; locations: MapLocation[] };

export const initialGame: GameState = {
  character: { hp: 285, maxHp: 285, ap: 110, rads: 6, level: 12, caps: 243, xp: 560, equippedWeapon: 'pistol', equippedArmor: 'jumpsuit' },
  inventory: [
    { id: 'pistol', name: '10mm Pistol', category: 'WEAPONS', count: 1, weight: 3.5, value: 50, description: 'Reliable, compact and just loud enough to draw every ghoul in the county.', stat: 'DMG 18  ·  AMMO 10mm', equipable: true },
    { id: 'rifle', name: 'Pipe Rifle', category: 'WEAPONS', count: 1, weight: 5.1, value: 33, description: 'Built from scrap, stubbornness, and some very questionable engineering.', stat: 'DMG 27  ·  AMMO .38', equipable: true },
    { id: 'ammo', name: '10mm Round', category: 'MISC', count: 48, weight: 0, value: 1, description: 'Standard ballistic ammunition for your trusty 10mm pistol.', stat: 'AMMO 10mm' },
    { id: 'jumpsuit', name: 'Vault Jumpsuit', category: 'APPAREL', count: 1, weight: 1, value: 20, description: 'A little faded, but the blue and gold still inspire confidence.', stat: 'DMG RESIST 5', equipable: true },
    { id: 'leather', name: 'Worn Leather Coat', category: 'APPAREL', count: 1, weight: 3, value: 18, description: 'Looks better than it smells. Probably.', stat: 'DMG RESIST 8', equipable: true },
    { id: 'stimpak', name: 'Stimpak', category: 'AID', count: 5, weight: 0.1, value: 48, description: 'A miraculous little syringe. Restores 75 HP.', stat: '+75 HP', usable: true },
    { id: 'radaway', name: 'RadAway', category: 'AID', count: 3, weight: 0.5, value: 80, description: 'Flush some of the wasteland out of your bloodstream.', stat: '-50 RADS', usable: true },
    { id: 'nuka', name: 'Nuka-Cola', category: 'AID', count: 2, weight: 1, value: 20, description: 'Refreshing, invigorating and slightly radioactive.', stat: '+15 HP / +3 RADS', usable: true },
    { id: 'scrap', name: 'Wonderglue', category: 'MISC', count: 2, weight: 0.5, value: 4, description: 'Always useful for making things that should not hold together, hold together.', stat: 'JUNK COMPONENT' },
  ],
  quests: [
    { id: 'signals', title: 'A Signal in the Static', location: 'Radio Tower Echo', objective: 'Investigate the repeating emergency broadcast.', description: 'A voice keeps breaking through the static every night at exactly 11:17. Find the transmission source.', completed: false },
    { id: 'outpost', title: 'The Last Light', location: 'Dustfall Outpost', objective: 'Deliver three medical supplies to the outpost.', description: 'The outpost medic is running low. The road is dangerous, but somebody has to make the trip.', completed: false },
    { id: 'home', title: 'Home Sweet Wasteland', location: 'Bunker 17', objective: 'Secure the bunker and restore its power.', description: 'A roof, a locked door, and maybe even working lights. It could be the start of something good.', completed: true },
  ],
  locations: [
    { id: 'bunker', name: 'Bunker 17', x: 27, y: 38, type: 'SHELTER', notes: 'Your home base. Safe, dry, and only mildly haunted.', discovered: true },
    { id: 'dustfall', name: 'Dustfall Outpost', x: 58, y: 61, type: 'SETTLEMENT', notes: 'Trading post, field clinic, and the closest thing to civilization for miles.', discovered: true },
    { id: 'tower', name: 'Radio Tower Echo', x: 70, y: 27, type: 'SIGNAL', notes: 'The source of a repeating radio transmission. Signal strength is increasing.', discovered: true },
    { id: 'quarry', name: 'Ashen Quarry', x: 37, y: 75, type: 'UNKNOWN', notes: 'Strange sounds have been reported near the old quarry.', discovered: false },
    { id: 'station', name: 'Old Relay Station', x: 83, y: 76, type: 'UNKNOWN', notes: 'Power readings suggest something is still running underground.', discovered: false },
  ],
};

export const special = [
  { name: 'STRENGTH', short: 'STR', score: 6 },
  { name: 'PERCEPTION', short: 'PER', score: 7 },
  { name: 'ENDURANCE', short: 'END', score: 5 },
  { name: 'CHARISMA', short: 'CHA', score: 4 },
  { name: 'INTELLIGENCE', short: 'INT', score: 8 },
  { name: 'AGILITY', short: 'AGI', score: 6 },
  { name: 'LUCK', short: 'LCK', score: 4 },
];

export const stations = [
  { id: 'wasteland', name: 'Wasteland Waves', mhz: '98.7', description: 'Soft ambient tones from somewhere beyond the horizon.', note: 164.81 },
  { id: 'mojave', name: 'Midnight Mojave', mhz: '103.4', description: 'Late-night signals, drifting across the desert.', note: 220 },
  { id: 'echo', name: 'Radio Tower Echo', mhz: '107.1', description: 'An eerie beacon with a message buried in the noise.', note: 130.81 },
];

const STORAGE_KEY = 'pip-boy-3000-state-v1';

export function loadGame(): GameState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return structuredClone(initialGame);
    const parsed = JSON.parse(saved) as Partial<GameState>;
    if (!parsed.character || !Array.isArray(parsed.inventory) || !Array.isArray(parsed.quests) || !Array.isArray(parsed.locations)) {
      throw new Error('Invalid save');
    }
    return parsed as GameState;
  } catch {
    return structuredClone(initialGame);
  }
}
export function saveGame(game: GameState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); } catch { /* Storage may be disabled. */ }
}

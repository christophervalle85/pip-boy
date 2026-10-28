export type Tab = 'STAT' | 'INV' | 'DATA' | 'MAP' | 'RADIO';
export type ItemCategory = 'TECH' | 'PERSONAL' | 'KEYS' | 'OTHER';
export type Item = {
  id: string;
  name: string;
  category: ItemCategory;
  count: number;
  description: string;
  stat: string;
  cash?: number;
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
export type GameState = { character: Character; inventory: Item[]; inventoryRevision: number; quests: Quest[]; locations: MapLocation[] };

export const initialGame: GameState = {
  character: { hp: 285, maxHp: 285, ap: 110, rads: 6, level: 12, caps: 243, xp: 560, equippedWeapon: null, equippedArmor: null },
  inventoryRevision: 3,
  inventory: [
    {
      id: 'macbook-1',
      name: 'MacBook Air M2 · Midnight',
      category: 'TECH',
      count: 1,
      description: 'My Midnight MacBook Air M2. An everyday portable workstation, tracked separately from my second laptop.',
      stat: 'LAPTOP · M2 / MIDNIGHT',
    },
    {
      id: 'macbook-2',
      name: 'MacBook Air M4 · Silver',
      category: 'TECH',
      count: 1,
      description: 'My Silver MacBook Air M4. The prepared 3D preview currently uses the uploaded M2 mesh as a visual placeholder.',
      stat: 'LAPTOP · M4 / SILVER',
    },
    {
      id: 'wallet',
      name: 'Wallet',
      category: 'PERSONAL',
      count: 1,
      cash: 34.53,
      description: 'Your everyday wallet. It currently holds $34.53 in cash—every dollar and cent accounted for.',
      stat: 'CASH ON HAND · $34.53',
    },
    {
      id: 'car-keys',
      name: 'Car Keys',
      category: 'KEYS',
      count: 1,
      description: "The keys to your car. Easy to overlook until you are already standing beside the driver's door.",
      stat: 'VEHICLE ACCESS',
    },
    {
      id: 'house-key',
      name: 'House Key',
      category: 'KEYS',
      count: 1,
      description: 'A single house key. Small enough to disappear into a pocket, important enough to check for twice.',
      stat: 'HOME ACCESS',
    },
    {
      id: 'airpods',
      name: 'AirPods',
      category: 'TECH',
      count: 1,
      description: 'Your AirPods, ready for music, calls, and tuning out the noise of the city. Battery status has not been recorded.',
      stat: 'WIRELESS AUDIO',
    },
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
    // Update only the original two default MacBook records from revision 2.
    // Preserve item counts, user-added inventory, edited descriptions, quests,
    // cash, and progress rather than resetting the entire inventory.
    if (parsed.inventoryRevision === 2) {
      const macbookDefaults: Record<string, { oldName: string; oldStat: string; oldDescription: string; updated: Item }> = {
        'macbook-1': {
          oldName: 'MacBook 01',
          oldStat: 'PERSONAL DEVICE · 01 / 02',
          oldDescription: 'One of your two MacBooks. A little piece of civilization you can carry anywhere. Exact model and battery status have not been recorded.',
          updated: initialGame.inventory[0],
        },
        'macbook-2': {
          oldName: 'MacBook 02',
          oldStat: 'PERSONAL DEVICE · 02 / 02',
          oldDescription: 'Your second MacBook, tracked separately from the first. Another computer in your personal inventory, with its own place in the loadout.',
          updated: initialGame.inventory[1],
        },
      };
      const inventory = parsed.inventory.map((item) => {
        const original = macbookDefaults[item.id];
        if (!original) return item;
        return {
          ...item,
          name: item.name === original.oldName ? original.updated.name : item.name,
          description: item.description === original.oldDescription ? original.updated.description : item.description,
          stat: item.stat === original.oldStat ? original.updated.stat : item.stat,
        };
      });
      return { ...(parsed as GameState), inventoryRevision: 3, inventory };
    }
    // Very old save formats still adopt the current real-world loadout.
    if (parsed.inventoryRevision !== initialGame.inventoryRevision) {
      return {
        ...(parsed as GameState),
        inventoryRevision: initialGame.inventoryRevision,
        inventory: structuredClone(initialGame.inventory),
        character: { ...parsed.character, equippedWeapon: null, equippedArmor: null },
      } as GameState;
    }
    return parsed as GameState;
  } catch {
    return structuredClone(initialGame);
  }
}
export function saveGame(game: GameState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(game)); } catch { /* Storage may be disabled. */ }
}

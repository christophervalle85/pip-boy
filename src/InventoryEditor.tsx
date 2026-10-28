import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Check, Pencil, ShieldAlert, Trash2, X } from 'lucide-react';
import type { Item, ItemCategory } from './data';
import './inventory-editor.css';

type InventoryEditorProps = {
  item?: Item;
  startWithDelete?: boolean;
  onClose: () => void;
  onSave: (item: Item) => void;
  onDelete: (id: string) => void;
};

type Draft = {
  name: string;
  category: ItemCategory;
  count: string;
  stat: string;
  description: string;
  cash: string;
};

const CATEGORIES: ItemCategory[] = ['TECH', 'PERSONAL', 'KEYS', 'OTHER'];

export default function InventoryEditor({
  item, startWithDelete = false, onClose, onSave, onDelete,
}: InventoryEditorProps) {
  const titleId = useId();
  const firstField = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(startWithDelete);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState<Draft>({
    name: item?.name ?? '',
    category: item?.category ?? 'PERSONAL',
    count: String(item?.count ?? 1),
    stat: item?.stat ?? '',
    description: item?.description ?? '',
    cash: item?.cash === undefined ? '' : item.cash.toFixed(2),
  });

  useEffect(() => {
    const previouslyFocused = document.activeElement;
    firstField.current?.focus();
    return () => {
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [onClose]);

  const changeField = (field: keyof Draft, value: string) => {
    setError('');
    setDraft((current) => ({ ...current, [field]: value }));
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = draft.name.trim();
    if (!name) {
      setError('ENTER A NAME FOR THIS ITEM.');
      firstField.current?.focus();
      return;
    }
    const quantity = Number(draft.count);
    if (!/^\d+$/.test(draft.count.trim()) || !Number.isInteger(quantity) || quantity < 1 || quantity > 999) {
      setError('QUANTITY MUST BE A WHOLE NUMBER BETWEEN 1 AND 999.');
      return;
    }
    const cashInput = draft.cash.trim();
    let cash: number | undefined;
    if (cashInput !== '') {
      if (!/^\d+(?:\.\d{1,2})?$/.test(cashInput)) {
        setError('CASH MUST BE A DOLLAR AMOUNT WITH UP TO TWO DECIMAL PLACES.');
        return;
      }
      cash = Number(cashInput);
      if (!Number.isFinite(cash) || cash > 999999.99) {
        setError('CASH MUST BE BETWEEN $0 AND $999,999.99.');
        return;
      }
      cash = Math.round(cash * 100) / 100;
    }
    const identifier = item?.id ?? (
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? 'personal-' + crypto.randomUUID()
        : 'personal-' + Date.now() + '-' + Math.random().toString(36).slice(2)
    );
    let stat = draft.stat.trim() || 'PERSONAL ITEM';
    let description = draft.description.trim() || 'A personal belonging recorded in your Pip-Boy inventory.';

    // Keep the default wallet readout and description consistent if its cash changes.
    // Preserve deliberately customized text.
    if (item?.id === 'wallet' && item.stat === draft.stat && item.stat.startsWith('CASH ON HAND ·')) {
      stat = cash === undefined ? 'CASH ON HAND · NOT RECORDED' : 'CASH ON HAND · $' + cash.toFixed(2);
    }
    if (item?.id === 'wallet' && item.description === draft.description &&
      /^Your everyday wallet\. It currently holds \$\d+\.\d{2} in cash—every dollar and cent accounted for\.$/.test(item.description)) {
      description = cash === undefined
        ? 'Your everyday wallet. Its cash balance has not been recorded.'
        : 'Your everyday wallet. It currently holds $' + cash.toFixed(2) + ' in cash—every dollar and cent accounted for.';
    }

    onSave({
      id: identifier,
      name,
      category: draft.category,
      count: quantity,
      stat,
      description,
      ...(cash === undefined ? {} : { cash }),
    });
  };

  return (
    <div className="modal-backdrop inventory-editor-backdrop" onMouseDown={(event) => {
      if (event.currentTarget === event.target) onClose();
    }}>
      <div className="inventory-editor" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="inventory-editor-header">
          <div>
            <span className="inventory-editor-kicker">PIP-BOY / INVENTORY DATABASE</span>
            <h2 id={titleId}>{item ? 'EDIT INVENTORY ENTRY' : 'REGISTER NEW ITEM'}</h2>
          </div>
          <button type="button" className="inventory-editor-close" aria-label="Close item editor" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={save} noValidate>
          <div className="inventory-editor-fields">
            <label className="inventory-editor-field">
              <span>ITEM NAME <b>*</b></span>
              <input ref={firstField} value={draft.name} onChange={(event) => changeField('name', event.target.value)} placeholder="e.g. Apartment key" maxLength={65} required />
            </label>

            <div className="inventory-editor-two">
              <label className="inventory-editor-field">
                <span>CATEGORY</span>
                <select value={draft.category} onChange={(event) => changeField('category', event.target.value as ItemCategory)}>
                  {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="inventory-editor-field">
                <span>QUANTITY <b>*</b></span>
                <input type="number" inputMode="numeric" min={1} max={999} step={1} value={draft.count} onChange={(event) => changeField('count', event.target.value)} required />
              </label>
            </div>

            <label className="inventory-editor-field">
              <span>PIP-BOY READOUT</span>
              <input value={draft.stat} onChange={(event) => changeField('stat', event.target.value)} placeholder="e.g. EVERYDAY CARRY" maxLength={65} />
            </label>

            <label className="inventory-editor-field">
              <span>ITEM DESCRIPTION</span>
              <textarea value={draft.description} onChange={(event) => changeField('description', event.target.value)} placeholder="Add some personality or details about this item…" maxLength={350} rows={3} />
              <small>{draft.description.length} / 350 CHARACTERS</small>
            </label>

            <label className="inventory-editor-field">
              <span>CASH INSIDE (OPTIONAL)</span>
              <div className="inventory-money-input"><span>$</span><input type="number" min={0} max={999999.99} inputMode="decimal" step=".01" placeholder="0.00" value={draft.cash} onChange={(event) => changeField('cash', event.target.value)} /></div>
              <small>FOR YOUR WALLET OR OTHER CASH-CARRYING ITEMS. LEAVE BLANK OTHERWISE.</small>
            </label>
          </div>

          {error && <p className="inventory-editor-error" role="alert"><ShieldAlert size={14} /> {error}</p>}
          {confirmDelete && item && (
            <div className="inventory-delete-confirm" role="alert">
              <strong>REMOVE {item.name.toUpperCase()}?</strong>
              <p>THIS ITEM WILL BE REMOVED FROM YOUR SAVED INVENTORY.</p>
              <div>
                <button type="button" className="inventory-delete-final" onClick={() => onDelete(item.id)}><Trash2 size={13} /> CONFIRM REMOVE</button>
                <button type="button" onClick={() => setConfirmDelete(false)}>KEEP ITEM</button>
              </div>
            </div>
          )}

          <div className="inventory-editor-footer">
            {item && !confirmDelete && <button type="button" className="inventory-delete-trigger" onClick={() => setConfirmDelete(true)}><Trash2 size={13} /> REMOVE</button>}
            <span className="inventory-editor-fill" />
            <button type="button" className="inventory-cancel" onClick={onClose}>CANCEL</button>
            <button type="submit" className="inventory-save"><Check size={14} /> {item ? 'SAVE CHANGES' : 'ADD ITEM'}</button>
          </div>
        </form>
        <div className="inventory-editor-footnote"><Pencil size={12} /> CHANGES SAVE TO THIS BROWSER AUTOMATICALLY</div>
      </div>
    </div>
  );
}

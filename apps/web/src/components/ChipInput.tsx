import { useId, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Free-text tag input with suggestions (datalist). */
export function ChipInput({
  value,
  onChange,
  suggestions = [],
  placeholder,
  max = 50,
  id,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  max?: number;
  id?: string;
}) {
  const [draft, setDraft] = useState('');
  const listId = useId();

  const add = (raw: string) => {
    const v = raw.trim();
    if (!v || value.length >= max) return;
    if (value.some((x) => x.toLowerCase() === v.toLowerCase())) return setDraft('');
    onChange([...value, v]);
    setDraft('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      add(draft);
    } else if (e.key === 'Backspace' && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5 focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-slate-700 dark:bg-slate-900">
      {value.map((v) => (
        <span
          key={v}
          className="inline-flex items-center gap-1 rounded-md bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-700/20 dark:text-brand-100"
        >
          {v}
          <button
            type="button"
            aria-label={`Remove ${v}`}
            onClick={() => onChange(value.filter((x) => x !== v))}
            className="hover:text-brand-900"
          >
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        list={listId}
        value={draft}
        onChange={(e) => {
          const v = e.target.value;
          // Picking a datalist option fires an input event without a typing inputType.
          const inputType = (e.nativeEvent as InputEvent).inputType;
          const picked = inputType === undefined || inputType === 'insertReplacementText';
          if (picked && suggestions.includes(v)) add(v);
          else setDraft(v);
        }}
        onKeyDown={onKeyDown}
        onBlur={() => add(draft)}
        placeholder={value.length ? '' : placeholder}
        className={cn(
          'min-w-32 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-slate-400',
        )}
      />
      <datalist id={listId}>
        {suggestions
          .filter((s) => !value.includes(s))
          .map((s) => (
            <option key={s} value={s} />
          ))}
      </datalist>
    </div>
  );
}

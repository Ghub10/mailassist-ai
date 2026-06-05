import type { Tone } from '../types/user';

interface ToneSelectorProps {
  value: Tone;
  onChange: (tone: Tone) => void;
}

const tones: { value: Tone; label: string; description: string }[] = [
  { value: 'friendly', label: 'Friendly', description: 'Warm, approachable, and natural' },
  { value: 'formal', label: 'Formal', description: 'Professional and structured' },
  { value: 'concise', label: 'Concise', description: 'Short, direct, to the point' },
];

export function ToneSelector({ value, onChange }: ToneSelectorProps) {
  return (
    <fieldset>
      <legend className="sr-only">Reply tone</legend>
      <div className="space-y-3">
        {tones.map((tone) => (
          <label
            key={tone.value}
            className={[
              'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors',
              value === tone.value
                ? 'border-violet-500 bg-violet-50'
                : 'border-zinc-200 bg-white hover:border-violet-200',
            ].join(' ')}
          >
            <input
              type="radio"
              name="tone"
              value={tone.value}
              checked={value === tone.value}
              onChange={() => onChange(tone.value)}
              className="mt-0.5 accent-violet-500"
            />
            <div>
              <p className={`font-semibold text-sm ${value === tone.value ? 'text-violet-700' : 'text-zinc-800'}`}>
                {tone.label}
              </p>
              <p className="text-xs text-zinc-500 mt-0.5">{tone.description}</p>
            </div>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

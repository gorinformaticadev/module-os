import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

interface DurationValue {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

interface DurationPickerProps {
    value?: DurationValue;
    onChange: (value: DurationValue) => void;
    label?: string;
}

const DurationPicker: React.FC<DurationPickerProps> = ({ value, onChange, label }) => {
    const [localValue, setLocalValue] = useState<DurationValue>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        if (value) {
            setLocalValue(value);
        }
    }, [value]);

    const handleChange = (field: keyof DurationValue, val: string) => {
        const num = parseInt(val) || 0;
        const newValue = { ...localValue, [field]: num };
        setLocalValue(newValue);
        onChange(newValue);
    };

    const formatDuration = (v: DurationValue) => {
        const parts = [];
        if (v.days > 0) parts.push(`${v.days} dia${v.days > 1 ? 's' : ''}`);
        if (v.hours > 0) parts.push(`${v.hours.toString().padStart(2, '0')}h`);
        if (v.minutes > 0) parts.push(`${v.minutes.toString().padStart(2, '0')}m`);
        if (v.seconds > 0) parts.push(`${v.seconds.toString().padStart(2, '0')}s`);

        if (parts.length === 0) return '0s';
        if (parts.length === 1) return parts[0];

        const last = parts.pop();
        return `${parts.join(', ')} e ${last}`;
    };

    return (
        <div className="space-y-2">
            {label && <label className="text-sm font-medium flex items-center gap-2">
                {label}
                <span className="text-xs font-normal text-skin-text-muted bg-muted px-2 py-0.5 rounded-full">
                    {formatDuration(localValue)}
                </span>
            </label>}

            <div className="flex items-center gap-2 p-2 border rounded-lg bg-skin-background/50 focus-within:ring-2 ring-primary/20 transition-all">
                <Clock className="w-4 h-4 text-skin-text-muted flex-none" />

                <div className="flex items-center gap-1 flex-1">
                    <div className="flex flex-col items-center">
                        <input
                            type="number"
                            min="0"
                            className="w-12 text-center bg-transparent border-b border-skin-border focus:border-primary outline-none text-sm p-1"
                            placeholder="DD"
                            value={localValue.days || ''}
                            onChange={(e) => handleChange('days', e.target.value)}
                        />
                        <span className="text-[10px] text-skin-text-muted uppercase">Dias</span>
                    </div>
                    <span className="text-skin-text-muted pb-4">:</span>
                    <div className="flex flex-col items-center">
                        <input
                            type="number"
                            min="0"
                            max="23"
                            className="w-10 text-center bg-transparent border-b border-skin-border focus:border-primary outline-none text-sm p-1"
                            placeholder="HH"
                            value={localValue.hours || ''}
                            onChange={(e) => handleChange('hours', e.target.value)}
                        />
                        <span className="text-[10px] text-skin-text-muted uppercase">Hrs</span>
                    </div>
                    <span className="text-skin-text-muted pb-4">:</span>
                    <div className="flex flex-col items-center">
                        <input
                            type="number"
                            min="0"
                            max="59"
                            className="w-10 text-center bg-transparent border-b border-skin-border focus:border-primary outline-none text-sm p-1"
                            placeholder="MM"
                            value={localValue.minutes || ''}
                            onChange={(e) => handleChange('minutes', e.target.value)}
                        />
                        <span className="text-[10px] text-skin-text-muted uppercase">Min</span>
                    </div>
                    <span className="text-skin-text-muted pb-4">:</span>
                    <div className="flex flex-col items-center">
                        <input
                            type="number"
                            min="0"
                            max="59"
                            className="w-10 text-center bg-transparent border-b border-skin-border focus:border-primary outline-none text-sm p-1"
                            placeholder="SS"
                            value={localValue.seconds || ''}
                            onChange={(e) => handleChange('seconds', e.target.value)}
                        />
                        <span className="text-[10px] text-skin-text-muted uppercase">Seg</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DurationPicker;

import React from 'react';
import type { GameSettings, CardBackStyle, CardFaceTheme } from '../engine/types';
import { CardBack } from './CardBack';
import { X, Volume2, VolumeX, Smartphone, Eye, Award, Palette } from 'lucide-react';

interface SettingsModalProps {
  settings: GameSettings;
  onUpdateSettings: (newSettings: GameSettings) => void;
  onClose: () => void;
}

const CARD_BACK_OPTIONS: { id: CardBackStyle; label: string }[] = [
  { id: 'classic-blue', label: 'כחול קלאסי' },
  { id: 'castle', label: 'טירה בלילה' },
  { id: 'beach', label: 'חוף ים' },
  { id: 'roses', label: 'שושנים' },
];

const CARD_FACE_OPTIONS: { id: CardFaceTheme; label: string; desc: string; badge?: string }[] = [
  { id: 'standard', label: 'קלאסי תקני', desc: 'איורים מסורתיים מלאים (Bicycle)', badge: 'מומלץ' },
  { id: 'windows95', label: 'Windows 95', desc: 'הפיקסל-ארט המקורי מ-cards.dll', badge: 'נוסטלגי' },
  { id: 'victorian', label: 'ויקטוריאני', desc: 'עיצוב Goodall & Son מהמאה ה-19' },
  { id: 'modern', label: 'מודרני נקי', desc: 'דמויות מלכותיות בקו נקי' },
  { id: 'jumbo', label: "ג'מבו ענק", desc: 'ספרות וסמלים ענקיים לקריאות' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  const toggle = <K extends keyof GameSettings>(key: K, value: GameSettings[K]) => {
    onUpdateSettings({ ...settings, [key]: value });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-[#1b4332] border-2 border-emerald-500/50 rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden text-white flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-emerald-600/40 bg-[#0f281e]">
          <h2 className="text-xl font-bold">הגדרות המשחק</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-emerald-800/60 hover:bg-emerald-700 text-white active:scale-95 transition-transform"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Card Face Theme Selection */}
          <div>
            <label className="flex items-center justify-between text-sm font-semibold text-emerald-200 mb-2">
              <span className="flex items-center gap-1.5">
                <Palette size={16} className="text-amber-400" />
                חפיסת קלפים (5 עיצובים לבחירה)
              </span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {CARD_FACE_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggle('cardFaceTheme', opt.id)}
                  className={`relative flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all ${
                    settings.cardFaceTheme === opt.id
                      ? 'border-amber-400 bg-emerald-700 text-white shadow-md font-bold scale-102'
                      : 'border-emerald-800 bg-emerald-950/40 text-emerald-300 opacity-75 hover:opacity-100'
                  }`}
                >
                  {opt.badge && (
                    <span className="absolute -top-1.5 -right-1 bg-amber-500 text-gray-950 text-[9px] font-black px-1.5 py-0.2 rounded-full shadow">
                      {opt.badge}
                    </span>
                  )}
                  <span className="text-xs font-bold leading-tight">{opt.label}</span>
                  <span className="text-[10px] opacity-75 mt-0.5 line-clamp-1">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Card Back Selection */}
          <div>
            <label className="block text-sm font-semibold text-emerald-200 mb-2">
              עיצוב גב הקלפים (נוסטלגיית Windows)
            </label>

            <div className="grid grid-cols-4 gap-2">
              {CARD_BACK_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => toggle('cardBack', opt.id)}
                  className={`flex flex-col items-center p-1.5 rounded-lg border-2 transition-all ${
                    settings.cardBack === opt.id
                      ? 'border-amber-400 bg-emerald-900/80 shadow-md scale-105'
                      : 'border-transparent bg-emerald-950/40 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="w-12 h-16 rounded overflow-hidden shadow">
                    <CardBack styleName={opt.id} />
                  </div>
                  <span className="text-[11px] font-medium mt-1 text-center truncate w-full">
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Draw Count (1 vs 3) */}
          <div className="bg-[#0f281e] p-3 rounded-xl border border-emerald-700/50">
            <label className="block text-sm font-semibold text-emerald-200 mb-2">
              מספר קלפים בשליפה מהקופה
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggle('drawCount', 1)}
                className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                  settings.drawCount === 1
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                    : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                }`}
              >
                קלף 1 (קל וזורם)
              </button>
              <button
                onClick={() => toggle('drawCount', 3)}
                className={`py-2 px-3 rounded-lg text-sm font-bold border transition-all ${
                  settings.drawCount === 3
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                    : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                }`}
              >
                3 קלפים (אתגר קלאסי)
              </button>
            </div>
          </div>

          {/* Scoring Mode Toggle (Standard vs Relaxed) */}
          <div className="bg-[#0f281e] p-3 rounded-xl border border-emerald-700/50">
            <label className="flex items-center gap-1.5 text-sm font-semibold text-emerald-200 mb-2">
              <Award size={16} className="text-amber-400" />
              שיטת ניקוד
            </label>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => toggle('scoringMode', 'relaxed')}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold border transition-all ${
                  settings.scoringMode === 'relaxed'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                    : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                }`}
              >
                מצב רגוע (ללא קנסות)
              </button>
              <button
                onClick={() => toggle('scoringMode', 'standard')}
                className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold border transition-all ${
                  settings.scoringMode === 'standard'
                    ? 'bg-emerald-600 border-emerald-400 text-white shadow'
                    : 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                }`}
              >
                אתגרי (ניקוד Windows מלא)
              </button>
            </div>
            <div className="text-[11px] text-emerald-300/80 mt-1.5 px-0.5">
              {settings.scoringMode === 'standard'
                ? 'במצב אתגרי: מנוכות 2 נקודות כל 10 שניות וישנם קנסות על סיבובי קופה.'
                : 'במצב רגוע: אין הורדת נקודות על זמן או מעבר קופה.'}
            </div>
          </div>

          {/* Accessibility & Audio toggles */}
          <div className="space-y-2.5">
            {/* Large Fonts */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f281e] border border-emerald-700/50">
              <div className="flex items-center gap-2.5">
                <Eye size={18} className="text-emerald-400" />
                <div>
                  <div className="text-sm font-medium">ספרות וסמלים גדולים</div>
                  <div className="text-[11px] text-emerald-300">הגדלה משמעותית של האינדקס בכל קלף</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.largeFonts}
                onChange={(e) => toggle('largeFonts', e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f281e] border border-emerald-700/50">
              <div className="flex items-center gap-2.5">
                {settings.soundEnabled ? <Volume2 size={18} className="text-emerald-400" /> : <VolumeX size={18} className="text-gray-400" />}
                <span className="text-sm font-medium">צלילי משחק</span>
              </div>
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => toggle('soundEnabled', e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Haptics */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#0f281e] border border-emerald-700/50">
              <div className="flex items-center gap-2.5">
                <Smartphone size={18} className="text-emerald-400" />
                <span className="text-sm font-medium">משוב רטט עדין במגע</span>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticsEnabled}
                onChange={(e) => toggle('hapticsEnabled', e.target.checked)}
                className="w-5 h-5 accent-emerald-500 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-emerald-600/40 bg-[#0f281e]">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow active:scale-95 transition-transform"
          >
            אישור ושמירה
          </button>
        </div>
      </div>
    </div>
  );
};

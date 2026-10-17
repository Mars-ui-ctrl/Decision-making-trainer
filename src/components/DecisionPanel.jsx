import { useEffect, useState, useCallback } from 'react';
import './DecisionPanel.css';

export default function DecisionPanel({
  prompt = null,
  onSelectDecision,
  isProcessing = false,
}) {
  const [selectedId, setSelectedId] = useState(null);

  // Clear selection if prompt changes
  useEffect(() => {
    setSelectedId(null);
  }, [prompt?.id]);

  const handleSelect = useCallback(
    (option) => {
      if (isProcessing) return;
      setSelectedId(option.id);
      onSelectDecision(option.id);
    },
    [isProcessing, onSelectDecision]
  );

  // Keyboard shortcuts 1-3, A-C
  useEffect(() => {
    if (!prompt?.options) return;

    const handleKeyDown = (e) => {
      if (isProcessing) return;
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toUpperCase();
      let matchedIndex = -1;

      if (['1', '2', '3'].includes(key)) {
        matchedIndex = parseInt(key, 10) - 1;
      } else if (['A', 'B', 'C'].includes(key)) {
        matchedIndex = key.charCodeAt(0) - 65;
      }

      if (matchedIndex >= 0 && matchedIndex < prompt.options.length) {
        e.preventDefault();
        handleSelect(prompt.options[matchedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [prompt, handleSelect, isProcessing]);

  if (!prompt || !prompt.options) return null;

  return (
    <div className="decision-bar">
      <div className="decision-bar__header">
        <div className="decision-bar__alert-tag">DECISION REQUIRED</div>
        <h2 className="decision-bar__headline">{prompt.headline}</h2>
        {prompt.subtext && <p className="decision-bar__subtext">{prompt.subtext}</p>}
      </div>

      <div className="decision-bar__options">
        {prompt.options.map((opt, idx) => {
          const isSelected = selectedId === opt.id;
          const letter = opt.label || String.fromCharCode(65 + idx);
          const keyNum = opt.key || (idx + 1);

          return (
            <button
              key={opt.id}
              type="button"
              className={`decision-bar__card ${isSelected ? 'decision-bar__card--selected' : ''}`}
              onClick={() => handleSelect(opt)}
              disabled={isProcessing}
            >
              <div className="decision-bar__card-top">
                <span className="decision-bar__key-badge">{keyNum}</span>
                <span className="decision-bar__opt-label">{letter}</span>
                <span className="decision-bar__card-title">{opt.title}</span>
              </div>

              {opt.tagline && (
                <p className="decision-bar__card-desc">{opt.tagline}</p>
              )}

              {opt.tradeoff ? (
                <div className="decision-bar__tradeoff-strip">
                  <span className="decision-bar__tradeoff-badge">{opt.tradeoff}</span>
                </div>
              ) : (opt.pros || opt.cons) && (
                <div className="decision-bar__tradeoffs">
                  {opt.pros && <span className="decision-bar__pro">+ {opt.pros}</span>}
                  {opt.cons && <span className="decision-bar__con">- {opt.cons}</span>}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

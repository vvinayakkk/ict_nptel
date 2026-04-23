import { useEffect } from "react";

/**
 * useKeyboard({ onPrev, onNext, onAnswerByIndex, onFocusMove, onSelectFocused, onRestart })
 * - onPrev(): previous question
 * - onNext(): next question
 * - onAnswerByIndex(idx): choose option by zero-based index (0..4)
 * - onFocusMove(direction): -1 up, +1 down
 * - onSelectFocused(): select currently focused option (Enter/Space)
 * - onRestart(): restart session (triggered by 'R' or 'r')
 */
export default function useKeyboard({
  onPrev = () => {},
  onNext = () => {},
  onAnswerByIndex = () => {},
  onFocusMove = () => {},
  onSelectFocused = () => {},
  onRestart = () => {},
}) {
  useEffect(() => {
    function onKey(e) {
      const tag = e.target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable) return;

      // Select focused option
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onSelectFocused();
        return;
      }

      // Move focus between options
      if (e.key === "w" || e.key === "W") {
        e.preventDefault();
        onFocusMove(-1);
        return;
      }
      if (e.key === "s" || e.key === "S") {
        e.preventDefault();
        onFocusMove(1);
        return;
      }

      // navigation
      if (e.key === "ArrowLeft" || e.key === "Left" || e.key === "A" || e.key === "a") {
        e.preventDefault();
        onPrev();
        return;
      }
      if (e.key === "ArrowRight" || e.key === "Right" || e.key === "D" || e.key === "d") {
        e.preventDefault();
        onNext();
        return;
      }

      // numeric answers 1..5
      if (["1", "2", "3", "4", "5"].includes(e.key)) {
        const idx = parseInt(e.key, 10) - 1;
        e.preventDefault();
        onAnswerByIndex(idx);
        return;
      }

      // Restart
      if (e.key === "r" || e.key === "R") {
        e.preventDefault();
        onRestart();
        return;
      }
    }

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onPrev, onNext, onAnswerByIndex, onFocusMove, onSelectFocused, onRestart]);
}

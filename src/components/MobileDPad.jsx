import { memo, useCallback, useEffect, useRef, useState } from "react";

const D_PAD_DIRECTIONS = [
  { direction: "up", label: "Move Up", icon: "↑", area: "up" },
  { direction: "left", label: "Move Left", icon: "←", area: "left" },
  { direction: "right", label: "Move Right", icon: "→", area: "right" },
  { direction: "down", label: "Move Down", icon: "↓", area: "down" },
];

const TWO_HANDS_VISIBLE_DIRECTIONS = {
  left: new Set(["left", "down"]),
  right: new Set(["up", "right"]),
};

const HOLD_SPEEDS = {
  fast: { startDelayMs: 120, repeatDelayMs: 72 },
  medium: { startDelayMs: 160, repeatDelayMs: 92 },
  slow: { startDelayMs: 220, repeatDelayMs: 124 },
};

const getDirectionFromPoint = (x, y) => {
  const element = document.elementFromPoint(x, y);
  const directionElement = element?.closest?.("[data-dpad-direction]");
  const direction = directionElement?.dataset?.dpadDirection;
  return direction || null;
};

const MobileDPad = ({ onMove, disabled, side = "left", holdSpeed = "medium", twoHandsMode = false }) => {
  const [activeDirection, setActiveDirection] = useState("");
  const activeDirectionRef = useRef("");
  const pointerIdRef = useRef(null);
  const touchIdRef = useRef(null);
  const holdStartTimeoutRef = useRef(null);
  const holdIntervalRef = useRef(null);
  const speedProfile = HOLD_SPEEDS[holdSpeed] || HOLD_SPEEDS.medium;
  const normalizedSide = side === "right" ? "right" : "left";
  const visibleDirections = twoHandsMode
    ? TWO_HANDS_VISIBLE_DIRECTIONS[normalizedSide]
    : null;
  const controls = visibleDirections
    ? D_PAD_DIRECTIONS.filter((control) => visibleDirections.has(control.direction))
    : D_PAD_DIRECTIONS;

  const clearHoldTimers = useCallback(() => {
    if (holdStartTimeoutRef.current) {
      clearTimeout(holdStartTimeoutRef.current);
      holdStartTimeoutRef.current = null;
    }
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
  }, []);

  const stopPress = useCallback(() => {
    clearHoldTimers();
    pointerIdRef.current = null;
    touchIdRef.current = null;
    activeDirectionRef.current = "";
    setActiveDirection("");
  }, [clearHoldTimers]);

  const queueHoldMovement = useCallback(() => {
    clearHoldTimers();

    holdStartTimeoutRef.current = setTimeout(() => {
      holdIntervalRef.current = setInterval(() => {
        if (!activeDirectionRef.current || disabled) {
          return;
        }

        onMove(activeDirectionRef.current);
      }, speedProfile.repeatDelayMs);
    }, speedProfile.startDelayMs);
  }, [clearHoldTimers, disabled, onMove, speedProfile.repeatDelayMs, speedProfile.startDelayMs]);

  const pressDirection = useCallback((direction, startRepeat = false) => {
    if (!direction || disabled) {
      return;
    }

    activeDirectionRef.current = direction;
    setActiveDirection(direction);
    onMove(direction);

    if (startRepeat) {
      queueHoldMovement();
    }
  }, [disabled, onMove, queueHoldMovement]);

  const updateDirectionFromPoint = useCallback((x, y) => {
    if (!activeDirectionRef.current || disabled) {
      return;
    }

    const nextDirection = getDirectionFromPoint(x, y);
    if (!nextDirection || nextDirection === activeDirectionRef.current) {
      return;
    }

    activeDirectionRef.current = nextDirection;
    setActiveDirection(nextDirection);
    onMove(nextDirection);
    queueHoldMovement();
  }, [disabled, onMove, queueHoldMovement]);

  const handlePointerDown = useCallback((event, direction) => {
    if (!("PointerEvent" in window) || disabled) {
      return;
    }
    if (pointerIdRef.current !== null || touchIdRef.current !== null) {
      return;
    }

    pointerIdRef.current = event.pointerId;
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
    pressDirection(direction, true);
  }, [disabled, pressDirection]);

  const handlePointerMove = useCallback((event) => {
    if (!("PointerEvent" in window)) {
      return;
    }
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    event.preventDefault();
    updateDirectionFromPoint(event.clientX, event.clientY);
  }, [updateDirectionFromPoint]);

  const handlePointerUp = useCallback((event) => {
    if (!("PointerEvent" in window)) {
      return;
    }
    if (pointerIdRef.current !== event.pointerId) {
      return;
    }

    stopPress();
  }, [stopPress]);

  const handleTouchStart = useCallback((event, direction) => {
    if ("PointerEvent" in window || disabled) {
      return;
    }
    if (touchIdRef.current !== null || pointerIdRef.current !== null) {
      return;
    }

    const touch = event.changedTouches[0];
    if (!touch) {
      return;
    }

    touchIdRef.current = touch.identifier;
    event.preventDefault();
    pressDirection(direction, true);
  }, [disabled, pressDirection]);

  const handleTouchMove = useCallback((event) => {
    if ("PointerEvent" in window || touchIdRef.current === null) {
      return;
    }

    const matchingTouch = Array.from(event.changedTouches).find(
      (touch) => touch.identifier === touchIdRef.current
    );

    if (!matchingTouch) {
      return;
    }

    event.preventDefault();
    updateDirectionFromPoint(matchingTouch.clientX, matchingTouch.clientY);
  }, [updateDirectionFromPoint]);

  const handleTouchEnd = useCallback((event) => {
    if ("PointerEvent" in window || touchIdRef.current === null) {
      return;
    }

    const isTrackedTouch = Array.from(event.changedTouches).some(
      (touch) => touch.identifier === touchIdRef.current
    );

    if (!isTrackedTouch) {
      return;
    }

    stopPress();
  }, [stopPress]);

  useEffect(() => {
    if (disabled && activeDirectionRef.current) {
      stopPress();
    }
  }, [disabled, stopPress]);

  useEffect(() => stopPress, [stopPress]);

  return (
    <div
      className={`arcade-mobile-dpad arcade-mobile-dpad--${normalizedSide}${twoHandsMode ? " arcade-mobile-dpad--two-hands" : ""}`}
      role="group"
      aria-label="Directional controls"
    >
      <div
        className="arcade-mobile-dpad__grid"
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        {controls.map((control) => {
          const isActive = activeDirection === control.direction;

          return (
            <button
              key={control.direction}
              type="button"
              className={`arcade-mobile-dpad__button arcade-mobile-dpad__button--${control.area}${isActive ? " is-active" : ""}`}
              data-dpad-direction={control.direction}
              aria-label={control.label}
              disabled={disabled}
              onPointerDown={(event) => handlePointerDown(event, control.direction)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onTouchStart={(event) => handleTouchStart(event, control.direction)}
            >
              <span className="arcade-mobile-dpad__icon" aria-hidden="true">{control.icon}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default memo(MobileDPad);

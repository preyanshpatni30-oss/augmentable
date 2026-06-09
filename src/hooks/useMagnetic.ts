import { useRef, useState, useCallback, useMemo, useEffect } from 'react';

/**
 * A custom hook that provides magnetic hover effect coordinates.
 * Returns a ref to attach to the element and the transform style.
 */
export const useMagnetic = (strength: number = 0.3) => {
  const ref = useRef<any>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const { left, top, width, height } = node.getBoundingClientRect();

      const centerX = left + width / 2;
      const centerY = top + height / 2;

      const distanceX = clientX - centerX;
      const distanceY = clientY - centerY;

      setPosition({
        x: distanceX * strength,
        y: distanceY * strength
      });
    };

    const handleMouseLeave = () => {
      setPosition({ x: 0, y: 0 });
    };

    node.addEventListener('mousemove', handleMouseMove);
    node.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      node.removeEventListener('mousemove', handleMouseMove);
      node.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [strength]);

  const transformStyle = useMemo(() => {
    const { x, y } = position;
    return {
      transform: `translate3d(${x}px, ${y}px, 0)`,
      transition: x === 0 && y === 0 
        ? 'transform 0.5s cubic-bezier(0.23, 1, 0.32, 1)' 
        : 'transform 0.1s ease-out'
    };
  }, [position]);

  return { ref, transformStyle };
};

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface TooltipProps {
  content: string | React.ReactNode;
  children: React.ReactElement;
  position?: 'top' | 'bottom' | 'left' | 'right';
  disabled?: boolean;
}

export default function Tooltip({ content, children, position = 'top', disabled = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  if (disabled || !content) return children;

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 -translate-y-[4px] border-t-stone-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 translate-y-[4px] border-b-stone-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -translate-x-[4px] border-l-stone-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 translate-x-[4px] border-r-stone-900 border-y-transparent border-l-transparent',
  };

  // We clone the child element to intercept and inject trigger events
  const trigger = React.cloneElement(children, {
    onMouseEnter: (e: React.MouseEvent) => {
      setIsVisible(true);
      if (children.props.onMouseEnter) children.props.onMouseEnter(e);
    },
    onMouseLeave: (e: React.MouseEvent) => {
      setIsVisible(false);
      if (children.props.onMouseLeave) children.props.onMouseLeave(e);
    },
    onFocus: (e: React.FocusEvent) => {
      setIsVisible(true);
      if (children.props.onFocus) children.props.onFocus(e);
    },
    onBlur: (e: React.FocusEvent) => {
      setIsVisible(false);
      if (children.props.onBlur) children.props.onBlur(e);
    },
  });

  return (
    <div className="relative inline-block">
      {trigger}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, x: position === 'left' ? 4 : position === 'right' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: position === 'top' ? 4 : position === 'bottom' ? -4 : 0, x: position === 'left' ? 4 : position === 'right' ? -4 : 0 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            className={`absolute ${positionClasses[position]} z-[9999] pointer-events-none`}
          >
            <div className="bg-stone-900 text-stone-100 text-[10px] font-sans font-extrabold px-2.5 py-1.5 rounded-lg shadow-xl border border-stone-800 whitespace-nowrap uppercase tracking-wider">
              {content}
            </div>
            <div className={`absolute w-0 h-0 border-[4px] ${arrowClasses[position]}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

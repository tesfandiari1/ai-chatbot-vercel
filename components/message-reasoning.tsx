'use client';

import { useState, useEffect } from 'react';
import { ChevronDownIcon } from './icons';
import { motion, AnimatePresence } from 'framer-motion';
import { Markdown } from './markdown';

interface MessageReasoningProps {
  isLoading: boolean;
  reasoning: string;
}

export function MessageReasoning({
  isLoading,
  reasoning,
}: MessageReasoningProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [cleanReasoning, setCleanReasoning] = useState('');
  const dots = ['', '.', '..', '...'];
  const [dotIndex, setDotIndex] = useState(0);

  // Animated dots effect
  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setDotIndex((prevIndex) => (prevIndex + 1) % dots.length);
      }, 500);

      return () => clearInterval(interval);
    }
  }, [isLoading, dots.length]);

  // Enhanced debugging and tag cleaning
  useEffect(() => {
    console.log(
      'MessageReasoning component rendered with reasoning:',
      reasoning,
    );

    if (reasoning) {
      // Strip out <think> and </think> tags
      const cleaned = reasoning
        .replace(/<think>/g, '')
        .replace(/<\/think>/g, '')
        .trim();

      console.log('Cleaned reasoning:', cleaned);
      setCleanReasoning(cleaned);
    }
  }, [reasoning]);

  const variants = {
    collapsed: {
      height: 0,
      opacity: 0,
      marginTop: 0,
      marginBottom: 0,
    },
    expanded: {
      height: 'auto',
      opacity: 1,
      marginTop: '1rem',
      marginBottom: '0.5rem',
    },
  };

  return (
    <div className="flex flex-col">
      {isLoading ? (
        <div className="flex flex-row gap-2 items-center">
          <motion.div
            className="font-medium flex"
            animate={{
              opacity: [0.6, 1, 0.6],
              transition: {
                repeat: Number.POSITIVE_INFINITY,
                duration: 1.8,
                ease: 'easeInOut',
                times: [0, 0.5, 1],
              },
            }}
          >
            Reasoning{dots[dotIndex]}
          </motion.div>
        </div>
      ) : (
        <div className="flex flex-row gap-2 items-center">
          <div className="font-medium">Thought Process</div>
          <button
            data-testid="message-reasoning-toggle"
            type="button"
            className="cursor-pointer"
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
          >
            <ChevronDownIcon />
          </button>
        </div>
      )}

      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            data-testid="message-reasoning"
            key="content"
            initial="collapsed"
            animate="expanded"
            exit="collapsed"
            variants={variants}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
            className="pl-4 text-zinc-600 dark:text-zinc-400 border-l flex flex-col gap-4"
          >
            <Markdown>{cleanReasoning || reasoning}</Markdown>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

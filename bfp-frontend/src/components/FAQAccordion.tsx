// src/components/FAQAccordion.tsx
// Collapsible accordion for FAQ page

import React, { useState } from 'react';
import { ChevronDownIcon } from './UnifiedIcons';

type FAQItem = {
  question: string;
  answer: string | React.ReactNode;
};

type FAQAccordionProps = {
  items: FAQItem[];
};

function AccordionItem({ question, answer, isOpen, onToggle }: FAQItem & { isOpen: boolean; onToggle: () => void }) {
  return (
    <div 
      className="card"
      style={{
        marginBottom: 12,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: isOpen ? '1px solid rgba(74, 144, 226, 0.3)' : '1px solid rgba(255,255,255,0.1)',
      }}
      onClick={onToggle}
    >
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: 16,
      }}>
        <h3 style={{
          fontSize: '1.1em',
          fontWeight: 600,
          margin: 0,
          color: isOpen ? '#4A90E2' : 'inherit',
        }}>
          {question}
        </h3>
        <div style={{
          transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.3s ease',
          flexShrink: 0,
          opacity: 0.7,
        }}>
          <ChevronDownIcon size={20} />
        </div>
      </div>
      
      <div style={{
        maxHeight: isOpen ? '1000px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.3s ease',
      }}>
        <div style={{
          paddingTop: isOpen ? 16 : 0,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s ease',
          lineHeight: 1.7,
          color: 'rgba(255,255,255,0.8)',
        }}>
          {typeof answer === 'string' ? <p className="p">{answer}</p> : answer}
        </div>
      </div>
    </div>
  );
}

export function FAQAccordion({ items }: FAQAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div>
      {items.map((item, index) => (
        <AccordionItem
          key={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex(openIndex === index ? null : index)}
        />
      ))}
    </div>
  );
}

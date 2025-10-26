import React, { useState, useEffect, useRef } from 'react';
import type { HistoryItem } from '../types';

interface TerminalProps {
  history: HistoryItem[];
  isLoading: boolean;
  onCommandSubmit: (command: string) => void;
  cwd: string[];
  commandHistory: string[];
  cwdContents: { name: string, type: 'file' | 'directory' }[];
}

const getDisplayPath = (cwd: string[]): string => {
  if (!cwd.length) return '/';
  const path = `/${cwd.join('/')}`;
  const homeDir = '/home/user';
  if (path === homeDir) {
    return '~';
  }
  if (path.startsWith(homeDir + '/')) {
    return `~${path.substring(homeDir.length)}`;
  }
  return path;
};

const Prompt: React.FC<{ cwd: string[] }> = ({ cwd }) => (
  <>
    <span className="text-ubuntu-green">user@linux</span>
    <span className="text-ubuntu-text">:</span>
    <span className="text-ubuntu-blue">{getDisplayPath(cwd)}</span>
    <span className="text-ubuntu-text">$ </span>
  </>
);

const Terminal: React.FC<TerminalProps> = ({ history, isLoading, onCommandSubmit, cwd, commandHistory, cwdContents }) => {
  const [inputValue, setInputValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(commandHistory.length);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [isLoading]);
  
  // Reset history index whenever a new command is submitted
  useEffect(() => {
    setHistoryIndex(commandHistory.length);
  }, [commandHistory.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading || !inputValue.trim()) return;
    onCommandSubmit(inputValue);
    setInputValue('');
  };

  const handleTerminalClick = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIndex = Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInputValue(commandHistory[newIndex] || '');
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIndex = Math.min(commandHistory.length, historyIndex + 1);
      setHistoryIndex(newIndex);
      setInputValue(commandHistory[newIndex] || '');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const parts = inputValue.split(' ');
      const currentArg = parts.pop() || '';
      
      if (!currentArg) return;

      const matches = cwdContents.filter(item => item.name.startsWith(currentArg));
      
      if (matches.length === 1) {
        const match = matches[0];
        const newInputValue = [...parts, match.name].join(' ') + (match.type === 'directory' ? '/' : ' ');
        setInputValue(newInputValue);
      } else if (matches.length > 1) {
        let commonPrefix = '';
        const firstMatch = matches[0].name;
        for (let i = 0; i < firstMatch.length; i++) {
          const char = firstMatch[i];
          if (matches.every(match => match.name[i] === char)) {
            commonPrefix += char;
          } else {
            break;
          }
        }
        if (commonPrefix.length > currentArg.length) {
            const newInputValue = [...parts, commonPrefix].join(' ');
            setInputValue(newInputValue);
        }
      }
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Title Bar */}
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
        </div>
        <div className="text-gray-300 text-sm">linux@terminal: {getDisplayPath(cwd)} | by divyansh</div>
        <div className="w-16"></div>
      </div>

      {/* Terminal Content */}
      <div
        className="flex-1 p-2 md:p-4 overflow-y-auto text-sm md:text-base selection:bg-green-600 selection:text-white"
        onClick={handleTerminalClick}
      >
        {history.map((item) => (
          <div key={item.id} className="whitespace-pre-wrap break-words leading-relaxed">
            {item.type === 'command' ? (
              <div className="flex items-center">
                <span className="text-ubuntu-green">user@linux</span>
                <span className="text-ubuntu-text">:</span>
                <span className="text-ubuntu-blue">{item.prompt}</span>
                <span className="text-ubuntu-text">$ </span>
                <span className="flex-shrink min-w-0">{item.text}</span>
              </div>
            ) : (
              <span className="text-ubuntu-text">{item.text}</span>
            )}
          </div>
        ))}

        {!isLoading && (
          <form onSubmit={handleSubmit} className="flex items-center">
            <Prompt cwd={cwd} />
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-transparent border-none text-ubuntu-text focus:outline-none w-full"
              autoFocus
              disabled={isLoading}
              autoCapitalize="none"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          </form>
        )}
        
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};

export default Terminal;
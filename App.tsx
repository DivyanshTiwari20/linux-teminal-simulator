import React, { useState, useRef, useCallback, useMemo } from 'react';
import Terminal from './components/Terminal';
import type { HistoryItem, FileSystem, FSNode } from './types';
import { processCommand, initialFileSystem } from './services/commandService';

const initialMessages = [
  "Welcome to the Linux Web Terminal!",
  "Type 'help' to see a list of locally supported commands.",
  // "Use ArrowUp/ArrowDown for command history and Tab for autocompletion."
];

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

const getNodeByPath = (path: string[], fs: FileSystem): FSNode | null => {
  let current: FSNode = fs;
  for (const part of path) {
    if (current.type === 'directory' && current.children[part]) {
      current = current.children[part];
    } else {
      return null;
    }
  }
  return current;
};


const App: React.FC = () => {
  
  const [history, setHistory] = useState<HistoryItem[]>(
    initialMessages.map((text, id) => ({ id, type: 'output', text }))
  );
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filesystem, setFilesystem] = useState<FileSystem>(initialFileSystem);
  const [cwd, setCwd] = useState<string[]>(['home', 'user']);
  const nextId = useRef(history.length);

  const addHistoryItem = useCallback((item: Omit<HistoryItem, 'id'>) => {
    setHistory(prev => [...prev, { ...item, id: nextId.current++ }]);
  }, []);
  
  const handleCommandSubmit = useCallback(async (command: string) => {
    const trimmedCommand = command.trim();
    if (isLoading || !trimmedCommand) return;

    addHistoryItem({ type: 'command', text: trimmedCommand, prompt: getDisplayPath(cwd) });
    setCommandHistory(prev => [...prev, trimmedCommand]);

    if (trimmedCommand.toLowerCase() === 'clear') {
      setHistory([]);
      nextId.current = 0;
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await processCommand(trimmedCommand, filesystem, cwd);
      if (result.output) {
         addHistoryItem({ type: 'output', text: result.output });
      }
      if (result.newFs) {
        setFilesystem(result.newFs);
      }
      if (result.newCwd) {
        setCwd(result.newCwd);
      }
    } catch (error) {
       addHistoryItem({ type: 'output', text: `Error: ${(error as Error).message}` });
    } finally {
      setIsLoading(false);
    }
  }, [addHistoryItem, isLoading, filesystem, cwd]);

  const cwdContents = useMemo(() => {
    const currentNode = getNodeByPath(cwd, filesystem);
    if (currentNode && currentNode.type === 'directory') {
      return Object.entries(currentNode.children).map(([name, node]) => ({
        name,
        type: node.type,
      }));
    }
    return [];
  }, [cwd, filesystem]);

  return (
    <div className="bg-ubuntu-bg text-ubuntu-text font-mono w-screen h-screen overflow-hidden flex flex-col">
      {/* <header className="bg-gray-800 text-center p-2 text-xs md:text-sm text-gray-400">
        Linux Terminal (Build by divyansh)
      </header> */}
      <main className="flex-grow min-h-0">
        <Terminal
          history={history}
          isLoading={isLoading}
          onCommandSubmit={handleCommandSubmit}
          cwd={cwd}
          commandHistory={commandHistory}
          cwdContents={cwdContents}
        />
      </main>
    </div>
  );
};

export default App;
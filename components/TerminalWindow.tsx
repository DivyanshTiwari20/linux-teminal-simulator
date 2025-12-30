import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import type { HistoryItem, FileSystem } from '../types';
import { processCommand, initialFileSystem } from '../services/commandService';

interface TerminalWindowProps {
    id: string;
    position: { x: number; y: number };
    size: { width: number; height: number };
    isMaximized: boolean;
    zIndex: number;
    onClose: () => void;
    onMinimize: () => void;
    onMaximize: () => void;
    onFocus: () => void;
    onPositionChange: (pos: { x: number; y: number }) => void;
    onSizeChange: (size: { width: number; height: number }) => void;
}

const initialMessages = [
    "Welcome to the Linux Web Terminal!",
    "Type 'help' to see a list of locally supported commands.",
];

const getDisplayPath = (cwd: string[]): string => {
    if (!cwd.length) return '/';
    const path = `/${cwd.join('/')}`;
    const homeDir = '/home/user';
    if (path === homeDir) return '~';
    if (path.startsWith(homeDir + '/')) return `~${path.substring(homeDir.length)}`;
    return path;
};

const getNodeByPath = (path: string[], fs: FileSystem): any => {
    let current: any = fs;
    for (const part of path) {
        if (current.type === 'directory' && current.children[part]) {
            current = current.children[part];
        } else {
            return null;
        }
    }
    return current;
};

const Prompt: React.FC<{ cwd: string[] }> = ({ cwd }) => (
    <>
        <span className="text-ubuntu-green">user@ubuntu</span>
        <span className="text-ubuntu-text">:</span>
        <span className="text-ubuntu-blue">{getDisplayPath(cwd)}</span>
        <span className="text-ubuntu-text">$ </span>
    </>
);

const TerminalWindow: React.FC<TerminalWindowProps> = ({
    id,
    position,
    size,
    isMaximized,
    zIndex,
    onClose,
    onMinimize,
    onMaximize,
    onFocus,
    onPositionChange,
    onSizeChange,
}) => {
    const [history, setHistory] = useState<HistoryItem[]>(
        initialMessages.map((text, id) => ({ id, type: 'output', text }))
    );
    const [commandHistory, setCommandHistory] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [filesystem, setFilesystem] = useState<FileSystem>(initialFileSystem);
    const [cwd, setCwd] = useState<string[]>(['home', 'user']);
    const [inputValue, setInputValue] = useState('');
    const [historyIndex, setHistoryIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

    const nextId = useRef(history.length);
    const terminalEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const windowRef = useRef<HTMLDivElement>(null);

    const cwdContents = useMemo(() => {
        const currentNode = getNodeByPath(cwd, filesystem);
        if (currentNode && currentNode.type === 'directory') {
            return Object.entries(currentNode.children).map(([name, node]: [string, any]) => ({
                name,
                type: node.type,
            }));
        }
        return [];
    }, [cwd, filesystem]);

    useEffect(() => {
        terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [history, isLoading]);

    useEffect(() => {
        inputRef.current?.focus();
    }, [isLoading]);

    useEffect(() => {
        setHistoryIndex(commandHistory.length);
    }, [commandHistory.length]);

    // Dragging logic
    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newX = e.clientX - dragOffset.x;
            const newY = Math.max(32, e.clientY - dragOffset.y); // Keep below top panel
            onPositionChange({ x: newX, y: newY });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, dragOffset, onPositionChange]);

    // Resizing logic
    useEffect(() => {
        if (!isResizing) return;

        const handleMouseMove = (e: MouseEvent) => {
            const newWidth = Math.max(400, resizeStart.width + (e.clientX - resizeStart.x));
            const newHeight = Math.max(300, resizeStart.height + (e.clientY - resizeStart.y));
            onSizeChange({ width: newWidth, height: newHeight });
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, resizeStart, onSizeChange]);

    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.window-controls')) return;
        onFocus();
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        e.stopPropagation();
        onFocus();
        setIsResizing(true);
        setResizeStart({
            x: e.clientX,
            y: e.clientY,
            width: size.width,
            height: size.height,
        });
    };

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isLoading || !inputValue.trim()) return;
        handleCommandSubmit(inputValue);
        setInputValue('');
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

    const handleTerminalClick = () => {
        inputRef.current?.focus();
        onFocus();
    };

    const windowStyle: React.CSSProperties = isMaximized
        ? { top: 32, left: 0, width: '100vw', height: 'calc(100vh - 32px)', zIndex }
        : { top: position.y, left: position.x, width: size.width, height: size.height, zIndex };

    return (
        <div
            ref={windowRef}
            className={`terminal-window ${isMaximized ? 'maximized' : ''}`}
            style={windowStyle}
            onClick={handleTerminalClick}
        >
            {/* Title Bar */}
            <div className="terminal-titlebar" onMouseDown={handleMouseDown}>
                <div className="window-controls">
                    <button className="window-btn close" onClick={onClose} title="Close">
                        <svg viewBox="0 0 12 12"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="2" /></svg>
                    </button>
                    <button className="window-btn minimize" onClick={onMinimize} title="Minimize">
                        <svg viewBox="0 0 12 12"><path d="M1 6h10" stroke="currentColor" strokeWidth="2" /></svg>
                    </button>
                    <button className="window-btn maximize" onClick={onMaximize} title="Maximize">
                        <svg viewBox="0 0 12 12"><rect x="1" y="1" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg>
                    </button>
                </div>
                <div className="terminal-title">user@ubuntu: {getDisplayPath(cwd)}</div>
                <div className="titlebar-spacer"></div>
            </div>

            {/* Terminal Content */}
            <div className="terminal-content" style={{ scrollbarWidth: 'none' }}>
                {history.map((item) => (
                    <div key={item.id} className="terminal-line">
                        {item.type === 'command' ? (
                            <div className="command-line">
                                <span className="text-ubuntu-green">user@ubuntu</span>
                                <span className="text-ubuntu-text">:</span>
                                <span className="text-ubuntu-blue">{item.prompt}</span>
                                <span className="text-ubuntu-text">$ </span>
                                <span>{item.text}</span>
                            </div>
                        ) : (
                            <span className="text-ubuntu-text">{item.text}</span>
                        )}
                    </div>
                ))}

                {/* Always show the input line - just like real Linux terminal */}
                <form onSubmit={handleSubmit} className="terminal-input-line">
                    <Prompt cwd={cwd} />
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="terminal-input"
                        autoFocus
                        disabled={isLoading}
                        autoCapitalize="none"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck="false"
                    />
                </form>

                <div ref={terminalEndRef} />
            </div>

            {/* Resize Handle */}
            {!isMaximized && (
                <div className="resize-handle" onMouseDown={handleResizeMouseDown}>
                    <svg viewBox="0 0 12 12">
                        <path d="M10 2L2 10M10 6L6 10M10 10L10 10" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                </div>
            )}
        </div>
    );
};

export default TerminalWindow;

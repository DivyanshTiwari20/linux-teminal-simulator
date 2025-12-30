import React, { useState } from 'react';
import TerminalWindow from './TerminalWindow.tsx';
import TopPanel from './TopPanel.tsx';
import Dock from './Dock.tsx';
import Minesweeper from './Minesweeper.tsx';

interface OpenWindow {
    id: string;
    type: 'terminal';
    position: { x: number; y: number };
    size: { width: number; height: number };
    isMinimized: boolean;
    isMaximized: boolean;
    zIndex: number;
}

const Desktop: React.FC = () => {
    const [windows, setWindows] = useState<OpenWindow[]>([]);
    const [highestZIndex, setHighestZIndex] = useState(100);
    const [showMinesweeper, setShowMinesweeper] = useState(false);

    const openTerminal = () => {
        const existingTerminal = windows.find(w => w.type === 'terminal' && w.isMinimized);
        if (existingTerminal) {
            restoreWindow(existingTerminal.id);
            return;
        }

        const newWindow: OpenWindow = {
            id: `terminal-${Date.now()}`,
            type: 'terminal',
            position: { x: 100 + windows.length * 30, y: 80 + windows.length * 30 },
            size: { width: 800, height: 500 },
            isMinimized: false,
            isMaximized: false,
            zIndex: highestZIndex + 1,
        };
        setHighestZIndex(prev => prev + 1);
        setWindows(prev => [...prev, newWindow]);
    };

    const closeWindow = (id: string) => {
        setWindows(prev => prev.filter(w => w.id !== id));
    };

    const minimizeWindow = (id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, isMinimized: true } : w
        ));
    };

    const maximizeWindow = (id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, isMaximized: !w.isMaximized } : w
        ));
    };

    const restoreWindow = (id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, isMinimized: false, zIndex: highestZIndex + 1 } : w
        ));
        setHighestZIndex(prev => prev + 1);
    };

    const focusWindow = (id: string) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, zIndex: highestZIndex + 1 } : w
        ));
        setHighestZIndex(prev => prev + 1);
    };

    const updateWindowPosition = (id: string, position: { x: number; y: number }) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, position } : w
        ));
    };

    const updateWindowSize = (id: string, size: { width: number; height: number }) => {
        setWindows(prev => prev.map(w =>
            w.id === id ? { ...w, size } : w
        ));
    };

    const openWindows = windows.filter(w => !w.isMinimized);

    return (
        <div className="desktop-container">
            {/* Ubuntu Wallpaper Background */}
            <div className="desktop-background"></div>

            {/* Top Panel */}
            <TopPanel />

            {/* Desktop Icons */}
            <div className="desktop-icons">
                <div className="desktop-icon" onClick={openTerminal}>
                    <div className="desktop-icon-image terminal-icon">
                        <svg viewBox="0 0 48 48" fill="none">
                            <rect x="4" y="8" width="40" height="32" rx="4" fill="#300a24" />
                            <path d="M12 20L18 26L12 32" stroke="#4E9A06" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="22" y1="32" x2="36" y2="32" stroke="#EEEEEC" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                    <span className="desktop-icon-label">Terminal</span>
                </div>

                <div className="desktop-icon" onClick={() => setShowMinesweeper(true)}>
                    <div className="desktop-icon-image" style={{
                        background: '#c0c0c0',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '32px',
                        border: '2px solid',
                        borderColor: '#ffffff #808080 #808080 #ffffff',
                    }}>
                        💣
                    </div>
                    <span className="desktop-icon-label">Minesweeper</span>
                </div>
            </div>

            {/* Windows */}
            {openWindows.map(window => (
                <TerminalWindow
                    key={window.id}
                    id={window.id}
                    position={window.position}
                    size={window.size}
                    isMaximized={window.isMaximized}
                    zIndex={window.zIndex}
                    onClose={() => closeWindow(window.id)}
                    onMinimize={() => minimizeWindow(window.id)}
                    onMaximize={() => maximizeWindow(window.id)}
                    onFocus={() => focusWindow(window.id)}
                    onPositionChange={(pos) => updateWindowPosition(window.id, pos)}
                    onSizeChange={(size) => updateWindowSize(window.id, size)}
                    onOpenMinesweeper={() => setShowMinesweeper(true)}
                />
            ))}

            {/* Dock */}
            <Dock
                onTerminalClick={openTerminal}
                openWindows={windows}
                onWindowClick={restoreWindow}
                onMinesweeperClick={() => setShowMinesweeper(true)}
            />

            {/* Minesweeper Game */}
            {showMinesweeper && (
                <Minesweeper onClose={() => setShowMinesweeper(false)} />
            )}
        </div>
    );
};

export default Desktop;

import React from 'react';

interface OpenWindow {
    id: string;
    type: 'terminal';
    isMinimized: boolean;
}

interface DockProps {
    onTerminalClick: () => void;
    openWindows: OpenWindow[];
    onWindowClick: (id: string) => void;
}

const Dock: React.FC<DockProps> = ({ onTerminalClick, openWindows }) => {
    const hasOpenTerminal = openWindows.some(w => w.type === 'terminal');

    return (
        <div className="dock">
            <div className="dock-container">
                {/* Files (placeholder) */}
                <div className="dock-item" title="Files">
                    <div className="dock-icon files-icon">
                        <svg viewBox="0 0 48 48" fill="none">
                            <path d="M8 12C8 10.8954 8.89543 10 10 10H20L24 14H38C39.1046 14 40 14.8954 40 16V36C40 37.1046 39.1046 38 38 38H10C8.89543 38 8 37.1046 8 36V12Z" fill="#5294E2" />
                            <path d="M8 16H40V36C40 37.1046 39.1046 38 38 38H10C8.89543 38 8 37.1046 8 36V16Z" fill="#73B9F9" />
                        </svg>
                    </div>
                </div>

                {/* Terminal */}
                <div
                    className={`dock-item ${hasOpenTerminal ? 'active' : ''}`}
                    title="Terminal"
                    onClick={onTerminalClick}
                >
                    <div className="dock-icon terminal-dock-icon">
                        <svg viewBox="0 0 48 48" fill="none">
                            <rect x="4" y="8" width="40" height="32" rx="4" fill="#300a24" />
                            <path d="M12 20L18 26L12 32" stroke="#4E9A06" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                            <line x1="22" y1="32" x2="36" y2="32" stroke="#EEEEEC" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                    </div>
                    {hasOpenTerminal && <div className="dock-indicator"></div>}
                </div>

                {/* Firefox (placeholder) */}
                <div className="dock-item" title="Firefox">
                    <div className="dock-icon firefox-icon">
                        <svg viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="18" fill="url(#firefox-gradient)" />
                            <path d="M24 8C15.163 8 8 15.163 8 24s7.163 16 16 16 16-7.163 16-16S32.837 8 24 8z" fill="url(#firefox-gradient2)" />
                            <defs>
                                <linearGradient id="firefox-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                    <stop offset="0%" stopColor="#FF9500" />
                                    <stop offset="100%" stopColor="#FF3D00" />
                                </linearGradient>
                                <linearGradient id="firefox-gradient2" x1="0%" y1="100%" x2="100%" y2="0%">
                                    <stop offset="0%" stopColor="#FF3D00" />
                                    <stop offset="50%" stopColor="#FF9500" />
                                    <stop offset="100%" stopColor="#FFCD02" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                </div>

                {/* Settings (placeholder) */}
                <div className="dock-item" title="Settings">
                    <div className="dock-icon settings-icon">
                        <svg viewBox="0 0 48 48" fill="none">
                            <circle cx="24" cy="24" r="16" fill="#555" />
                            <circle cx="24" cy="24" r="8" fill="#888" />
                            <path d="M24 4V10M24 38V44M44 24H38M10 24H4M38.14 9.86L33.9 14.1M14.1 33.9L9.86 38.14M38.14 38.14L33.9 33.9M14.1 14.1L9.86 9.86" stroke="#555" strokeWidth="4" strokeLinecap="round" />
                        </svg>
                    </div>
                </div>

                <div className="dock-separator"></div>

                {/* Show Applications */}
                <div className="dock-item show-apps" title="Show Applications">
                    <div className="dock-icon show-apps-icon">
                        <svg viewBox="0 0 48 48" fill="none">
                            <circle cx="12" cy="12" r="4" fill="white" />
                            <circle cx="24" cy="12" r="4" fill="white" />
                            <circle cx="36" cy="12" r="4" fill="white" />
                            <circle cx="12" cy="24" r="4" fill="white" />
                            <circle cx="24" cy="24" r="4" fill="white" />
                            <circle cx="36" cy="24" r="4" fill="white" />
                            <circle cx="12" cy="36" r="4" fill="white" />
                            <circle cx="24" cy="36" r="4" fill="white" />
                            <circle cx="36" cy="36" r="4" fill="white" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dock;

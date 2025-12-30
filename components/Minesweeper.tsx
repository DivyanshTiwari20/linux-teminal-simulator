import React, { useState, useEffect } from 'react';

interface Cell {
    isMine: boolean;
    isRevealed: boolean;
    isFlagged: boolean;
    neighborMines: number;
}

interface MinesweeperProps {
    onClose: () => void;
}

type Difficulty = 'beginner' | 'intermediate' | 'expert';

const DIFFICULTIES = {
    beginner: { rows: 9, cols: 9, mines: 10 },
    intermediate: { rows: 16, cols: 16, mines: 40 },
    expert: { rows: 16, cols: 30, mines: 99 },
};

const Minesweeper: React.FC<MinesweeperProps> = ({ onClose }) => {
    const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
    const [board, setBoard] = useState<Cell[][]>([]);
    const [gameOver, setGameOver] = useState(false);
    const [gameWon, setGameWon] = useState(false);
    const [firstClick, setFirstClick] = useState(true);
    const [flagsRemaining, setFlagsRemaining] = useState(DIFFICULTIES.beginner.mines);
    const [timer, setTimer] = useState(0);
    const [timerActive, setTimerActive] = useState(false);
    const [faceState, setFaceState] = useState<'smile' | 'surprised' | 'dead' | 'cool'>('smile');
    const [isDragging, setIsDragging] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth / 2 - 200, y: window.innerHeight / 2 - 250 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

    const { rows, cols, mines } = DIFFICULTIES[difficulty];

    useEffect(() => {
        let interval: number | undefined;
        if (timerActive && !gameOver && !gameWon) {
            interval = window.setInterval(() => {
                setTimer((prev) => Math.min(prev + 1, 999));
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [timerActive, gameOver, gameWon]);

    useEffect(() => {
        resetGame();
    }, [difficulty]);

    useEffect(() => {
        if (!isDragging) return;

        const handleMouseMove = (e: MouseEvent) => {
            setPosition({
                x: e.clientX - dragOffset.x,
                y: Math.max(0, e.clientY - dragOffset.y),
            });
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
    }, [isDragging, dragOffset]);

    const handleTitleBarMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.xp-btn')) return;
        setIsDragging(true);
        setDragOffset({
            x: e.clientX - position.x,
            y: e.clientY - position.y,
        });
    };

    const initializeBoard = (safeRow: number, safeCol: number): Cell[][] => {
        const newBoard: Cell[][] = Array(rows).fill(null).map(() =>
            Array(cols).fill(null).map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
            }))
        );

        // Place mines randomly, avoiding the safe cell and its neighbors
        let minesPlaced = 0;
        while (minesPlaced < mines) {
            const row = Math.floor(Math.random() * rows);
            const col = Math.floor(Math.random() * cols);

            const isSafeZone = Math.abs(row - safeRow) <= 1 && Math.abs(col - safeCol) <= 1;

            if (!newBoard[row][col].isMine && !isSafeZone) {
                newBoard[row][col].isMine = true;
                minesPlaced++;
            }
        }

        // Calculate neighbor mine counts
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!newBoard[row][col].isMine) {
                    let count = 0;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            const newRow = row + dr;
                            const newCol = col + dc;
                            if (
                                newRow >= 0 && newRow < rows &&
                                newCol >= 0 && newCol < cols &&
                                newBoard[newRow][newCol].isMine
                            ) {
                                count++;
                            }
                        }
                    }
                    newBoard[row][col].neighborMines = count;
                }
            }
        }

        return newBoard;
    };

    const resetGame = () => {
        const { rows, cols, mines } = DIFFICULTIES[difficulty];
        setBoard(Array(rows).fill(null).map(() =>
            Array(cols).fill(null).map(() => ({
                isMine: false,
                isRevealed: false,
                isFlagged: false,
                neighborMines: 0,
            }))
        ));
        setGameOver(false);
        setGameWon(false);
        setFirstClick(true);
        setFlagsRemaining(mines);
        setTimer(0);
        setTimerActive(false);
        setFaceState('smile');
    };

    const revealCell = (row: number, col: number, currentBoard: Cell[][]): Cell[][] => {
        if (
            row < 0 || row >= rows || col < 0 || col >= cols ||
            currentBoard[row][col].isRevealed ||
            currentBoard[row][col].isFlagged
        ) {
            return currentBoard;
        }

        const newBoard = currentBoard.map(r => r.map(c => ({ ...c })));
        newBoard[row][col].isRevealed = true;

        if (newBoard[row][col].neighborMines === 0 && !newBoard[row][col].isMine) {
            for (let dr = -1; dr <= 1; dr++) {
                for (let dc = -1; dc <= 1; dc++) {
                    if (dr !== 0 || dc !== 0) {
                        const result = revealCell(row + dr, col + dc, newBoard);
                        for (let i = 0; i < rows; i++) {
                            for (let j = 0; j < cols; j++) {
                                newBoard[i][j] = result[i][j];
                            }
                        }
                    }
                }
            }
        }

        return newBoard;
    };

    const handleCellClick = (row: number, col: number) => {
        if (gameOver || gameWon || board[row]?.[col]?.isFlagged || board[row]?.[col]?.isRevealed) {
            return;
        }

        if (firstClick) {
            const initializedBoard = initializeBoard(row, col);
            const revealedBoard = revealCell(row, col, initializedBoard);
            setBoard(revealedBoard);
            setFirstClick(false);
            setTimerActive(true);
            checkWin(revealedBoard);
            return;
        }

        if (board[row][col].isMine) {
            const newBoard = board.map(r => r.map(c => ({ ...c, isRevealed: true })));
            setBoard(newBoard);
            setGameOver(true);
            setTimerActive(false);
            setFaceState('dead');
            return;
        }

        const newBoard = revealCell(row, col, board);
        setBoard(newBoard);
        checkWin(newBoard);
    };

    const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
        e.preventDefault();
        if (gameOver || gameWon || board[row]?.[col]?.isRevealed) {
            return;
        }

        const newBoard = board.map(r => r.map(c => ({ ...c })));
        newBoard[row][col].isFlagged = !newBoard[row][col].isFlagged;
        setBoard(newBoard);
        setFlagsRemaining(prev => newBoard[row][col].isFlagged ? prev - 1 : prev + 1);
    };

    const handleCellMouseDown = () => {
        if (!gameOver && !gameWon) {
            setFaceState('surprised');
        }
    };

    const handleCellMouseUp = () => {
        if (!gameOver && !gameWon) {
            setFaceState('smile');
        }
    };

    const checkWin = (currentBoard: Cell[][]) => {
        let allNonMinesRevealed = true;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (!currentBoard[row]?.[col]?.isMine && !currentBoard[row]?.[col]?.isRevealed) {
                    allNonMinesRevealed = false;
                    break;
                }
            }
            if (!allNonMinesRevealed) break;
        }

        if (allNonMinesRevealed) {
            setGameWon(true);
            setTimerActive(false);
            setFaceState('cool');
        }
    };

    const formatNumber = (num: number): string => {
        return String(Math.max(-99, Math.min(999, num))).padStart(3, '0').replace(/-/, '-');
    };

    const getCellContent = (cell: Cell) => {
        if (!cell.isRevealed) {
            return cell.isFlagged ? '🚩' : '';
        }
        if (cell.isMine) {
            return '💣';
        }
        if (cell.neighborMines === 0) {
            return '';
        }
        return cell.neighborMines.toString();
    };

    const getNumberColor = (num: number): string => {
        const colors: { [key: number]: string } = {
            1: '#0000FF',
            2: '#008000',
            3: '#FF0000',
            4: '#000080',
            5: '#800000',
            6: '#008080',
            7: '#000000',
            8: '#808080',
        };
        return colors[num] || '#000000';
    };

    const getFaceEmoji = (): string => {
        switch (faceState) {
            case 'surprised': return '😮';
            case 'dead': return '😵';
            case 'cool': return '😎';
            default: return '🙂';
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: position.y,
            left: position.x,
            zIndex: 1000,
            fontFamily: '"MS Sans Serif", "Segoe UI", Tahoma, sans-serif',
            userSelect: 'none',
        }}>
            {/* Window Container */}
            <div style={{
                background: '#c0c0c0',
                border: '3px solid',
                borderColor: '#ffffff #808080 #808080 #ffffff',
                boxShadow: '1px 1px 0 #000',
            }}>
                {/* Title Bar */}
                <div
                    onMouseDown={handleTitleBarMouseDown}
                    style={{
                        background: 'linear-gradient(90deg, #000080 0%, #1084d0 100%)',
                        padding: '3px 4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'grab',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                    }}>
                        <span style={{ fontSize: '14px' }}>💣</span>
                        <span style={{
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '12px',
                        }}>Minesweeper</span>
                    </div>
                    <button
                        className="xp-btn"
                        onClick={onClose}
                        style={{
                            width: '21px',
                            height: '21px',
                            background: '#c0c0c0',
                            border: '2px solid',
                            borderColor: '#ffffff #808080 #808080 #ffffff',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            fontFamily: 'inherit',
                        }}
                    >
                        ✕
                    </button>
                </div>

                {/* Menu Bar */}
                <div style={{
                    background: '#c0c0c0',
                    padding: '2px 4px',
                    borderBottom: '1px solid #808080',
                }}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <span style={{ fontSize: '12px', cursor: 'pointer' }}>
                            <u>G</u>ame
                        </span>
                        <span style={{ fontSize: '12px', cursor: 'pointer' }}>
                            <u>H</u>elp
                        </span>
                    </div>
                </div>

                {/* Difficulty Selector */}
                <div style={{
                    background: '#c0c0c0',
                    padding: '4px 8px',
                    display: 'flex',
                    gap: '8px',
                    borderBottom: '1px solid #808080',
                }}>
                    {(['beginner', 'intermediate', 'expert'] as Difficulty[]).map((diff) => (
                        <button
                            key={diff}
                            onClick={() => setDifficulty(diff)}
                            style={{
                                padding: '2px 8px',
                                background: difficulty === diff ? '#000080' : '#c0c0c0',
                                color: difficulty === diff ? 'white' : 'black',
                                border: '2px solid',
                                borderColor: difficulty === diff
                                    ? '#808080 #ffffff #ffffff #808080'
                                    : '#ffffff #808080 #808080 #ffffff',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontFamily: 'inherit',
                            }}
                        >
                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Game Area */}
                <div style={{
                    padding: '8px',
                    background: '#c0c0c0',
                }}>
                    {/* Header with counters and face */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '4px',
                        marginBottom: '8px',
                        background: '#bdbdbd',
                        border: '3px solid',
                        borderColor: '#808080 #ffffff #ffffff #808080',
                    }}>
                        {/* Mine Counter */}
                        <div style={{
                            background: '#000',
                            color: '#ff0000',
                            fontFamily: 'Monaco, "Courier New", monospace',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            padding: '2px 4px',
                            letterSpacing: '2px',
                            border: '1px solid #808080',
                        }}>
                            {formatNumber(flagsRemaining)}
                        </div>

                        {/* Face Button */}
                        <button
                            onClick={resetGame}
                            style={{
                                width: '36px',
                                height: '36px',
                                background: '#c0c0c0',
                                border: '3px solid',
                                borderColor: '#ffffff #808080 #808080 #ffffff',
                                cursor: 'pointer',
                                fontSize: '20px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            {getFaceEmoji()}
                        </button>

                        {/* Timer */}
                        <div style={{
                            background: '#000',
                            color: '#ff0000',
                            fontFamily: 'Monaco, "Courier New", monospace',
                            fontSize: '24px',
                            fontWeight: 'bold',
                            padding: '2px 4px',
                            letterSpacing: '2px',
                            border: '1px solid #808080',
                        }}>
                            {formatNumber(timer)}
                        </div>
                    </div>

                    {/* Game Board */}
                    <div style={{
                        border: '3px solid',
                        borderColor: '#808080 #ffffff #ffffff #808080',
                        display: 'inline-block',
                    }}>
                        {board.map((row, rowIndex) => (
                            <div key={rowIndex} style={{ display: 'flex' }}>
                                {row.map((cell, colIndex) => (
                                    <div
                                        key={`${rowIndex}-${colIndex}`}
                                        onClick={() => handleCellClick(rowIndex, colIndex)}
                                        onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
                                        onMouseDown={handleCellMouseDown}
                                        onMouseUp={handleCellMouseUp}
                                        onMouseLeave={handleCellMouseUp}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            border: cell.isRevealed
                                                ? '1px solid #808080'
                                                : '3px solid',
                                            borderColor: cell.isRevealed
                                                ? '#808080'
                                                : '#ffffff #808080 #808080 #ffffff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            background: cell.isRevealed
                                                ? (cell.isMine && gameOver ? '#ff0000' : '#c0c0c0')
                                                : '#c0c0c0',
                                            fontSize: cell.isFlagged || cell.isMine ? '12px' : '14px',
                                            fontWeight: 'bold',
                                            color: cell.isRevealed && !cell.isMine ? getNumberColor(cell.neighborMines) : '#000',
                                            boxSizing: 'border-box',
                                        }}
                                    >
                                        {getCellContent(cell)}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Status Bar */}
                <div style={{
                    background: '#c0c0c0',
                    padding: '2px 4px',
                    borderTop: '1px solid #808080',
                    fontSize: '11px',
                }}>
                    {gameWon ? '🎉 Congratulations! You won!' : gameOver ? '💥 Game Over! Click the face to try again.' : 'Left click to reveal, right click to flag'}
                </div>
            </div>
        </div>
    );
};

export default Minesweeper;

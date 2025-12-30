import { GoogleGenerativeAI } from "@google/generative-ai";
import type { FileSystem, Directory, FSNode } from '../types';

export const initialFileSystem: FileSystem = {
  type: 'directory',
  children: {
    home: {
      type: 'directory',
      children: {
        user: {
          type: 'directory',
          children: {
            'Projects': { type: 'directory', children: {} },
            'Documents': { type: 'directory', children: {} },
            'README.md': { type: 'file', content: '# Welcome to your Linux Web Terminal!\n\n- This is a simulated terminal environment made by @divyansh_ai (on X formally twitter).\n- Try commands like `ls`, `mkdir test`, `cd Projects`, `touch new_file.txt`, `cat README.md`' }
          }
        }
      }
    }
  }
};

const deepClone = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const getHelpMessage = () => `Locally supported commands:
  help       Show this help message
  clear      Clear the terminal screen
  whoami     Print the current user
  pwd        Print the current working directory
  ls [path]  List directory contents
  cd [path]  Change directory
  mkdir <dir>   Create a new directory
  touch <file>  Create a new empty file
  cat <file>    Concatenate and display files
  echo          Display a line of text
  neofetch      Show system information
  
Games (type to play):
  snake         Play the classic Snake game
  2048          Play 2048 number puzzle
  guess         Number guessing game
  tictactoe     Play Tic Tac Toe vs Computer
  hangman       Play Hangman word game
  fortune       Get a random fortune
  cowsay <msg>  Make a cow say something
  cmatrix       Show Matrix-style animation`;

const getNeofetchOutput = (): string => `
  ________________________________________ 
 ( Why do Chinese people like among us ?? )
 ( That's the only place they can vote.)
  ---------------------------------------- 
         o   ^__^
          o  (oo)\\_______
             (__)\\       )\\/\\             user@webtop
                 ||----w |                 -----------
                 ||     ||                 OS: Ubuntu 22.04.3 LTS x86_64
                                           Host: Your Browser
                                           Kernel: 6.x.x-generic
                                           Uptime: a few minutes
                                           Packages: 1337 (dpkg)
                                           Shell: bash 5.1.16
                                           Resolution: 1920x1080
                                           Terminal: ReactTerm
 `;

// Fortune messages
const fortunes = [
  "The only way to do great work is to love what you do. - Steve Jobs",
  "In the middle of difficulty lies opportunity. - Albert Einstein",
  "Code is like humor. When you have to explain it, it's bad. - Cory House",
  "First, solve the problem. Then, write the code. - John Johnson",
  "Experience is the name everyone gives to their mistakes. - Oscar Wilde",
  "The best error message is the one that never shows up. - Thomas Fuchs",
  "Programming isn't about what you know; it's about what you can figure out. - Chris Pine",
  "The most disastrous thing that you can ever learn is your first programming language. - Alan Kay",
  "Simplicity is the soul of efficiency. - Austin Freeman",
  "Any fool can write code that a computer can understand. Good programmers write code that humans can understand. - Martin Fowler",
  "Talk is cheap. Show me the code. - Linus Torvalds",
  "Sometimes it pays to stay in bed on Monday, rather than spending the rest of the week debugging Monday's code. - Dan Salomon",
  "There are only two kinds of programming languages: those people always complain about and those nobody uses.",
  "Linux is only free if your time has no value. - Jamie Zawinski",
  "Given enough eyeballs, all bugs are shallow. - Linus's Law"
];

const getFortune = (): string => {
  return fortunes[Math.floor(Math.random() * fortunes.length)];
};

const getCowsay = (message: string): string => {
  const msg = message || "Moo!";
  const borderLen = msg.length + 2;
  const top = ' ' + '_'.repeat(borderLen);
  const bottom = ' ' + '-'.repeat(borderLen);
  return `${top}
< ${msg} >
${bottom}
        \\   ^__^
         \\  (oo)\\_______
            (__)\\       )\\/\\
                ||----w |
                ||     ||`;
};

const getCmatrix = (): string => {
  const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789';
  let output = '\x1b[32m'; // Green color (may not work in all terminals)
  for (let i = 0; i < 15; i++) {
    let line = '';
    for (let j = 0; j < 60; j++) {
      line += chars[Math.floor(Math.random() * chars.length)];
    }
    output += line + '\n';
  }
  output += '\n[Press Ctrl+C to exit in a real terminal]\n';
  output += 'Matrix simulation displayed. In real cmatrix, this runs continuously.';
  return output;
};

const get2048 = (): string => {
  // Generate a simple 2048 game state display
  const emptyBoard = [
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ];

  // Add two random starting tiles
  const positions = [];
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      positions.push([i, j]);
    }
  }

  const pos1 = positions.splice(Math.floor(Math.random() * positions.length), 1)[0];
  const pos2 = positions.splice(Math.floor(Math.random() * positions.length), 1)[0];

  emptyBoard[pos1[0]][pos1[1]] = Math.random() < 0.9 ? 2 : 4;
  emptyBoard[pos2[0]][pos2[1]] = Math.random() < 0.9 ? 2 : 4;

  let output = `
╔════════════════════════════════════════╗
║              2048 GAME                 ║
╠════════════════════════════════════════╣
`;

  for (const row of emptyBoard) {
    output += '║  ';
    for (const cell of row) {
      const cellStr = cell === 0 ? '·' : cell.toString();
      output += cellStr.padStart(4, ' ') + '  ';
    }
    output += '  ║\n';
  }

  output += `╠════════════════════════════════════════╣
║  Use arrow keys to move tiles          ║
║  Combine same numbers to reach 2048!   ║
║  Score: 0                              ║
╚════════════════════════════════════════╝

Note: This is a display demo. Full interactive 2048 
requires a dedicated game mode (coming soon!).
Type 'help' for other commands.`;

  return output;
};

const getGuessGame = (): string => {
  const secretNumber = Math.floor(Math.random() * 100) + 1;
  return `
🎮 NUMBER GUESSING GAME
═══════════════════════════════════════
I'm thinking of a number between 1 and 100.

The secret number is: ${secretNumber}

In a full implementation, you would type guesses
and I would tell you "higher" or "lower".

Here's a hint: The number ${secretNumber > 50 ? 'is greater than 50' : 'is 50 or less'}.

To play interactively, this would require game mode.
For now, the answer was revealed above! 🎉

Type 'help' for other commands.`;
};

const hangmanWords = ['javascript', 'terminal', 'ubuntu', 'linux', 'python', 'coding', 'developer', 'computer', 'keyboard', 'algorithm'];

const getHangman = (): string => {
  const word = hangmanWords[Math.floor(Math.random() * hangmanWords.length)];
  const revealed = word.split('').map(() => '_').join(' ');

  return `
╔═══════════════════════════════════════╗
║         HANGMAN WORD GAME             ║
╠═══════════════════════════════════════╣
║                                       ║
║      ┌──────┐                         ║
║      │      │                         ║
║      │      O                         ║
║      │     /|\\                        ║
║      │     / \\                        ║
║      │                                ║
║   ═══╧═══                             ║
║                                       ║
║   Word: ${revealed.padEnd(25, ' ')} ║
║   Letters guessed: none               ║
║                                       ║
║   Hint: It's a ${word.length}-letter word!         ║
║   The word was: ${word.padEnd(21, ' ')} ║
╚═══════════════════════════════════════╝

Interactive mode coming soon!
Type 'help' for other commands.`;
};

const getTicTacToe = (): string => {
  const moves = ['X', 'O', 'X', 'O', 'X'];
  const board = [' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' '];

  // Random X placement
  const xPos = Math.floor(Math.random() * 9);
  board[xPos] = 'X';

  return `
╔═══════════════════════════════════════╗
║          TIC TAC TOE                  ║
╠═══════════════════════════════════════╣
║                                       ║
║         ${board[0]} │ ${board[1]} │ ${board[2]}                     ║
║        ───┼───┼───                    ║
║         ${board[3]} │ ${board[4]} │ ${board[5]}                     ║
║        ───┼───┼───                    ║
║         ${board[6]} │ ${board[7]} │ ${board[8]}                     ║
║                                       ║
║   You are X, Computer is O            ║
║   Enter position (1-9) to play        ║
║                                       ║
║   Position map:                       ║
║    1 │ 2 │ 3                          ║
║   ───┼───┼───                         ║
║    4 │ 5 │ 6                          ║
║   ───┼───┼───                         ║
║    7 │ 8 │ 9                          ║
║                                       ║
╚═══════════════════════════════════════╝

Interactive mode coming soon!
Type 'help' for other commands.`;
};

const getSnake = (): string => {
  return `
╔═══════════════════════════════════════════════════╗
║                   SNAKE GAME                      ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║   ┌─────────────────────────────────────────┐     ║
║   │ · · · · · · · · · · · · · · · · · · · · │     ║
║   │ · · · · · · · · · · · · · · · · · · · · │     ║
║   │ · · · · · · · · · · · · · · · · · · · · │     ║
║   │ · · · · ████████ · · · · · · · · · · · │     ║
║   │ · · · · · · · · · · · · · ● · · · · · · │     ║
║   │ · · · · · · · · · · · · · · · · · · · · │     ║
║   │ · · · · · · · · · · · · · · · · · · · · │     ║
║   │ · · · · · · · · · · · · · · · · · · · · │     ║
║   └─────────────────────────────────────────┘     ║
║                                                   ║
║   Controls: ↑ ↓ ← → (Arrow Keys)                  ║
║   Score: 0  |  High Score: 42                     ║
║   ● = Food  |  ████ = Snake                       ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

🐍 Welcome to Snake!
Use arrow keys to control the snake.
Eat the food (●) to grow longer.
Don't hit the walls or yourself!

Interactive game mode coming soon!
Type 'help' for other commands.`;
};


const resolvePath = (path: string, cwd: string[]): string[] => {
  if (path.startsWith('/')) {
    return path.split('/').filter(p => p);
  }
  const newPath = [...cwd];
  const parts = path.split('/').filter(p => p);
  for (const part of parts) {
    if (part === '.') continue;
    if (part === '..') {
      if (newPath.length > 0) newPath.pop();
    } else {
      newPath.push(part);
    }
  }
  return newPath;
};

const getNode = (path: string[], fs: FileSystem): FSNode | null => {
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

const getParentNode = (path: string[], fs: FileSystem): Directory | null => {
  if (path.length === 0) return null;
  const parentPath = path.slice(0, -1);
  const parent = getNode(parentPath, fs);
  return parent?.type === 'directory' ? parent : null;
}

export const processCommand = async (
  command: string,
  fs: FileSystem,
  cwd: string[]
): Promise<{ output: string; newFs?: FileSystem; newCwd?: string[] }> => {
  const [cmd, ...args] = command.trim().split(' ');
  const newFs = deepClone(fs);

  switch (cmd.toLowerCase()) {
    case 'help': return { output: getHelpMessage() };
    case 'whoami': return { output: 'user' };
    case 'date': return { output: new Date().toString() };
    case 'echo': return { output: args.join(' ') };
    case 'neofetch': return { output: getNeofetchOutput() };
    case '': return { output: '' };

    // Games and fun commands
    case 'fortune': return { output: getFortune() };
    case 'cowsay': return { output: getCowsay(args.join(' ')) };
    case 'cmatrix': return { output: getCmatrix() };
    case 'snake': return { output: getSnake() };
    case '2048': return { output: get2048() };
    case 'guess': return { output: getGuessGame() };
    case 'tictactoe': return { output: getTicTacToe() };
    case 'hangman': return { output: getHangman() };

    case 'pwd':
      return { output: '/' + cwd.join('/') };

    case 'ls': {
      const pathArg = args[0] || '.';
      const targetPath = pathArg.startsWith('/') ? resolvePath(pathArg, []) : resolvePath(pathArg, cwd);
      const node = getNode(targetPath, fs);
      if (!node) return { output: `ls: cannot access '${pathArg}': No such file or directory` };
      if (node.type !== 'directory') return { output: pathArg };
      return { output: Object.keys(node.children).sort().join('\n') };
    }

    case 'cd': {
      const pathArg = args[0] || '..';
      if (pathArg === '~') {
        return { output: '', newCwd: ['home', 'user'] };
      }
      const targetPath = resolvePath(pathArg, cwd);
      const node = getNode(targetPath, fs);
      if (!node) return { output: `cd: ${pathArg}: No such file or directory` };
      if (node.type !== 'directory') return { output: `cd: ${pathArg}: Not a directory` };
      return { output: '', newCwd: targetPath };
    }

    case 'mkdir': {
      if (!args[0]) return { output: 'mkdir: missing operand' };
      const newDirName = args[0];
      const newDirPath = resolvePath(newDirName, cwd);
      const dirName = newDirPath[newDirPath.length - 1];
      const parent = getParentNode(newDirPath, newFs);
      if (!parent) return { output: `mkdir: cannot create directory '${newDirName}': No such file or directory` };
      if (parent.children[dirName]) return { output: `mkdir: cannot create directory '${newDirName}': File exists` };

      parent.children[dirName] = { type: 'directory', children: {} };
      return { output: '', newFs };
    }

    case 'touch': {
      if (!args[0]) return { output: 'touch: missing file operand' };
      const newFileName = args[0];
      const newFilePath = resolvePath(newFileName, cwd);
      const fileName = newFilePath[newFilePath.length - 1];
      const parent = getParentNode(newFilePath, newFs);
      if (!parent) return { output: `touch: cannot touch '${newFileName}': No such file or directory` };
      if (!parent.children[fileName]) {
        parent.children[fileName] = { type: 'file', content: '' };
      }
      return { output: '', newFs };
    }

    case 'cat': {
      if (!args[0]) return { output: '' };
      const filePath = resolvePath(args[0], cwd);
      const node = getNode(filePath, fs);
      if (!node) return { output: `cat: ${args[0]}: No such file or directory` };
      if (node.type === 'directory') return { output: `cat: ${args[0]}: Is a directory` };
      return { output: node.content };
    }

    default:
      try {
        const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
          return {
            output: `Error: VITE_GEMINI_API_KEY is not configured. AI-powered commands are disabled.
Please set the VITE_GEMINI_API_KEY environment variable in your .env.local file.` };
        }

        const ai = new GoogleGenerativeAI(apiKey);
        const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

        const prompt = `You are an Ubuntu terminal simulator. A user has typed the following command: \`${command}\`.
Provide a realistic, plausible, and concise output for this command as if it were executed in a standard Ubuntu 22.04 terminal.
Do not explain the command, do not add any introductory text like "Here is the output:", and do not add any markdown formatting (like \`\`\`).
Only provide the raw, simulated terminal output.
If the command is invalid or would produce an error, return a realistic error message (e.g., 'bash: ${cmd}: command not found').
If the command would produce no output (like 'sudo apt update'), return an empty string.`;

        const result = await model.generateContent(prompt);
        const response = result.response;

        return { output: response.text() };
      } catch (error) {
        console.error("Error calling Gemini API:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        return { output: `Error: ${errorMessage}` };
      }
  }
};
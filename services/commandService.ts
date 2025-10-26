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
  help      Show this help message
  clear     Clear the terminal screen
  whoami    Print the current user
  pwd       Print the current working directory
  ls [path] List directory contents
  cd [path] Change directory
  mkdir <dir> Create a new directory
  touch <file> Create a new empty file
  cat <file> Concatenate and display files
  echo      Display a line of text
  neofetch  Show system information`;

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
          return { output: `Error: VITE_GEMINI_API_KEY is not configured. AI-powered commands are disabled.
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
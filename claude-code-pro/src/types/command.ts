/**
 * 命令类型定义
 */

export type CommandType = 'builtin' | 'custom';

export interface CommandParam {
  name: string;
  description?: string;
  required?: boolean;
  default?: string;
}

export interface Command {
  name: string;
  type: CommandType;
  description: string;
  params?: CommandParam[];
  content?: string;
  filePath?: string;
}

export interface ParsedCommand {
  raw: string;
  name: string;
  args: string[];
  fileRefs: string[];
  fullCommand?: string;
}

export interface CommandResult {
  type: 'command' | 'message';
  command?: ParsedCommand;
  message?: string;
  error?: string;
}

/**
 * 内置命令定义
 */
export const builtinCommands: Command[] = [
  {
    name: 'commands',
    type: 'builtin',
    description: '列出所有可用命令',
  },
  {
    name: 'help',
    type: 'builtin',
    description: '显示帮助信息',
  },
  {
    name: 'compact',
    type: 'builtin',
    description: '切换紧凑模式',
  },
];

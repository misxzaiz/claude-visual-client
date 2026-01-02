/**
 * 命令服务 - 处理命令解析和参数替换
 */

import type { Command, CommandResult, ParsedCommand } from '../types/command';

/**
 * 解析命令输入
 * 支持格式:
 *   /command_name
 *   /command_name arg1 arg2
 *   /command_name @file1.txt @file2.txt
 */
export function parseCommandInput(input: string, availableCommands: Command[]): CommandResult {
  const trimmed = input.trim();

  // 检查是否是命令（以 / 开头）
  if (!trimmed.startsWith('/')) {
    return { type: 'message', message: trimmed };
  }

  // 提取命令名称和参数
  const parts = trimmed.slice(1).split(/\s+/);
  const commandName = parts[0];
  const args = parts.slice(1);

  // 查找命令
  const command = availableCommands.find(cmd => cmd.name === commandName);

  // 提取文件引用（@语法）
  const fileRefs: string[] = [];
  const regularArgs: string[] = [];

  args.forEach(arg => {
    if (arg.startsWith('@')) {
      fileRefs.push(arg.slice(1));
    } else {
      regularArgs.push(arg);
    }
  });

  const parsed: ParsedCommand = {
    raw: trimmed,
    name: commandName,
    args: regularArgs,
    fileRefs,
  };

  // 未知命令：直接透传给 CLI 处理
  if (!command) {
    return { type: 'command', command: parsed };
  }

  // 处理内置命令
  if (command.type === 'builtin') {
    return { type: 'command', command: parsed };
  }

  // 处理自定义命令
  if (command.content) {
    const replaced = replaceCommandArguments(command.content, regularArgs, fileRefs);
    parsed.fullCommand = replaced;
    return { type: 'command', command: parsed };
  }

  return { type: 'command', command: parsed };
}

/**
 * 替换命令参数
 * 支持的占位符:
 *   $ARGUMENTS - 所有参数
 *   $0 - 命令名称
 *   $1, $2, ... - 位置参数
 *   $@ - 所有参数（各自引用）
 *   ${n} - 位置参数（带花括号）
 */
export function replaceCommandArguments(
  template: string,
  args: string[],
  fileRefs: string[]
): string {
  let result = template;

  // 处理文件引用前缀
  if (fileRefs.length > 0) {
    const filePrefix = fileRefs.map(f => `@${f}`).join(' ');
    result = filePrefix + ' ' + result;
  }

  // 替换 $ARGUMENTS
  result = result.replace(/\$ARGUMENTS/g, args.join(' '));

  // 替换 $@（所有参数作为独立引用）
  result = result.replace(/\$@/g, args.join(' '));

  // 替换 $0（命令名称，通常不需要，但保持兼容性）
  // result = result.replace(/\$0/g, commandName);

  // 替换位置参数 $1, $2, $3, ...
  result = result.replace(/\$(\d+)/g, (_, index) => {
    const idx = parseInt(index, 10) - 1;
    return args[idx] || '';
  });

  // 替换花括号形式 ${n}
  result = result.replace(/\$\{(\d+)\}/g, (_, index) => {
    const idx = parseInt(index, 10) - 1;
    return args[idx] || '';
  });

  return result;
}

/**
 * 生成命令列表消息
 */
export function generateCommandsListMessage(commands: Command[]): string {
  const builtin = commands.filter(c => c.type === 'builtin');
  const custom = commands.filter(c => c.type === 'custom');

  let message = '## 可用命令\n\n';

  if (builtin.length > 0) {
    message += '### 内置命令\n\n';
    builtin.forEach(cmd => {
      message += `- **/${cmd.name}** - ${cmd.description}\n`;
    });
    message += '\n';
  }

  if (custom.length > 0) {
    message += '### 自定义命令\n\n';
    custom.forEach(cmd => {
      message += `- **/${cmd.name}** - ${cmd.description}`;
      if (cmd.params && cmd.params.length > 0) {
        const params = cmd.params.map(p => p.name).join(' ');
        message += ` (\`${params}\`)`;
      }
      message += '\n';
    });
  }

  message += '\n使用 `/命令名 参数` 来执行命令。';

  return message;
}

/**
 * 生成帮助消息
 */
export function generateHelpMessage(): string {
  return `## 帮助

### 斜杠命令
- 输入 \`/\` 可以快速访问命令
- \`/commands\` - 列出所有可用命令
- \`/help\` - 显示此帮助信息

### 文件引用
- 使用 \`@文件名\` 可以引用工作区中的文件
- 例如: \`@src/main.ts\` 会引用该文件内容

### 示例
- \`/help\` - 显示帮助
- \`/commands\` - 列出所有命令
- \`@README.md 请解释这个项目\` - 引用文件并提问
`;
}

/**
 * 文件搜索服务 - 用于 @file 引用
 */

import { invoke } from '@tauri-apps/api/core';

export interface FileMatch {
  name: string;
  path: string;
  is_dir: boolean;
  extension?: string;
}

/**
 * 在工作区中搜索文件
 * @param query 搜索关键词（文件名）
 * @param workDir 工作目录
 * @param maxResults 最大结果数
 */
export async function searchFiles(
  query: string,
  workDir: string | null,
  maxResults: number = 10
): Promise<FileMatch[]> {
  if (!workDir || !query.trim()) {
    return [];
  }

  const lowerQuery = query.toLowerCase();

  try {
    const files = await invoke<any[]>('read_directory', { path: workDir });

    const results: FileMatch[] = [];

    // 递归搜索（简化版，只搜索当前目录和一层子目录）
    async function searchRecursive(entries: any[], depth: number = 0) {
      if (depth > 2 || results.length >= maxResults) return;

      for (const entry of entries) {
        if (results.length >= maxResults) break;

        const name = entry.name.toLowerCase();

        // 匹配文件名
        if (name.includes(lowerQuery)) {
          results.push({
            name: entry.name,
            path: entry.path,
            is_dir: entry.is_dir,
            extension: entry.extension,
          });
        }

        // 如果是目录，递归搜索
        if (entry.is_dir && depth < 2) {
          try {
            const subFiles = await invoke<any[]>('read_directory', { path: entry.path });
            await searchRecursive(subFiles, depth + 1);
          } catch {
            // 忽略无法访问的目录
          }
        }
      }
    }

    await searchRecursive(files);

    return results;
  } catch (error) {
    console.error('Failed to search files:', error);
    return [];
  }
}

/**
 * 根据扩展名过滤文件
 */
export function filterByExtension(
  files: FileMatch[],
  extensions: string[]
): FileMatch[] {
  const extSet = new Set(extensions.map(e => e.toLowerCase()));
  return files.filter(f =>
    !f.is_dir && (!f.extension || extSet.has(f.extension))
  );
}

/**
 * 只返回文件（不包括目录）
 */
export function filesOnly(matches: FileMatch[]): FileMatch[] {
  return matches.filter(m => !m.is_dir);
}

/**
 * 只返回目录
 */
export function directoriesOnly(matches: FileMatch[]): FileMatch[] {
  return matches.filter(m => m.is_dir);
}

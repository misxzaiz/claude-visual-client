/**
 * 编辑器面板组件
 */

import { useFileEditorStore } from '../../stores';
import { CodeMirrorEditor } from './Editor';
import { EditorHeader } from './EditorHeader';

interface EditorPanelProps {
  className?: string;
}

export function EditorPanel({ className = '' }: EditorPanelProps) {
  const { currentFile, setContent, saveFile, isOpen } = useFileEditorStore();

  if (!isOpen || !currentFile) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        <div className="flex-1 flex items-center justify-center text-text-tertiary text-sm">
          未打开文件
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-background-base ${className}`}>
      <EditorHeader />
      <div className="flex-1 overflow-hidden">
        <CodeMirrorEditor
          value={currentFile.content}
          language={currentFile.language}
          onChange={setContent}
          onSave={saveFile}
        />
      </div>
    </div>
  );
}

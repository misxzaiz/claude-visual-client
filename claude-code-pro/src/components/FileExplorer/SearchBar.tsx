import { useState, useEffect } from 'react';
import { useFileExplorerStore } from '../../stores';

export function SearchBar() {
  const { search_query, set_search_query } = useFileExplorerStore();
  const [localQuery, setLocalQuery] = useState(search_query);

  // 同步外部状态
  useEffect(() => {
    setLocalQuery(search_query);
  }, [search_query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    set_search_query(localQuery);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalQuery(e.target.value);
  };

  const handleClear = () => {
    setLocalQuery('');
    set_search_query('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-2 border-b border-border">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <input
          type="text"
          value={localQuery}
          onChange={handleChange}
          placeholder="搜索文件..."
          className="w-full pl-10 pr-10 py-1.5 bg-background-surface border border-border rounded-lg text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />
        
        {localQuery && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-tertiary hover:text-text-primary transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      
      {search_query && (
        <div className="mt-1 text-xs text-text-tertiary">
          找到 {useFileExplorerStore().file_tree.length} 个结果
        </div>
      )}
    </form>
  );
}
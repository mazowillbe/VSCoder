interface OperationLog {
  id: string;
  type: 'file_write' | 'file_read' | 'file_list' | 'command_execute' | 'error';
  timestamp: number;
  details: {
    path?: string;
    command?: string;
    exitCode?: number | null;
    output?: string;
    error?: string;
    filesWritten?: string[];
  };
}

interface OperationLogsProps {
  logs: OperationLog[];
  filesModified?: string[];
}

export default function OperationLogs({ logs, filesModified }: OperationLogsProps) {
  if ((!logs || logs.length === 0) && (!filesModified || filesModified.length === 0)) {
    return null;
  }

  const getLogIcon = (type: OperationLog['type']) => {
    switch (type) {
      case 'file_write':
        return '✏️';
      case 'file_read':
        return '📖';
      case 'file_list':
        return '📁';
      case 'command_execute':
        return '⚙️';
      case 'error':
        return '❌';
      default:
        return '•';
    }
  };

  const getLogLabel = (type: OperationLog['type']) => {
    switch (type) {
      case 'file_write':
        return 'File Write';
      case 'file_read':
        return 'File Read';
      case 'file_list':
        return 'List Files';
      case 'command_execute':
        return 'Command';
      case 'error':
        return 'Error';
      default:
        return 'Operation';
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-600 space-y-2">
      {filesModified && filesModified.length > 0 && (
        <div className="text-xs text-green-400 mb-3">
          <span className="font-semibold">✓ Files synced to WebContainer:</span>
          <div className="ml-2 space-y-1">
            {filesModified.map((file) => (
              <div key={file} className="text-green-300">{file}</div>
            ))}
          </div>
        </div>
      )}

      {logs && logs.length > 0 && (
        <div className="text-xs text-gray-400">
          <span className="font-semibold">Operations:</span>
          <div className="ml-2 space-y-1 mt-1">
            {logs.map((log) => (
              <div key={log.id} className="text-gray-300">
                <div className="flex items-start gap-2">
                  <span className="flex-shrink-0">{getLogIcon(log.type)}</span>
                  <div className="flex-1">
                    <span className="font-medium">{getLogLabel(log.type)}</span>
                    {log.details.path && (
                      <div className="text-gray-400 truncate">{log.details.path}</div>
                    )}
                    {log.details.command && (
                      <div className="text-gray-400 truncate">$ {log.details.command}</div>
                    )}
                    {log.details.error && (
                      <div className="text-red-400 text-xs">{log.details.error}</div>
                    )}
                    {log.details.exitCode !== undefined && log.details.exitCode !== null && (
                      <div className="text-gray-400 text-xs">
                        Exit code: {log.details.exitCode}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

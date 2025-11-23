import { useEffect, useRef, useState } from 'react';
import { usePreviewStore } from '../store/previewStore';

export default function PreviewModal() {
  const {
    previewUrls,
    activePreviewUrl,
    isModalOpen,
    isLoading,
    setActivePreviewUrl,
    closeModal
  } = usePreviewStore();

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isIframeLoading, setIsIframeLoading] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    if (activePreviewUrl && iframeRef.current) {
      setIsIframeLoading(true);
      setCanGoBack(false);
      setCanGoForward(false);
    }
  }, [activePreviewUrl]);

  const handleIframeLoad = () => {
    setIsIframeLoading(false);
    updateNavigationState();
  };

  const updateNavigationState = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        const history = iframeRef.current.contentWindow.history;
        setCanGoBack(history.length > 1);
        setCanGoForward(false); // Forward navigation is harder to detect reliably
      } catch {
        // Cross-origin restrictions
        setCanGoBack(false);
        setCanGoForward(false);
      }
    }
  };

  const handleBack = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.history.back();
        setTimeout(updateNavigationState, 100);
      } catch {
        console.warn('Cannot navigate back due to cross-origin restrictions');
      }
    }
  };

  const handleForward = () => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.history.forward();
        setTimeout(updateNavigationState, 100);
      } catch {
        console.warn('Cannot navigate forward due to cross-origin restrictions');
      }
    }
  };

  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsIframeLoading(true);
      iframeRef.current.src = iframeRef.current.src;
    }
  };

  const handleOpenInNewTab = () => {
    if (activePreviewUrl) {
      window.open(activePreviewUrl.url, '_blank');
    }
  };

  const handleUrlChange = (url: string) => {
    const preview = previewUrls.find(p => p.url === url);
    if (preview) {
      setActivePreviewUrl(preview.id);
    }
  };

  if (!isModalOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="w-full h-full max-w-7xl max-h-[90vh] bg-white rounded-lg shadow-2xl flex flex-col">
        {/* Browser-style header */}
        <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            {/* Browser controls */}
            <button
              onClick={handleBack}
              disabled={!canGoBack}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Back"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <button
              onClick={handleForward}
              disabled={!canGoForward}
              className="p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Forward"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            
            <button
              onClick={handleRefresh}
              className="p-2 rounded hover:bg-gray-200"
              title="Refresh"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {/* Address bar */}
          <div className="flex-1 mx-4">
            <select
              value={activePreviewUrl?.url || ''}
              onChange={(e) => handleUrlChange(e.target.value)}
              className="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {previewUrls.map((preview) => (
                <option key={preview.id} value={preview.url}>
                  {preview.title}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2">
            <button
              onClick={handleOpenInNewTab}
              className="p-2 rounded hover:bg-gray-200"
              title="Open in new tab"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
            
            <button
              onClick={closeModal}
              className="p-2 rounded hover:bg-gray-200"
              title="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Preview content */}
        <div className="flex-1 relative bg-gray-100">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">Loading preview...</p>
              </div>
            </div>
          )}
          
          {isIframeLoading && (
            <div className="absolute top-4 right-4 z-10 bg-white px-3 py-1 rounded-full shadow-md">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                <span className="text-xs text-gray-600">Loading...</span>
              </div>
            </div>
          )}

          {activePreviewUrl ? (
            <iframe
              ref={iframeRef}
              src={activePreviewUrl.url}
              className="w-full h-full border-0"
              onLoad={handleIframeLoad}
              onError={() => setIsIframeLoading(false)}
              title="Preview"
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <p className="text-lg font-medium">No preview URL available</p>
                <p className="text-sm mt-2">Run a dev server to see your preview here</p>
              </div>
            </div>
          )}
        </div>

        {/* Status bar */}
        {activePreviewUrl && (
          <div className="px-3 py-1 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
            <div className="flex items-center justify-between">
              <span>{activePreviewUrl.url}</span>
              <span>
                {previewUrls.length} preview{previewUrls.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

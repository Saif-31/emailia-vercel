import { useState } from 'react'

function ProcessModal({ isOpen, onClose, onProcess, isProcessing }) {
  const [maxResults, setMaxResults] = useState(10)

  if (!isOpen) return null

  const handleProcess = () => {
    onProcess(maxResults)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold text-textDark mb-4">Process New Emails</h2>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Emails to Process
          </label>
          <input
            type="range"
            min="1"
            max="50"
            value={maxResults}
            onChange={(e) => setMaxResults(parseInt(e.target.value))}
            className="w-full"
            disabled={isProcessing}
          />
          <div className="flex justify-between text-sm text-gray-600 mt-1">
            <span>1</span>
            <span className="font-semibold">{maxResults}</span>
            <span>50</span>
          </div>
        </div>

        {isProcessing && (
          <div className="mb-4 text-center text-sm text-gray-600">
            Processing emails...
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="btn-secondary flex-1"
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            onClick={handleProcess}
            className="btn-primary flex-1"
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing...' : 'Process'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProcessModal
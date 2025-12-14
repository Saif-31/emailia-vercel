import { useState, useEffect } from 'react';
import { X, Mail, CheckCircle, Loader2, Send, User } from 'lucide-react';

interface ProcessingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string;
  maxResults: number;
}

export default function ProcessingModal({ isOpen, onClose, userEmail, maxResults }: ProcessingModalProps) {
  const [status, setStatus] = useState('idle'); // idle, fetching, classifying, sending, complete, error
  const [currentStep, setCurrentStep] = useState('');
  const [progress, setProgress] = useState(0);
  const [emailsProcessed, setEmailsProcessed] = useState(0);
  const [totalEmails, setTotalEmails] = useState(0);
  const [currentSubject, setCurrentSubject] = useState('');
  const [currentDepartment, setCurrentDepartment] = useState('');
  const [currentRecipients, setCurrentRecipients] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen && status === 'idle') {
      startProcessing();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const getRecipientNames = (recipients: string[]) => {
    if (!recipients || recipients.length === 0) return 'No recipients';
    // Extract names from email addresses or use email
    return recipients.map(email => {
      const match = email.match(/^([^@]+)/);
      return match ? match[1].split('.').map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(' ') : email;
    }).join(', ');
  };

  const startProcessing = () => {
    setStatus('fetching');
    setProgress(0);
    setEmailsProcessed(0);
    setCurrentStep('Initializing connection...');

    const eventSource = new EventSource(
      `http://localhost:8000/api/emails/fetch-and-process-stream?user_email=${encodeURIComponent(userEmail)}&max_results=${maxResults}`
    );

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'status':
          setCurrentStep(data.message);
          setProgress((data.step / data.total) * 20); // First 20%
          break;

        case 'fetched':
          setTotalEmails(data.count);
          setStatus('fetching');
          setCurrentStep(`✅ Found ${data.count} unread email${data.count !== 1 ? 's' : ''}`);
          setProgress(25);
          setTimeout(() => {
            if (data.count > 0) {
              setStatus('classifying');
            }
          }, 1000);
          break;

        case 'processing':
          setStatus('classifying');
          setCurrentSubject(data.subject);
          setCurrentStep(`Analyzing email ${data.current} of ${data.total}...`);
          setProgress(25 + ((data.current - 1) / data.total) * 25); // 25-50%
          break;

        case 'classified':
          setCurrentDepartment(data.department);
          setCurrentRecipients(data.recipients || []);
          setCurrentStep(`📂 Classified as: ${data.department}`);
          setProgress(50 + (emailsProcessed / totalEmails) * 25); // 50-75%
          break;

        case 'replying':
          setStatus('sending');
          setCurrentStep(`📧 Sending auto-reply...`);
          setProgress(75 + (emailsProcessed / totalEmails) * 20); // 75-95%
          break;

        case 'replied':
          setCurrentStep(`✅ Auto-reply sent`);
          break;

        case 'email_complete':
          setEmailsProcessed(data.current);
          setProgress(25 + (data.current / data.total) * 70); // Update overall progress
          
          // ✅ Dispatch event for each email processed (real-time stats update)
          window.dispatchEvent(new Event('emailProcessed'));
          break;

        case 'complete':
          setStatus('complete');
          setCurrentStep(`🎉 Successfully processed ${data.processed} email${data.processed !== 1 ? 's' : ''}!`);
          setProgress(100);
          eventSource.close();

          // ✅ Dispatch custom event to notify Dashboard
          window.dispatchEvent(new Event('emailProcessed'));

          // Close modal after a delay (removed window.location.reload)
          setTimeout(() => {
            onClose();
          }, 2000);
          break;

        case 'error':
          setStatus('error');
          setErrorMessage(data.message);
          setCurrentStep('❌ An error occurred');
          eventSource.close();
          break;
      }
    };

    eventSource.onerror = () => {
      setStatus('error');
      setErrorMessage('Connection lost to server');
      setCurrentStep('❌ Connection failed');
      eventSource.close();
    };
  };

  if (!isOpen) return null;

  const getStatusColor = () => {
    switch (status) {
      case 'fetching': return 'text-blue-600';
      case 'classifying': return 'text-purple-600';
      case 'sending': return 'text-green-600';
      case 'complete': return 'text-green-700';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getProgressColor = () => {
    if (status === 'error') return 'bg-red-500';
    if (status === 'complete') return 'bg-green-500';
    return 'bg-blue-500';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Mail className="text-blue-600" size={24} />
            Processing Emails
          </h2>
          <button
            onClick={onClose}
            disabled={status !== 'complete' && status !== 'error'}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status Message */}
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {status === 'complete' ? (
                <CheckCircle className="text-green-500" size={48} />
              ) : status === 'error' ? (
                <X className="text-red-500" size={48} />
              ) : (
                <Loader2 className={`${getStatusColor()} animate-spin`} size={48} />
              )}
            </div>
            
            <p className={`text-lg font-semibold ${getStatusColor()} mb-2`}>
              {currentStep}
            </p>

            {/* Current Email Info */}
            {status === 'classifying' && currentSubject && (
              <div className="mt-4 p-3 bg-gray-50 rounded-lg text-left">
                <p className="text-sm text-gray-600 mb-1">Processing:</p>
                <p className="text-sm font-medium text-gray-800 truncate">{currentSubject}</p>
              </div>
            )}

            {/* Classification Result */}
            {status === 'sending' && currentDepartment && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-left space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="text-blue-600" size={16} />
                  <p className="text-sm text-gray-600">Routed to:</p>
                </div>
                <p className="text-base font-semibold text-blue-700">{currentDepartment}</p>
                {currentRecipients.length > 0 && (
                  <div className="flex items-start gap-2 mt-2">
                    <User className="text-gray-500 mt-0.5" size={14} />
                    <div>
                      <p className="text-xs text-gray-500">Recipients:</p>
                      <p className="text-sm text-gray-700">{getRecipientNames(currentRecipients)}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error Message */}
            {status === 'error' && errorMessage && (
              <div className="mt-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Email Counter */}
            {totalEmails > 0 && status !== 'complete' && (
              <p className="text-sm text-gray-500 mt-3">
                {emailsProcessed} of {totalEmails} processed
              </p>
            )}
          </div>

          {/* Progress Bar */}
          <div>
            <div className="mb-2 flex justify-between text-xs text-gray-600">
              <span>Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`${getProgressColor()} h-3 rounded-full transition-all duration-500 ease-out`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        {(status === 'complete' || status === 'error') && (
          <div className="p-6 border-t">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {status === 'complete' ? 'Done' : 'Close'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
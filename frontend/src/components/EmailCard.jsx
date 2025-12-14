import { formatDate, parseCategories, parseRecipients, getConfidenceBadgeClass, truncateText } from '../utils/helpers'

function EmailCard({ email }) {
  const categories = parseCategories(email.categories)
  const recipients = parseRecipients(email.recipients)

  return (
    <div className="card hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-semibold text-textDark text-lg">{email.subject}</h3>
          <p className="text-sm text-gray-600 mt-1">From: {email.sender}</p>
        </div>
        <span className={`badge ${getConfidenceBadgeClass(email.confidence)}`}>
          {Math.round(email.confidence * 100)}%
        </span>
      </div>

      <p className="text-sm text-gray-700 mb-3">
        {truncateText(email.content, 150)}
      </p>

      <div className="flex flex-wrap gap-2 mb-3">
        {categories.map((cat, idx) => (
          <span key={idx} className="badge badge-blue text-xs">
            {cat}
          </span>
        ))}
      </div>

      <div className="border-t pt-3 mt-3">
        <p className="text-xs text-gray-500 mb-2">Forwarded to:</p>
        <div className="flex flex-wrap gap-2">
          {recipients.map((recipient, idx) => (
            <span key={idx} className="text-xs bg-gray-100 px-2 py-1 rounded">
              {recipient}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-3 text-xs text-gray-400">
        {formatDate(email.created_at)}
      </div>
    </div>
  )
}

export default EmailCard
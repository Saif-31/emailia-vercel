import { Link, useLocation } from 'react-router-dom'

function Navbar({ userEmail, onLogout }) {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-primary">Emailia</h1>
            
            <div className="flex space-x-4">
              <Link
                to="/dashboard"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/dashboard')
                    ? 'bg-blue-50 text-primary'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Dashboard
              </Link>
              
              <Link
                to="/review-queue"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/review-queue')
                    ? 'bg-blue-50 text-primary'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                Review Queue
              </Link>
              
              <Link
                to="/history"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/history')
                    ? 'bg-blue-50 text-primary'
                    : 'text-gray-600 hover:text-primary hover:bg-gray-50'
                }`}
              >
                History
              </Link>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">{userEmail}</span>
            <button
              onClick={onLogout}
              className="btn-secondary text-sm"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar
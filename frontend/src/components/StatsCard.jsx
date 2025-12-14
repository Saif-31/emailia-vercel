function StatsCard({ title, value, subtitle, icon }) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-textDark mt-2">{value}</p>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="bg-blue-50 p-3 rounded-lg">
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}

export default StatsCard

import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string
  description: string
  icon: LucideIcon
  iconClassName?: string
}

function StatCard({
  title,
  value,
  description,
  icon: Icon,
  iconClassName = 'bg-emerald-50 text-emerald-600',
}: StatCardProps) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-500">
          {title}
        </span>

        <span className={`rounded-xl p-2.5 ${iconClassName}`}>
          <Icon size={20} />
        </span>
      </div>

      <p className="mt-4 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>

      <p className="mt-2 text-xs text-slate-500">
        {description}
      </p>
    </article>
  )
}

export default StatCard

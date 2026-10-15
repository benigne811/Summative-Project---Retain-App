
import type { ExpenseCategory } from '../../types/expense'

interface CategoryBadgeProps {
  category?: ExpenseCategory
}

function CategoryBadge({ category }: CategoryBadgeProps) {
  const color = category?.color ?? '#64748B'

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium"
      style={{
        color,
        backgroundColor: `${color}18`,
      }}
    >
      <span
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      {category?.name ?? 'Uncategorized'}
    </span>
  )
}

export default CategoryBadge

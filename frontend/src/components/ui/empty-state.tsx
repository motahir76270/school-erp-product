import { FileQuestion, FolderOpen, Search, Users, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-muted p-4 mb-4">
        {icon || <FileQuestion className="h-8 w-8 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description && <p className="mt-2 text-sm text-muted-foreground max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function NoStudentsFound({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-8 w-8 text-muted-foreground" />}
      title="No students found"
      description="Get started by adding your first student to the system."
      action={onAdd ? <button onClick={onAdd}>Add Student</button> : undefined}
    />
  );
}

export function NoTeachersFound({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<Users className="h-8 w-8 text-muted-foreground" />}
      title="No teachers found"
      description="Get started by adding your first teacher to the system."
      action={onAdd ? <button onClick={onAdd}>Add Teacher</button> : undefined}
    />
  );
}

export function NoBooksFound({ onAdd }: { onAdd?: () => void }) {
  return (
    <EmptyState
      icon={<BookOpen className="h-8 w-8 text-muted-foreground" />}
      title="No books found"
      description="Start building your library catalog."
      action={onAdd ? <button onClick={onAdd}>Add Book</button> : undefined}
    />
  );
}

export function NoDataFound() {
  return (
    <EmptyState
      icon={<FolderOpen className="h-8 w-8 text-muted-foreground" />}
      title="No data available"
      description="There's no data to display for the selected criteria."
    />
  );
}

export function NoSearchResults() {
  return (
    <EmptyState
      icon={<Search className="h-8 w-8 text-muted-foreground" />}
      title="No results found"
      description="Try adjusting your search or filter to find what you're looking for."
    />
  );
}

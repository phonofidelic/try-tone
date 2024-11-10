import clsx from 'clsx'

export function Button({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick: React.MouseEventHandler<HTMLButtonElement>
  className?: string
}) {
  return (
    <button
      className={clsx(
        'text-nowrap bg-white dark:bg-zinc-800 border border-zinc-200',
        className,
      )}
      onClick={onClick}
    >
      {children}
    </button>
  )
}

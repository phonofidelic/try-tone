export function Button({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: React.MouseEventHandler<HTMLButtonElement>
}) {
  return (
    <button className="text-nowrap" onClick={onClick}>
      {children}
    </button>
  )
}

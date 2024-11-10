export function CloseIcon({
  size,
  className,
}: {
  size: number
  className?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox={`0 0 24 24`}
      className={className}
    >
      <path
        fill="#000"
        d="M4.707 3.293 3.293 4.707 10.586 12l-7.293 7.293 1.414 1.414L12 13.414l7.293 7.293 1.414-1.414L13.414 12l7.293-7.293-1.414-1.414L12 10.586 4.707 3.293z"
      />
    </svg>
  )
}

export function EditIcon({
  size,
  className,
}: {
  size: number
  className?: string
}) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
    >
      <path d="M18.414 2a.995.995 0 0 0-.707.293L16 4l4 4 1.707-1.707a.999.999 0 0 0 0-1.414l-2.586-2.586A.996.996 0 0 0 18.414 2zM14.5 5.5 3 17v4h4L18.5 9.5l-4-4z" />
    </svg>
  )
}

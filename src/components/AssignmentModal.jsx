import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

function AssignmentModal({
  open,
  title,
  description,
  children,
  actions,
  onClose,
}) {
  const dialogRef = useRef(null)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      className="glass-surface m-auto w-[calc(100%-2rem)] max-w-2xl overflow-y-auto p-0 text-left text-slate-800"
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
    >
      <div className="flex items-start justify-between gap-4 border-b border-sky-100/80 px-5 py-5 sm:px-7">
        <div>
          <h2 className="text-xl font-semibold text-slate-900" id={titleId}>{title}</h2>
          {description && (
            <p className="mt-1 text-sm leading-6 text-slate-600" id={descriptionId}>
              {description}
            </p>
          )}
        </div>
        <button
          className="grid size-10 shrink-0 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-sky-50 hover:text-slate-900"
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
        >
          <X aria-hidden="true" size={19} />
        </button>
      </div>
      <div className="px-5 py-6 sm:px-7">{children}</div>
      {actions && (
        <div className="flex flex-col-reverse gap-3 border-t border-sky-100/80 px-5 py-4 sm:flex-row sm:justify-end sm:px-7">
          {actions}
        </div>
      )}
    </dialog>
  )
}

export default AssignmentModal

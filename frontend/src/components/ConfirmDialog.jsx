import { useEffect, useId, useRef } from 'react'
import { AlertTriangle } from 'lucide-react'

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
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
      className="glass-surface m-auto w-[calc(100%-2rem)] max-w-md overflow-y-auto p-0 text-left text-slate-800"
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => {
        event.preventDefault()
        onCancel()
      }}
    >
      <div className="p-6 sm:p-7">
        <span className="mb-4 grid size-11 place-items-center rounded-xl bg-amber-50 text-amber-700">
          <AlertTriangle aria-hidden="true" size={20} />
        </span>
        <h2 className="text-xl font-semibold text-slate-900" id={titleId}>{title}</h2>
        {description && (
          <p className="mt-2 text-sm leading-6 text-slate-600" id={descriptionId}>
            {description}
          </p>
        )}
        <div className="mt-7 flex flex-col-reverse justify-end gap-3 sm:flex-row">
          <button
            className="min-h-11 rounded-xl border border-sky-100 bg-white/80 px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-sky-50"
            type="button"
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            className="min-h-11 rounded-xl bg-cyan-700 px-4 text-sm font-semibold text-white transition-colors hover:bg-cyan-800"
            type="button"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </dialog>
  )
}

export default ConfirmDialog

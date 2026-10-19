type ActionErrorProps = { message: string; onDismiss: () => void };

export function ActionError({ message, onDismiss }: ActionErrorProps) {
  if (!message) return null;
  return (
    <div className="action-error" role="alert">
      <p>{message}</p>
      <button type="button" className="action-error-dismiss" onClick={onDismiss}>Dismiss</button>
    </div>
  );
}

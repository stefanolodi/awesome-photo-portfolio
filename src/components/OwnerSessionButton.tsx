import { useAuth } from '../hooks/useAuth';

export function OwnerSessionButton() {
  const { signOut } = useAuth();
  return (
    <button className="view-toggle" onClick={signOut} type="button">
      Sign out
    </button>
  );
}

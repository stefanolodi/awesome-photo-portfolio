import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function OwnerSessionButton() {
  const { signOut } = useAuth();
  const [hasFailed, setHasFailed] = useState(false);

  const handleSignOut = async () => {
    setHasFailed(false);
    try {
      const { error } = await signOut();
      if (error) setHasFailed(true);
    } catch {
      setHasFailed(true);
    }
  };

  return (
    <button className="view-toggle" onClick={() => void handleSignOut()} type="button">
      {hasFailed ? 'Sign out failed, try again' : 'Sign out'}
    </button>
  );
}

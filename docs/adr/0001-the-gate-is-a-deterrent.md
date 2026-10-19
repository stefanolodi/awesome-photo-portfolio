# The gate is a deterrent, not a security boundary

The gate keeps strangers who find the URL from browsing the archive. Its password is `VITE_GUEST_PASSWORD`, which Vite builds into the client bundle, and the unlocked state lives in `sessionStorage`. Anyone who reads the bundle can get past it. We accept that because only the Supabase policies protect private albums (ADR 0002), and a server-checked guest password would mean a guest session to issue and expire for no gain in privacy.

The same reasoning applies to downloads. The guest UI offers no download control and no link to the original file, but photos are plain images, and the app does not try to stop a guest who saves one from the browser.

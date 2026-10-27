-- SECURITY INVOKER keeps the owner-only delete policies on albums and photos in force, so a guest's call deletes nothing.
-- The function deletes the photo rows itself, so it works whatever photos_album_id_fkey does on delete.
-- It returns the Cloudinary public ids of the deleted photos and cover, for the client to clean up.
CREATE OR REPLACE FUNCTION "public"."delete_album"("album_id" "uuid") RETURNS "text"[]
    LANGUAGE "plpgsql" SECURITY INVOKER
    SET "search_path" TO ''
    AS $$
DECLARE
  photo_ids text[];
  cover_id text;
BEGIN
  WITH deleted AS (
    DELETE FROM public.photos WHERE photos.album_id = delete_album.album_id RETURNING public_id
  )
  SELECT coalesce(array_agg(public_id) FILTER (WHERE public_id <> ''), '{}') INTO photo_ids FROM deleted;

  DELETE FROM public.albums WHERE id = delete_album.album_id RETURNING cover_public_id INTO cover_id;
  -- Raising rolls back the photo deletes, so a caller the policies stop gets an error, not an empty success.
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Album % was not deleted', delete_album.album_id;
  END IF;

  IF cover_id <> '' THEN
    photo_ids := photo_ids || cover_id;
  END IF;
  RETURN photo_ids;
END; $$;


ALTER FUNCTION "public"."delete_album"("album_id" "uuid") OWNER TO "postgres";


GRANT ALL ON FUNCTION "public"."delete_album"("album_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_album"("album_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_album"("album_id" "uuid") TO "service_role";

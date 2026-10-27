ALTER TABLE "public"."albums" ADD COLUMN "is_featured" boolean NOT NULL DEFAULT false;

-- At most one album is featured. See "Featured album" in GLOSSARY.md.
CREATE UNIQUE INDEX "albums_one_featured" ON "public"."albums" USING "btree" ("is_featured") WHERE "is_featured";


-- SECURITY INVOKER keeps the albums_owner_update policy in force, so a guest's call changes no row.
CREATE OR REPLACE FUNCTION "public"."set_featured_album"("album_id" "uuid" DEFAULT NULL) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY INVOKER
    SET "search_path" TO ''
    AS $$ BEGIN
  UPDATE public.albums SET is_featured = false WHERE is_featured;
  IF album_id IS NOT NULL THEN
    UPDATE public.albums SET is_featured = true WHERE id = album_id;
  END IF;
END; $$;


ALTER FUNCTION "public"."set_featured_album"("album_id" "uuid") OWNER TO "postgres";


GRANT ALL ON FUNCTION "public"."set_featured_album"("album_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_featured_album"("album_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_featured_album"("album_id" "uuid") TO "service_role";

-- Fix security: Set search_path for the avatar update function
DROP TRIGGER IF EXISTS avatar_archetypes_updated_at ON avatar_archetypes;
DROP FUNCTION IF EXISTS update_avatar_archetypes_updated_at() CASCADE;

CREATE OR REPLACE FUNCTION update_avatar_archetypes_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER avatar_archetypes_updated_at
  BEFORE UPDATE ON avatar_archetypes
  FOR EACH ROW
  EXECUTE FUNCTION update_avatar_archetypes_updated_at();
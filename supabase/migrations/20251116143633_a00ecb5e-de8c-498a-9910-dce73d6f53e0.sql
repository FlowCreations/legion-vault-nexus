-- Recreate missing trigger for auto-updating user activity
DROP TRIGGER IF EXISTS auto_update_user_activity_trigger ON events;

CREATE TRIGGER auto_update_user_activity_trigger
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION auto_update_user_activity();
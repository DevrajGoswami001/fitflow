-- Allow authenticated users to delete their own workouts
CREATE POLICY "Allow delete for owner"
ON workouts
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

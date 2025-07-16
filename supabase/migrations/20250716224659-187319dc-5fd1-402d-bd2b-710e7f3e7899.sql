-- Вызываем edge function для создания задач на завтра
SELECT
  net.http_post(
      url:='https://ggxbrxqpjafvytpdhxrs.supabase.co/functions/v1/duplicate-daily-tasks',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdneGJyeHFwamFmdnl0cGRoeHJzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE3NDYxNDQsImV4cCI6MjA2NzMyMjE0NH0.CyouuQYeb3nsZ0xbrzC7sFF3bUl6MvgjqQnaRWiz3OY"}'::jsonb,
      body:='{"trigger": "manual"}'::jsonb
  ) as request_id;
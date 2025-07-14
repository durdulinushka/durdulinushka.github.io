-- Create profiles for any existing users that don't have profiles
INSERT INTO public.profiles (id, user_id, full_name, email, department, position)
SELECT 
  u.id,
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  u.email,
  'Не указан',
  'Сотрудник'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
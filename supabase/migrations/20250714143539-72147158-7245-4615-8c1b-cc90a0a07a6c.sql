-- Предоставляем права администратора пользователю dashzam@mail.ru
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'dashzam@mail.ru';
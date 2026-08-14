# Dashboard Studio — Configuración de autenticación

## URLs de producción
- Aplicación: `https://eagarcia77.github.io/dashboard-studio/`
- Supabase: `https://jpmxezxjgcpmvlylwjbh.supabase.co`
- Callback OAuth: `https://jpmxezxjgcpmvlylwjbh.supabase.co/auth/v1/callback`

## Supabase Auth
En **Authentication > URL Configuration** configure:
- Site URL: `https://eagarcia77.github.io/dashboard-studio/`
- Redirect URL: `https://eagarcia77.github.io/dashboard-studio/`

## Proveedores
El frontend está preparado para:
- Email y contraseña
- Google
- Microsoft / Azure
- Apple

Google, Microsoft y Apple requieren sus Client IDs/Secrets externos y deben habilitarse en **Supabase Authentication > Providers**.

## Administrador
No se asigna un administrador automáticamente. Registre primero la cuenta que será administradora y luego promueva específicamente ese perfil a `role = admin` mediante una operación administrativa segura.

## Seguridad
- El navegador usa únicamente una clave publishable de Supabase.
- Las credenciales privilegiadas permanecen en Supabase Edge Functions.
- RLS limita los dashboards a su propietario y permite acceso administrativo mediante el rol `admin`.
- La Edge Function `admin-users` gestiona suspensión/activación, roles y eliminación de usuarios.

'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await signIn('credentials', {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError('Credenciales incorrectas');
    } else {
      try {
        const sessionRes = await fetch('/api/auth/session');
        const sessionData = await sessionRes.json();
        const role = sessionData?.user?.role;

        console.log('🎯 Rol detectado en sesión:', role);

        if (role === 'ADMIN') {
          router.push('/dashboard');
        } else if (role === 'AGENTE') {
          router.push('/panel-agente');
        } else if (role === 'LUGAR') {
          router.push('/zona-lugar');
        } else {
          router.push('/unauthorized');
        }
      } catch (err) {
        console.error('Error obteniendo sesión:', err);
        router.push('/unauthorized');
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 px-4">
      <form
        onSubmit={handleLogin}
        className="bg-white p-6 rounded shadow-md w-full max-w-sm"
      >
        <h1 className="text-xl font-bold text-center mb-4 text-blue-900">Iniciar sesión</h1>

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <label className="block text-sm mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 mb-3 border rounded text-black"
          required
        />

        <label className="block text-sm mb-1">Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 mb-4 border rounded text-black"
          required
        />

        <button
          type="submit"
          className="w-full bg-blue-800 text-white py-2 rounded hover:bg-blue-900"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}
<p className="mt-3 text-[11px] text-slate-400 text-center">
  ¿Has olvidado tu contraseña?{" "}
  <button
    type="button"
    onClick={() => router.push("/recuperar-clave")}
    className="text-emerald-300 hover:text-emerald-200 underline-offset-2 hover:underline"
  >
    Recuperar acceso
  </button>
</p>

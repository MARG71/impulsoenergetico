export default function UnauthorizedPage() {
  return (
    <div className="flex items-center justify-center min-h-screen text-center">
      <div>
        <h1 className="text-3xl font-bold text-red-600 mb-4">Acceso no autorizado</h1>
        <p className="text-lg text-gray-700">No tienes permisos para acceder a esta sección.</p>
      </div>
    </div>
  );
}

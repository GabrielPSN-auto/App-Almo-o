import { Link, Outlet, useLocation } from "react-router-dom";
import { Utensils, BarChart3 } from "lucide-react";
import { clsx } from "clsx";

export default function Layout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Utensils className="h-6 w-6 text-indigo-600" />
                <span className="ml-2 text-xl font-semibold text-slate-900">Almoço Escola</span>
              </div>
              <div className="ml-6 flex space-x-8">
                <Link
                  to="/"
                  className={clsx(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    location.pathname === "/"
                      ? "border-indigo-500 text-slate-900"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  )}
                >
                  Registro
                </Link>
                <Link
                  to="/dados"
                  className={clsx(
                    "inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium",
                    location.pathname === "/dados"
                      ? "border-indigo-500 text-slate-900"
                      : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
                  )}
                >
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Dados
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

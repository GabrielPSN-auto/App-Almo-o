import React, { useState } from "react";
import { format } from "date-fns";
import { Save, XCircle, CheckCircle2 } from "lucide-react";

export default function Registro() {
  const [formData, setFormData] = useState({
    nome: "Estela Cerqueira Magalhães",
    data: format(new Date(), "yyyy-MM-dd"),
    observacoes: "",
    email1: "",
    email2: "",
  });

  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleClear = () => {
    setFormData({
      nome: "Estela Cerqueira Magalhães",
      data: format(new Date(), "yyyy-MM-dd"),
      observacoes: "",
      email1: "",
      email2: "",
    });
    setStatus("idle");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.nome,
          date: formData.data,
          observations: formData.observacoes,
          email1: formData.email1,
          email2: formData.email2,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save");
      }

      setStatus("success");
      setTimeout(() => {
        handleClear();
      }, 3000);
    } catch (error) {
      console.error(error);
      setStatus("error");
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
      <h1 className="text-2xl font-bold text-slate-900 mb-6">Registro de Almoço</h1>

      {status === "success" && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center text-emerald-800">
          <CheckCircle2 className="w-5 h-5 mr-2 text-emerald-600" />
          Registro salvo com sucesso!
        </div>
      )}

      {status === "error" && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center text-red-800">
          <XCircle className="w-5 h-5 mr-2 text-red-600" />
          Erro ao salvar registro. Tente novamente.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-slate-700 mb-1">
            Nome
          </label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="data" className="block text-sm font-medium text-slate-700 mb-1">
            Data
          </label>
          <input
            type="date"
            id="data"
            name="data"
            value={formData.data}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
          />
        </div>

        <div>
          <label htmlFor="observacoes" className="block text-sm font-medium text-slate-700 mb-1">
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="email1" className="block text-sm font-medium text-slate-700 mb-1">
              Email 1 (Comprovante)
            </label>
            <input
              type="email"
              id="email1"
              name="email1"
              value={formData.email1}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="email2" className="block text-sm font-medium text-slate-700 mb-1">
              Email 2 (Comprovante)
            </label>
            <input
              type="email"
              id="email2"
              name="email2"
              value={formData.email2}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        <div className="flex items-center justify-end space-x-4 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={handleClear}
            disabled={status === "loading"}
            className="px-6 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={status === "loading"}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-medium flex items-center disabled:opacity-50"
          >
            {status === "loading" ? (
              <span className="inline-block w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
            ) : (
              <Save className="w-5 h-5 mr-2" />
            )}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
}

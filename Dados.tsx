import { useState, useEffect, useMemo } from "react";
import { format, parseISO, startOfWeek, startOfMonth, startOfYear, isSameDay, isSameWeek, isSameMonth, isSameYear } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Download, Filter, FileSpreadsheet, BarChart as BarChartIcon, Trash2, AlertTriangle } from "lucide-react";
import * as XLSX from "xlsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type Entry = {
  id: number;
  name: string;
  date: string;
  observations: string;
  email1: string;
  email2: string;
  created_at: string;
};

type FilterType = "all" | "day" | "week" | "month" | "year";

export default function Dados() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStartDate, setDeleteStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deleteEndDate, setDeleteEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchEntries();
  }, []);

  const fetchEntries = async () => {
    try {
      const res = await fetch("/api/entries");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      entries.map((e) => ({
        ID: e.id,
        Nome: e.name,
        Data: format(parseISO(e.date), "dd/MM/yyyy"),
        Observações: e.observations,
        "Email 1": e.email1,
        "Email 2": e.email2,
        "Criado em": format(parseISO(e.created_at), "dd/MM/yyyy HH:mm:ss"),
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Almoços");
    XLSX.writeFile(workbook, `almocos_${format(new Date(), "yyyyMMdd_HHmmss")}.xlsx`);
  };

  const filteredEntries = useMemo(() => {
    if (filter === "all") return entries;

    const targetDate = parseISO(selectedDate);

    return entries.filter((entry) => {
      const entryDate = parseISO(entry.date);
      switch (filter) {
        case "day":
          return isSameDay(entryDate, targetDate);
        case "week":
          return isSameWeek(entryDate, targetDate, { locale: ptBR });
        case "month":
          return isSameMonth(entryDate, targetDate);
        case "year":
          return isSameYear(entryDate, targetDate);
        default:
          return true;
      }
    });
  }, [entries, filter, selectedDate]);

  const chartData = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredEntries.forEach((entry) => {
      counts[entry.name] = (counts[entry.name] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([name, quantidade]) => ({ name, quantidade }))
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [filteredEntries]);

  const handleDelete = async () => {
    if (!confirm(`Tem certeza que deseja apagar todos os registros entre ${format(parseISO(deleteStartDate), "dd/MM/yyyy")} e ${format(parseISO(deleteEndDate), "dd/MM/yyyy")}? Esta ação não pode ser desfeita.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/entries?startDate=${deleteStartDate}&endDate=${deleteEndDate}`, {
        method: "DELETE",
      });
      
      if (!res.ok) throw new Error("Failed to delete");
      
      const data = await res.json();
      alert(`${data.deletedCount} registro(s) apagado(s) com sucesso.`);
      setShowDeleteModal(false);
      fetchEntries(); // Reload data
    } catch (error) {
      console.error(error);
      alert("Erro ao apagar registros.");
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <BarChartIcon className="w-6 h-6 mr-2 text-indigo-600" />
            Estatísticas
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl p-1">
              <Filter className="w-4 h-4 text-slate-500 ml-2" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as FilterType)}
                className="bg-transparent border-none text-sm font-medium text-slate-700 focus:ring-0 py-1 pl-2 pr-8"
              >
                <option value="all">Todo o período</option>
                <option value="day">Por Dia</option>
                <option value="week">Por Semana</option>
                <option value="month">Por Mês</option>
                <option value="year">Por Ano</option>
              </select>
            </div>

            {filter !== "all" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            )}
          </div>
        </div>

        <div className="h-80 w-full">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar dataKey="quantidade" name="Quantidade de Almoços" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500">
              Nenhum dado encontrado para o período selecionado.
            </div>
          )}
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h2 className="text-xl font-bold text-slate-900 flex items-center">
            <FileSpreadsheet className="w-6 h-6 mr-2 text-emerald-600" />
            Histórico de Registros
          </h2>
          <div className="flex gap-3">
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-xl hover:bg-red-100 transition-colors font-medium flex items-center text-sm"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Apagar Dados
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors font-medium flex items-center text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Excel
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-sm font-semibold text-slate-600">
                <th className="pb-3 px-4">Data</th>
                <th className="pb-3 px-4">Nome</th>
                <th className="pb-3 px-4">Observações</th>
                <th className="pb-3 px-4">Emails Notificados</th>
              </tr>
            </thead>
            <tbody className="text-sm text-slate-700 divide-y divide-slate-100">
              {filteredEntries.length > 0 ? (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      {format(parseISO(entry.date), "dd/MM/yyyy")}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900">{entry.name}</td>
                    <td className="py-3 px-4 max-w-xs truncate" title={entry.observations}>
                      {entry.observations || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 text-xs text-slate-500">
                        {entry.email1 && <span>{entry.email1}</span>}
                        {entry.email2 && <span>{entry.email2}</span>}
                        {!entry.email1 && !entry.email2 && <span>-</span>}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-100">
            <div className="flex items-center text-red-600 mb-4">
              <AlertTriangle className="w-6 h-6 mr-2" />
              <h3 className="text-lg font-bold">Apagar Registros</h3>
            </div>
            
            <p className="text-slate-600 text-sm mb-6">
              Selecione o período dos registros que deseja apagar. Esta ação é irreversível.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data Inicial</label>
                <input
                  type="date"
                  value={deleteStartDate}
                  onChange={(e) => setDeleteStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Data Final</label>
                <input
                  type="date"
                  value={deleteEndDate}
                  onChange={(e) => setDeleteEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 font-medium transition-colors flex items-center disabled:opacity-50"
              >
                {isDeleting ? "Apagando..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

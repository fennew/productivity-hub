"use client";

import { useState } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  "Freelance", "Salary", "Investment", "Other Income",
  "Food", "Transport", "Software", "Equipment", "Rent", "Utilities",
  "Entertainment", "Health", "Education", "Other Expense",
];

export default function FinancesPage() {
  const { transactions, addTransaction } = useStore();
  const [showForm, setShowForm] = useState(false);
  const [newTx, setNewTx] = useState({
    type: "expense" as "income" | "expense",
    amount: 0,
    currency: "EUR",
    category: "Other Expense",
    description: "",
    date: new Date().toISOString().split("T")[0],
    client: "",
    paid: true,
  });

  const today = new Date();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const monthTx = transactions.filter((t) => t.date.startsWith(currentMonth));
  const totalIncome = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpenses;

  const sortedTx = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Finances</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus size={16} />
          Add Transaction
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5">
          <p className="text-xs text-zinc-500 uppercase">Monthly Income</p>
          <p className="text-2xl font-bold text-green-400 mt-1">€{totalIncome.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingUp size={14} className="text-green-400" />
            <span className="text-xs text-zinc-500">{monthTx.filter((t) => t.type === "income").length} transactions</span>
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-zinc-500 uppercase">Monthly Expenses</p>
          <p className="text-2xl font-bold text-red-400 mt-1">€{totalExpenses.toFixed(2)}</p>
          <div className="flex items-center gap-1 mt-1">
            <TrendingDown size={14} className="text-red-400" />
            <span className="text-xs text-zinc-500">{monthTx.filter((t) => t.type === "expense").length} transactions</span>
          </div>
        </div>
        <div className="glass-card p-5">
          <p className="text-xs text-zinc-500 uppercase">Balance</p>
          <p className={cn("text-2xl font-bold mt-1", balance >= 0 ? "text-green-400" : "text-red-400")}>
            €{balance.toFixed(2)}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <DollarSign size={14} className="text-zinc-500" />
            <span className="text-xs text-zinc-500">{currentMonth}</span>
          </div>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showForm && (
        <div className="glass-card p-5 mb-6">
          <div className="space-y-3">
            <div className="flex gap-2">
              <button
                onClick={() => setNewTx({ ...newTx, type: "income" })}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  newTx.type === "income" ? "bg-green-600 text-white" : "bg-zinc-800 text-zinc-400"
                )}
              >
                Income
              </button>
              <button
                onClick={() => setNewTx({ ...newTx, type: "expense" })}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  newTx.type === "expense" ? "bg-red-600 text-white" : "bg-zinc-800 text-zinc-400"
                )}
              >
                Expense
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                step="0.01"
                placeholder="Amount"
                value={newTx.amount || ""}
                onChange={(e) => setNewTx({ ...newTx, amount: parseFloat(e.target.value) || 0 })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:border-yellow-500"
              />
              <select
                value={newTx.category}
                onChange={(e) => setNewTx({ ...newTx, category: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Description"
                value={newTx.description}
                onChange={(e) => setNewTx({ ...newTx, description: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none"
              />
              <input
                type="date"
                value={newTx.date}
                onChange={(e) => setNewTx({ ...newTx, date: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm outline-none"
              />
              <input
                type="text"
                placeholder="Client (optional)"
                value={newTx.client}
                onChange={(e) => setNewTx({ ...newTx, client: e.target.value })}
                className="bg-zinc-900 border border-zinc-700 rounded-lg px-4 py-2.5 text-sm outline-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-zinc-400 hover:text-white">Cancel</button>
              <button
                onClick={() => {
                  if (newTx.description && newTx.amount > 0) {
                    addTransaction(newTx);
                    setNewTx({ type: "expense", amount: 0, currency: "EUR", category: "Other Expense", description: "", date: new Date().toISOString().split("T")[0], client: "", paid: true });
                    setShowForm(false);
                  }
                }}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 rounded-lg text-sm font-medium"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-zinc-800">
          <h2 className="font-semibold">Recent Transactions</h2>
        </div>
        {sortedTx.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No transactions yet</div>
        ) : (
          <div className="divide-y divide-zinc-800/50">
            {sortedTx.map((tx) => (
              <div key={tx.id} className="flex items-center gap-4 p-4">
                <div className={cn(
                  "p-2 rounded-lg",
                  tx.type === "income" ? "bg-green-500/10" : "bg-red-500/10"
                )}>
                  {tx.type === "income" ? (
                    <ArrowUpRight size={18} className="text-green-400" />
                  ) : (
                    <ArrowDownRight size={18} className="text-red-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{tx.description}</p>
                  <p className="text-xs text-zinc-500">{tx.category} · {tx.date}</p>
                </div>
                <span className={cn(
                  "font-semibold",
                  tx.type === "income" ? "text-green-400" : "text-red-400"
                )}>
                  {tx.type === "income" ? "+" : "-"}€{tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

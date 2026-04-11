import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mic, MicOff, CheckCircle, X, ChevronDown } from 'lucide-react'
import useFinanceStore from '../store/financeStore'
import { CATEGORIES } from '../data/initialData'
import { parseTransactionVoice, formatCurrency } from '../utils/dateUtils'

export default function AddTransaction() {
  const navigate = useNavigate()
  const accounts = useFinanceStore((s) => s.accounts)
  const addTransaction = useFinanceStore((s) => s.addTransaction)

  const [mode, setMode] = useState('text') // 'text' | 'voice'
  const [isListening, setIsListening] = useState(false)
  const [voiceTranscript, setVoiceTranscript] = useState('')
  const [parsed, setParsed] = useState(null)

  const [form, setForm] = useState({
    type: 'expense',
    amount: '',
    description: '',
    category: 'other',
    accountId: 'bbva',
    toAccountId: '',
    icon: '',
  })
  const [success, setSuccess] = useState(false)
  const recognitionRef = useRef(null)

  // Voice recognition
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Tu navegador no soporta reconocimiento de voz. Usa Chrome o Safari.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.lang = 'es-ES'
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript
      setVoiceTranscript(transcript)
      const result = parseTransactionVoice(transcript)
      setParsed(result)
      setForm((f) => ({
        ...f,
        description: result.description,
        amount: result.amount ? String(result.amount) : f.amount,
        type: result.type,
        category: result.category,
        accountId: result.accountId,
      }))
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)

    recognitionRef.current = recognition
    recognition.start()
  }

  const stopListening = () => {
    recognitionRef.current?.stop()
    setIsListening(false)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.amount || !form.description) return

    const category = CATEGORIES.find((c) => c.id === form.category)
    addTransaction({
      ...form,
      amount: parseFloat(form.amount.replace(',', '.')),
      icon: category?.icon || '💸',
    })
    setSuccess(true)
    setTimeout(() => navigate('/'), 1200)
  }

  const setField = (field, value) => setForm((f) => ({ ...f, [field]: value }))

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-emerald-900/40 border border-emerald-500/40 flex items-center justify-center">
          <CheckCircle size={40} className="text-emerald-400" />
        </div>
        <p className="text-white font-semibold text-lg">¡Guardado!</p>
        <p className="text-slate-400 text-sm">Movimiento registrado correctamente</p>
      </div>
    )
  }

  const expenseCategories = CATEGORIES.filter((c) => c.type === form.type || c.type === 'transfer')
  const incomeCategories = CATEGORIES.filter((c) => c.type === 'income')
  const relevantCategories = form.type === 'income' ? incomeCategories : form.type === 'transfer'
    ? CATEGORIES.filter((c) => c.type === 'transfer')
    : CATEGORIES.filter((c) => c.type === 'expense')

  return (
    <div className="px-4 py-4 animate-fade-in">
      {/* Cabecera */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">Nuevo movimiento</h2>
        <button onClick={() => navigate(-1)} className="p-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors">
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      {/* Toggle texto / voz */}
      <div className="flex bg-slate-800 rounded-xl p-1 mb-5">
        <button
          onClick={() => setMode('text')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'text' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          ✏️ Por escrito
        </button>
        <button
          onClick={() => setMode('voice')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            mode === 'voice' ? 'bg-indigo-600 text-white' : 'text-slate-400'
          }`}
        >
          🎙️ Por voz
        </button>
      </div>

      {/* Entrada por voz */}
      {mode === 'voice' && (
        <div className="mb-5">
          <div className="flex flex-col items-center gap-4 py-6 bg-slate-800/50 rounded-2xl border border-slate-700/50">
            <button
              onPointerDown={startListening}
              onPointerUp={stopListening}
              className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-lg ${
                isListening
                  ? 'bg-red-600 scale-110 shadow-red-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500'
              }`}
            >
              {isListening ? (
                <MicOff size={36} className="text-white" />
              ) : (
                <Mic size={36} className="text-white" />
              )}
            </button>
            <p className="text-slate-400 text-sm text-center px-4">
              {isListening
                ? '🔴 Escuchando… suelta para procesar'
                : 'Mantén pulsado y di tu movimiento'}
            </p>
            {voiceTranscript && (
              <div className="w-full px-4">
                <div className="bg-slate-700/50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">Transcripción:</p>
                  <p className="text-sm text-white italic">"{voiceTranscript}"</p>
                </div>
              </div>
            )}
            <p className="text-xs text-slate-500 px-4 text-center">
              Ejemplo: "Pagué 50 euros de gasolina con BBVA" o "Cobré la nómina de 2000 euros"
            </p>
          </div>
        </div>
      )}

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Tipo */}
        <div className="flex gap-2">
          {[
            { value: 'expense', label: '💸 Gasto', color: 'bg-red-600' },
            { value: 'income', label: '💵 Ingreso', color: 'bg-emerald-600' },
            { value: 'transfer', label: '↔️ Transferencia', color: 'bg-sky-600' },
          ].map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setField('type', t.value)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                form.type === t.value ? t.color + ' text-white' : 'bg-slate-800 text-slate-400'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Importe */}
        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block">Importe (€)</label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              min="0"
              placeholder="0,00"
              value={form.amount}
              onChange={(e) => setField('amount', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-2xl font-bold rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 text-right pr-8"
              required
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xl text-slate-500">€</span>
          </div>
        </div>

        {/* Descripción */}
        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block">Descripción</label>
          <input
            type="text"
            placeholder="Ej: Gasolina, Nómina, Cervezas con amigos…"
            value={form.description}
            onChange={(e) => setField('description', e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500"
            required
          />
        </div>

        {/* Cuenta */}
        <div>
          <label className="text-xs text-slate-400 font-medium mb-1 block">Cuenta</label>
          <div className="relative">
            <select
              value={form.accountId}
              onChange={(e) => setField('accountId', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-indigo-500"
            >
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Cuenta destino (para transferencias) */}
        {form.type === 'transfer' && (
          <div>
            <label className="text-xs text-slate-400 font-medium mb-1 block">Cuenta destino</label>
            <div className="relative">
              <select
                value={form.toAccountId}
                onChange={(e) => setField('toAccountId', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-4 py-3 appearance-none focus:outline-none focus:border-indigo-500"
              >
                <option value="">— Seleccionar —</option>
                {accounts.filter((a) => a.id !== form.accountId).map((a) => (
                  <option key={a.id} value={a.id}>{a.icon} {a.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        )}

        {/* Categoría */}
        <div>
          <label className="text-xs text-slate-400 font-medium mb-2 block">Categoría</label>
          <div className="grid grid-cols-3 gap-2">
            {relevantCategories.slice(0, 9).map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setField('category', cat.id)}
                className={`flex flex-col items-center gap-1 py-2 px-1 rounded-xl text-xs transition-all ${
                  form.category === cat.id
                    ? 'bg-indigo-600 text-white ring-1 ring-indigo-400'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span className="text-lg">{cat.icon}</span>
                <span className="leading-tight text-center">{cat.name.split('/')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl text-base transition-all active:scale-95 mt-2"
        >
          Guardar movimiento
        </button>
      </form>

      <div className="h-4" />
    </div>
  )
}

import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { Modal, Spinner } from './UI'

export default function ImportModal({ onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef()

  const handleFile = (f) => {
    if (!f) return
    setFile(f)
    setError(null)
    setResult(null)
    Papa.parse(f, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        setPreview(res.data.slice(0, 3))
      },
      error: () => setError('Could not parse CSV. Make sure it is a valid CSV file.'),
    })
  }

  const handleImport = async () => {
    if (!file) return
    setImporting(true)
    setError(null)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (res) => {
        try {
          const response = await fetch('/api/contacts/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ contacts: res.data }),
          })
          const data = await response.json()
          if (!response.ok) throw new Error(data.error)
          setResult(data)
          onImported(data.imported)
        } catch (e) {
          setError(e.message)
        }
        setImporting(false)
      },
    })
  }

  return (
    <Modal title="Import Contacts from CSV" onClose={onClose}>
      <div className="space-y-4">
        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50 text-sm text-slate-600">
          <p className="font-semibold text-slate-700 mb-1">Supported columns (flexible matching):</p>
          <p className="text-xs text-slate-500 leading-relaxed">
            first_name / last_name / email / job_title / company / phone / city / state / country
            <br />Column names are flexible — the importer will auto-match common variations.
          </p>
        </div>

        {/* Drop zone */}
        <div
          onClick={() => inputRef.current.click()}
          className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
        >
          <div className="text-3xl mb-2">📂</div>
          <div className="text-sm font-semibold text-slate-600">{file ? file.name : 'Click to select a CSV file'}</div>
          <div className="text-xs text-slate-400 mt-1">or drag and drop</div>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => handleFile(e.target.files[0])}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Preview (first 3 rows):</p>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="text-xs w-full">
                <thead>
                  <tr className="bg-slate-50">
                    {Object.keys(preview[0] || {}).slice(0, 6).map((k) => (
                      <th key={k} className="text-left px-3 py-2 text-slate-500 font-semibold border-b border-slate-100">{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-slate-50">
                      {Object.values(row).slice(0, 6).map((v, j) => (
                        <td key={j} className="px-3 py-1.5 text-slate-600 truncate max-w-24">{String(v || '').slice(0, 30)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-700">{error}</div>}

        {result && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 font-semibold">
            ✓ Successfully imported {result.imported} contacts!
          </div>
        )}

        <div className="flex justify-end gap-3 pt-1">
          <button onClick={onClose} className="px-5 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && (
            <button
              onClick={handleImport}
              disabled={!file || importing}
              className="px-5 py-2 rounded-xl text-sm font-bold text-white flex items-center gap-2 disabled:opacity-50"
              style={{ background: '#4f46e5' }}
            >
              {importing ? <><Spinner size={14} />Importing…</> : '⬆ Import Contacts'}
            </button>
          )}
        </div>
      </div>
    </Modal>
  )
}

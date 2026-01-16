import React, { useState, useEffect } from 'react';
import { historyService } from '../services/dataService';
import { SymptomLogEntry } from '../types';
import { Link } from 'react-router-dom';

export const JournalPage: React.FC = () => {
    const [entries, setEntries] = useState<SymptomLogEntry[]>([]);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State
    const [symptomName, setSymptomName] = useState('');
    const [intensity, setIntensity] = useState(5);
    const [notes, setNotes] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        loadEntries();
    }, []);

    const loadEntries = async () => {
        try {
            const data = await historyService.getHistory();
            setEntries(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await historyService.saveSymptomLog({
                date: new Date().toISOString(),
                intensity,
                notes,
                symptom_name: symptomName,
                duration: '' // Optional in UI, empty string for now
            });
            setShowModal(false);
            resetForm();
            loadEntries();
        } catch (error) {
            alert('Error al guardar la entrada');
            console.error(error);
        } finally {
            setSubmitting(false);
        }
    };

    const resetForm = () => {
        setSymptomName('');
        setIntensity(5);
        setNotes('');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('¿Eliminar esta entrada?')) {
            try {
                await historyService.deleteLog(id);
                setEntries(entries.filter(e => e.id !== id));
            } catch (error) {
                console.error(error);
            }
        }
    };

    const getIntensityLabel = (val: number) => {
        if (val <= 3) return { text: "Mal / Dolor", color: "text-red-400" };
        if (val <= 6) return { text: "En Proceso", color: "text-yellow-400" };
        if (val <= 8) return { text: "Mejorando", color: "text-cyan-400" };
        return { text: "Sanado / Paz", color: "text-green-400" };
    };

    return (
        <div className="min-h-screen pb-24 pt-4 px-4 max-w-2xl mx-auto">
            {/* Header */}
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-heading font-bold text-white mb-1">
                        Tu <span className="text-primary italic">Diario</span>
                    </h1>
                    <p className="text-gray-400 text-sm">Registra tu camino de sanación</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50 text-sm font-bold py-2 px-4 rounded-full transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(34,211,238,0.2)] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                >
                    <span className="material-symbols-outlined text-lg">edit_note</span>
                    Nueva Entrada
                </button>
            </header>

            {/* Stats/Summary (Optional Future) */}

            {/* Timeline */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500 animate-pulse">Cargando diario...</div>
                ) : entries.length === 0 ? (
                    <div className="text-center py-12 bg-surface-light dark:bg-surface-dark/50 rounded-2xl border border-dashed border-gray-700">
                        <span className="material-symbols-outlined text-4xl text-gray-600 mb-2">book_2</span>
                        <p className="text-gray-400">Tu diario está vacío.</p>
                        <button onClick={() => setShowModal(true)} className="text-primary font-bold mt-2 text-sm hover:underline">
                            Escribe tu primera entrada
                        </button>
                    </div>
                ) : (
                    entries.map((entry) => (
                        <div key={entry.id} className="relative pl-6 sm:pl-0">
                            {/* Timeline Line (Mobile) */}
                            <div className="absolute left-0 top-6 bottom-0 w-0.5 bg-gradient-to-b from-gray-800 to-transparent sm:hidden"></div>

                            <div className="bg-surface-light dark:bg-surface-dark/80 backdrop-blur-md border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-primary/30 transition-all group shadow-sm">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        {entry.symptom_name ? (
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-primary transition-colors">
                                                {entry.symptom_name}
                                            </h3>
                                        ) : (
                                            <h3 className="text-lg font-bold text-gray-500 italic">Entrada General</h3>
                                        )}
                                        <span className="text-xs text-gray-500 font-mono">
                                            {new Date(entry.date).toLocaleDateString()} • {new Date(entry.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Intensity Indicator */}
                                    {entry.intensity > 0 && (
                                        <div className={`flex flex-col items-end ${getIntensityLabel(entry.intensity).color}`}>
                                            <span className="text-xs font-bold uppercase opacity-80">{getIntensityLabel(entry.intensity).text}</span>
                                            <div className="flex gap-1 mt-1">
                                                {[...Array(5)].map((_, i) => (
                                                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < entry.intensity / 2 ? 'bg-current shadow-[0_0_5px_currentColor]' : 'bg-gray-700'}`}></div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Legacy Delete Button (Top Right) */}
                                    <button
                                        onClick={() => handleDelete(entry.id)}
                                        className="ml-3 text-gray-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Eliminar entrada"
                                    >
                                        <span className="material-symbols-outlined text-lg">delete</span>
                                    </button>
                                </div>

                                {/* Notes/Content */}
                                {entry.notes && (
                                    <div className="mt-3 text-gray-700 dark:text-gray-300 text-sm leading-relaxed whitespace-pre-wrap bg-background-light dark:bg-background-dark/50 p-3 rounded-lg border border-transparent dark:border-gray-800/50">
                                        {entry.notes}
                                    </div>
                                )}

                                {/* Legacy Symptom/Search Log Display */}
                                {entry.symptom && !entry.symptom_name && (
                                    <div className="mt-2 text-xs text-gray-500">
                                        Búsqueda: <span className="text-primary/70">{entry.symptom}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Floating Add Button (Mobile) */}
            <button
                onClick={() => setShowModal(true)}
                className="fixed bottom-24 right-6 md:hidden size-14 bg-gradient-to-r from-primary to-cyan-400 text-black rounded-full shadow-[0_0_20px_rgba(34,211,238,0.5)] flex items-center justify-center z-50 active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined text-3xl">edit</span>
            </button>

            {/* New Entry Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}></div>
                    <div className="bg-surface-light dark:bg-surface-dark border border-gray-700 rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white">
                            <span className="material-symbols-outlined">close</span>
                        </button>

                        <h2 className="text-2xl font-bold mb-6 text-center text-white">Nueva Entrada</h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Sentiment Slider */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-400 uppercase tracking-wider block text-center">
                                    ¿Cómo te sientes? ({intensity})
                                    <p className={`text-sm ${getIntensityLabel(intensity).color} mt-1`}>{getIntensityLabel(intensity).text}</p>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="10"
                                    value={intensity}
                                    onChange={(e) => setIntensity(Number(e.target.value))}
                                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-primary"
                                />
                                <div className="flex justify-between text-xs text-gray-600 font-bold px-1">
                                    <span>Mal</span>
                                    <span>Sanado</span>
                                </div>
                            </div>

                            {/* Symptom Name */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 ml-1">Título / Síntoma (Opcional)</label>
                                <input
                                    type="text"
                                    value={symptomName}
                                    onChange={(e) => setSymptomName(e.target.value)}
                                    placeholder="Ej: Dolor de cabeza, Ansiedad..."
                                    className="w-full bg-background-dark/50 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-gray-600"
                                />
                            </div>

                            {/* Notes */}
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-400 ml-1">Notas del Alma</label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Escribe aquí como te sientes, revelaciones, o progreso..."
                                    rows={4}
                                    className="w-full bg-background-dark/50 border border-gray-700 rounded-xl p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none placeholder:text-gray-600"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-4 rounded-xl shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_25px_rgba(34,211,238,0.5)] transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {submitting ? 'Guardando...' : 'Guardar en Diario'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

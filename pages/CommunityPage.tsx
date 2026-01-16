import React, { useState, useEffect } from 'react';
import { authService } from '../services/authService';
import { communityService } from '../services/dataService';

interface Comment {
  id: string;
  authorName?: string;
  text: string;
  timestamp: Date;
  userId?: string; // Added for ownership check
}

interface Intention {
  id: string;
  text: string;
  authorName?: string; // If undefined, it's anonymous
  candles: number;
  loves: number;
  isUser: boolean;
  theme: 'healing' | 'gratitude' | 'release' | 'feedback';
  timestamp: Date;
  comments: Comment[];
}

export const CommunityPage: React.FC = () => {
  const [intentions, setIntentions] = useState<Intention[]>([]);
  const [newIntention, setNewIntention] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<'healing' | 'gratitude' | 'release' | 'feedback'>('gratitude');
  const [activeTab, setActiveTab] = useState<'all' | 'healing' | 'gratitude' | 'feedback'>('all');
  const [isLoading, setIsLoading] = useState(true);

  // New Features State
  const [showName, setShowName] = useState(false);
  const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const u = await authService.getUser();
        setUser(u);

        const data = await communityService.getIntentions();
        // Map service data to local interface if needed, although they look very similar now.
        // dataService returns objects compatible with our Intention interface mostly.
        // We might need to ensure comments structure matches.
        const mappedData: Intention[] = data.map(item => ({
          ...item,
          // Re-calculate ownership in client to be safe
          isUser: item.user_id === u?.id,
          comments: item.comments?.map((c: any) => ({
            id: c.id,
            text: c.text,
            authorName: c.author_name,
            userId: c.user_id, // Map user_id to local property
            timestamp: new Date(c.created_at || Date.now())
          })) || []
        }));

        // Sort by newest first
        mappedData.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

        setIntentions(mappedData);
      } catch (error) {
        console.error("Error loading community data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handlePost = async () => {
    if (!newIntention.trim()) return;

    // Optimistic Update
    const tempId = Date.now().toString();
    const newPostOptimistic: Intention = {
      id: tempId,
      text: newIntention,
      authorName: showName ? user?.name : undefined,
      candles: 0,
      loves: 0,
      isUser: true,
      theme: selectedTheme,
      timestamp: new Date(),
      comments: []
    };

    setIntentions([newPostOptimistic, ...intentions]);
    setNewIntention('');

    try {
      await communityService.createIntention(
        newIntention,
        selectedTheme,
        showName ? (user?.name || 'Usuario') : 'Anónimo'
      );
      // Refresh in background to get real ID
      const freshData = await communityService.getIntentions();
      // Remap again
      const mappedData: Intention[] = freshData.map(item => ({
        ...item,
        comments: item.comments?.map((c: any) => ({
          id: c.id,
          text: c.text,
          authorName: c.author_name,
          timestamp: new Date(c.created_at || Date.now())
        })) || []
      }));
      setIntentions(mappedData);

    } catch (err) {
      console.error("Error posting intention:", err);
      // Revert on error could be implemented here
      alert("Hubo un error al publicar tu mensaje. Inténtalo de nuevo.");
      setIntentions(intentions.filter(i => i.id !== tempId));
    }
  };

  const handleDeleteComment = async (intentionId: string, commentId: string) => {
    if (!window.confirm("¿Borrar tu comentario?")) return;

    // Optimistic Delete
    const updatedIntentions = [...intentions];
    const postIndex = updatedIntentions.findIndex(p => p.id === intentionId);
    if (postIndex !== -1) {
      updatedIntentions[postIndex] = {
        ...updatedIntentions[postIndex],
        comments: updatedIntentions[postIndex].comments.filter(c => c.id !== commentId)
      };
      setIntentions(updatedIntentions);
    }

    try {
      await communityService.deleteComment(commentId);
    } catch (err) {
      console.error("Error deleting", err);
      alert("No se pudo eliminar.");
    }
  };

  const handleComment = async (postId: string) => {
    if (!newComment.trim()) return;

    // Find post to update
    const postIndex = intentions.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    // Optimistic comment
    const comment: Comment = {
      id: Date.now().toString(),
      text: newComment,
      authorName: showName ? user?.name : undefined,
      userId: user?.id,
      timestamp: new Date()
    };

    const updatedIntentions = [...intentions];
    updatedIntentions[postIndex] = {
      ...updatedIntentions[postIndex],
      comments: [...updatedIntentions[postIndex].comments, comment]
    };
    setIntentions(updatedIntentions);
    setNewComment('');

    try {
      await communityService.addComment(
        postId,
        newComment,
        showName ? (user?.name || 'Usuario') : 'Anónimo'
      );
      // We could refresh here too, but comments are less critical to have real IDs immediately unless editing/deleting
    } catch (err) {
      console.error("Error posting comment", err);
      alert("Error al guardar el comentario.");
    }
  };

  const lightCandle = async (id: string) => {
    // Optimistic update
    setIntentions(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, candles: item.candles + 1 };
      }
      return item;
    }));

    try {
      await communityService.lightCandle(id);
    } catch (err) {
      console.error(err);
    }
  };

  const sendLove = async (id: string) => {
    // Optimistic update
    setIntentions(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, loves: item.loves + 1 };
      }
      return item;
    }));

    try {
      await communityService.sendLove(id);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (id: string) => {
    if (activeCommentId === id) {
      setActiveCommentId(null);
    } else {
      setActiveCommentId(id);
    }
  };

  const filteredIntentions = activeTab === 'all'
    ? intentions
    : intentions.filter(i => i.theme === activeTab);

  const getThemeIcon = (theme: string) => {
    switch (theme) {
      case 'healing': return 'healing';
      case 'gratitude': return 'spa';
      case 'release': return 'air';
      case 'feedback': return 'reviews';
      default: return 'favorite';
    }
  };

  const getThemeLabel = (theme: string) => {
    switch (theme) {
      case 'healing': return 'Sanación';
      case 'gratitude': return 'Gratitud';
      case 'release': return 'Soltar';
      case 'feedback': return 'Testimonio';
      default: return 'Mensaje';
    }
  };

  return (
    <div className="flex-1 w-full min-h-screen pb-24 pt-20 bg-gradient-to-b from-indigo-50/50 to-white dark:from-[#1a2c32] dark:to-[#101e22]">
      {/* Header */}
      <div className="relative overflow-hidden bg-primary/10 dark:bg-primary/5 py-12 px-6 text-center">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl -translate-y-1/2 pointer-events-none"></div>
        <div className="relative z-10">
          <span className="material-symbols-outlined text-5xl text-primary mb-2">diversity_1</span>
          <h1 className="font-heading text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">Círculo de SanArte</h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-xl mx-auto text-lg leading-relaxed">
            Bienvenida/o al Círculo. Este es un espacio sagrado para agradecer, soltar cargas, compartir tu proceso y contarnos si esta herramienta está siendo luz en tu camino.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 -mt-6 relative z-20">
        {/* Input Box */}
        <div className="bg-white dark:bg-surface-dark rounded-2xl p-6 shadow-xl border border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
            Comparte tu luz con la comunidad:
          </label>

          {/* Theme Selector */}
          <div className="flex flex-wrap gap-2 mb-3">
            {['gratitude', 'healing', 'release', 'feedback'].map((theme) => (
              <button
                key={theme}
                onClick={() => setSelectedTheme(theme as any)}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold transition-all border ${selectedTheme === theme
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-50 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-gray-700 hover:border-primary'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">{getThemeIcon(theme)}</span>
                {getThemeLabel(theme)}
              </button>
            ))}
          </div>

          <textarea
            value={newIntention}
            onChange={(e) => setNewIntention(e.target.value)}
            className="w-full bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-gray-700 rounded-xl p-4 text-gray-800 dark:text-gray-200 focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all resize-none"
            rows={3}
            placeholder={
              selectedTheme === 'feedback' ? "Cuéntanos, ¿cómo te ha ayudado SanArte hoy?" :
                selectedTheme === 'gratitude' ? "Hoy agradezco por..." :
                  "Escribe tu intención o mensaje aquí..."
            }
          />
          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-4">

            {/* Identity Toggle */}
            {/* Identity Toggle - Improved UI */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">Publicando como:</span>
              <button
                onClick={() => setShowName(!showName)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all border ${showName
                  ? 'bg-primary/10 text-primary border-primary shine-effect'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-gray-700'
                  }`}
              >
                {showName ? (
                  <>
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span className="uppercase tracking-wide">{user?.name || 'Mí'}</span>
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                    <span className="uppercase tracking-wide">Anónimo</span>
                  </>
                )}
              </button>
            </div>

            <button
              onClick={handlePost}
              disabled={!newIntention.trim()}
              className="w-full sm:w-auto bg-primary hover:bg-primary-hover text-white px-6 py-2 rounded-full font-bold shadow-md transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <span>Publicar</span>
              <span className="material-symbols-outlined text-sm">send</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 my-8">
          <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'all' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}>Todos</button>
          <button onClick={() => setActiveTab('healing')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'healing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}>Sanación</button>
          <button onClick={() => setActiveTab('gratitude')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'gratitude' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/40 dark:text-pink-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}>Gratitud</button>
          <button onClick={() => setActiveTab('feedback')} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${activeTab === 'feedback' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10'}`}>Testimonios</button>
        </div>

        {/* Feed */}
        <div className="flex flex-col gap-4">
          {filteredIntentions.map((item) => (
            <div key={item.id} className="bg-white dark:bg-surface-dark p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-full dark:bg-white/5 ${item.theme === 'healing' ? 'bg-blue-50 text-blue-500' :
                    item.theme === 'gratitude' ? 'bg-pink-50 text-pink-500' :
                      item.theme === 'feedback' ? 'bg-amber-50 text-amber-500' :
                        'bg-gray-100 text-gray-500'
                    }`}>
                    <span className="material-symbols-outlined text-xl">
                      {getThemeIcon(item.theme)}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-sm font-black ${item.authorName ? 'text-primary' : 'text-gray-500 dark:text-gray-400'}`}>
                      {item.authorName || 'Alma Anónima'}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-gray-300">
                      {getThemeLabel(item.theme)}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-300 font-bold uppercase tracking-widest">
                  {item.timestamp.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })} • {item.timestamp.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <p className="text-lg text-gray-800 dark:text-gray-200 font-medium leading-relaxed mb-6 pl-1 pt-2">
                "{item.text}"
              </p>

              {/* Delete Intention Button */}
              {user && item.isUser && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('¿Eliminar esta publicación?')) {
                      communityService.deleteIntention(item.id).then(() => {
                        setIntentions(prev => prev.filter(i => i.id !== item.id));
                      }).catch(() => alert('Error al eliminar'));
                    }
                  }}
                  className="absolute top-4 right-4 text-gray-300 hover:text-red-500 p-2"
                >
                  <span className="material-symbols-outlined">delete</span>
                </button>
              )}

              <div className="flex items-center gap-6 pt-4 border-t border-gray-50 dark:border-gray-700/50">
                {/* Candle Button */}
                <button
                  onClick={() => lightCandle(item.id)}
                  className="flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors group"
                >
                  <span className={`material-symbols-outlined text-2xl group-hover:animate-pulse ${item.candles > 0 ? 'text-orange-400 filled' : ''}`}>light_mode</span>
                  <span className={`text-xs font-bold ${item.candles > 0 ? 'text-orange-400' : ''}`}>{item.candles || 'Encender'}</span>
                </button>

                {/* Heart Button */}
                <button
                  onClick={() => sendLove(item.id)}
                  className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition-colors group"
                >
                  <span className={`material-symbols-outlined text-2xl group-hover:scale-110 transition-transform ${item.loves > 0 ? 'text-red-500 filled' : ''}`}>favorite</span>
                  <span className={`text-xs font-bold ${item.loves > 0 ? 'text-red-500' : ''}`}>{item.loves || 'Amar'}</span>
                </button>

                {/* Comment Toggle */}
                <button
                  onClick={() => toggleComments(item.id)}
                  className={`flex items-center gap-2 transition-colors ml-auto ${activeCommentId === item.id || item.comments.length > 0 ? 'text-primary' : 'text-gray-400 hover:text-gray-600'}`}
                >
                  <span className="material-symbols-outlined text-2xl">chat_bubble</span>
                  <span className="text-xs font-bold">{item.comments.length || 'Comentar'}</span>
                </button>
              </div>

              {/* Comments Section */}
              {activeCommentId === item.id && (
                <div className="mt-4 pt-4 border-t border-dashed border-gray-100 dark:border-gray-800 animate-in slide-in-from-top-2">
                  {/* Existing Comments */}
                  {item.comments.length > 0 && (
                    <div className="space-y-3 mb-4 max-h-60 overflow-y-auto no-scrollbar">
                      {item.comments.map(comment => (
                        <div key={comment.id} className="bg-gray-50 dark:bg-white/5 p-3 rounded-2xl text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold ${comment.authorName ? 'text-primary' : 'text-gray-500'}`}>
                              {comment.authorName || 'Alma Anónima'}
                            </span>
                            {/* Delete Button (Only for owner) */}
                            {user && (comment.userId === user.id || item.isUser) && (
                              <button onClick={() => handleDeleteComment(item.id, comment.id)} className="text-gray-300 hover:text-red-500 transition-colors p-1" title="Eliminar">
                                <span className="material-symbols-outlined text-[16px] font-bold">close</span>
                              </button>
                            )}
                          </div>
                          <p className="text-gray-700 dark:text-gray-300">{comment.text}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* New Comment Input */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleComment(item.id)}
                      placeholder="Escribe un mensaje de apoyo..."
                      className="flex-1 bg-gray-50 dark:bg-black/20 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-primary/30"
                    />
                    <button
                      onClick={() => handleComment(item.id)}
                      disabled={!newComment.trim()}
                      className="size-8 bg-primary text-white rounded-lg flex items-center justify-center shadow-md active:scale-95 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-sm">send</span>
                    </button>
                  </div>

                  <div className="mt-2 flex justify-end">
                    <p className="text-[9px] text-gray-400 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">{showName ? 'visibility' : 'visibility_off'}</span>
                      Comentando como {showName ? user?.name : 'Anónimo'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}

          {filteredIntentions.length === 0 && (
            <div className="text-center py-16 px-6 animate-in fade-in zoom-in duration-700">
              <div className="size-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-primary/40">auto_awesome</span>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">Sé la primera chispa</h3>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
                Este espacio está esperando tu luz. Comparte tu intención, sanación o gratitud y comienza el movimiento.
              </p>
            </div>
          )}
        </div>

        <div className="text-center mt-10 text-gray-400 text-sm italic">
          "No estás solo/a. Todos somos uno."
        </div>
      </div>
    </div>
  );
};
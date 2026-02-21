
import React, { useState, useEffect, useRef } from 'react';
import { ValidityRecord, ProductTemplate, User, Period, ProductGroup, Loja, LOJAS_DISPONIVEIS } from '../types.ts';
import { supabaseService } from '../services/supabaseService.ts';
import { compressImage, base64ToBlob } from '../utils/imageUtils.ts';
import StatusBadge from './StatusBadge.tsx';

interface AdminDashboardProps {
  user: User;
}

const PRODUCT_GROUPS: ProductGroup[] = ['Frescos', 'Pão', 'Molhos', 'Coberturas', 'McCafé', 'Outros'];

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [records, setRecords] = useState<ValidityRecord[]>([]);
  const [templates, setTemplates] = useState<ProductTemplate[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [view, setView] = useState<'records' | 'catalog' | 'users'>('records');
  const [isAddingTemplate, setIsAddingTemplate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const isAdmin = user.role === 'admin';
  const isGerente = user.role === 'gerente';

  // Gerentes só podem ver a sua loja e não podem mudar o filtro global
  const [selectedLojaFilter, setSelectedLojaFilter] = useState<Loja | 'Todas'>(
    isGerente ? user.loja : 'Todas'
  );

  const [newTName, setNewTName] = useState('');
  const [newTLife, setNewTLife] = useState(3); // Valor padrão inicial
  const [newTImage, setNewTImage] = useState<string | null>(null);
  const [newTImageFile, setNewTImageFile] = useState<File | null>(null);
  const [newTPeriods, setNewTPeriods] = useState<Period[]>(['abertura', 'transicao', 'fecho']);
  const [newTGroup, setNewTGroup] = useState<ProductGroup>('Frescos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const fetchPromises: Promise<any>[] = [
        supabaseService.getRecords(),
        supabaseService.getTemplates()
      ];
      
      if (isAdmin) {
        fetchPromises.push(supabaseService.getUsers());
      }

      const results = await Promise.all(fetchPromises);
      setRecords(results[0]);
      setTemplates(results[1]);
      if (isAdmin) setUsers(results[2]);
      
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecord = async (id: string) => {
    if (!isAdmin) return;
    if (confirm('Tem a certeza que deseja eliminar este registo?')) {
      const ok = await supabaseService.deleteRecord(id, user);
      if (ok) {
        setRecords(prev => prev.filter(r => r.id !== id));
      }
    }
  };

  const handleApproveUser = async (userId: string) => {
    if (!isAdmin) return;
    const ok = await supabaseService.updateUserStatus(userId, true);
    if (ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!isAdmin) return;
    if (confirm('Eliminar este utilizador permanentemente?')) {
      const ok = await supabaseService.removeUser(userId);
      if (ok) setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!isAdmin) return;
    if (confirm('Tem a certeza que deseja eliminar este produto do catálogo?')) {
      const ok = await supabaseService.deleteTemplate(id);
      if (ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
      } else {
        alert('Erro ao eliminar produto.');
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewTImageFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setNewTImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!newTImageFile || !newTName || newTPeriods.length === 0) {
      alert('Preencha todos os campos!');
      return;
    }
    setIsSubmitting(true);
    try {
      // Use the file directly instead of fetching from a data URL
      let blob: Blob = newTImageFile;
      
      // Attempt to compress if it's a large image
      try {
        if (newTImage) {
          const compressed = await compressImage(newTImage);
          blob = base64ToBlob(compressed);
        }
      } catch (compressErr) {
        console.warn('Compression failed, using original file:', compressErr);
      }
      
      let url = '';
      try {
        console.log('Attempting upload to Supabase...');
        url = await supabaseService.uploadImage(blob, `cat_${newTName.replace(/\s+/g, '_')}.jpg`);
      } catch (uploadErr: any) {
        console.error('Upload failed details:', uploadErr);
        const errorMsg = uploadErr?.message || 'Erro de rede ou CORS';
        
        if (confirm(`Falha no servidor (${errorMsg}).\n\nIsto acontece geralmente quando o CORS não está configurado no Supabase.\n\nDeseja usar uma imagem padrão para continuar?`)) {
          url = `https://images.unsplash.com/photo-1550989460-0adf9ea622e2?q=80&w=200&auto=format&fit=crop`;
        } else {
          setIsSubmitting(false);
          return;
        }
      }
      
      const newT = await supabaseService.addTemplate({
        nome: newTName,
        imagem_url: url,
        tempo_vida_dias: newTLife,
        periodos: newTPeriods,
        grupo: newTGroup
      });
      
      setTemplates([...templates, newT]);
      setIsAddingTemplate(false);
      resetForm();
    } catch (err) {
      alert('Erro ao criar produto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewTName('');
    setNewTLife(3);
    setNewTImage(null);
    setNewTImageFile(null);
    setNewTPeriods(['abertura', 'transicao', 'fecho']);
    setNewTGroup('Frescos');
  };

  const togglePeriod = (p: Period) => {
    setNewTPeriods(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

  const filteredRecords = records.filter(r => 
    selectedLojaFilter === 'Todas' || r.loja === selectedLojaFilter
  );

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">A sincronizar...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-4xl mx-auto">
      {/* Navegação Superior - Apenas para Admin */}
      {isAdmin && (
        <div className="flex bg-white/70 p-1.5 rounded-[28px] border border-slate-200 shadow-sm backdrop-blur-md overflow-x-auto no-scrollbar">
          <button onClick={() => setView('records')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${view === 'records' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'}`}>Monitor</button>
          <button onClick={() => setView('catalog')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${view === 'catalog' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'}`}>Catálogo</button>
          <button onClick={() => setView('users')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${view === 'users' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'}`}>Utilizadores</button>
        </div>
      )}

      {/* Monitor de Registos (Acessível a Admin e Gerente) */}
      {view === 'records' && (
        <div className="space-y-6">
          <div className="px-4">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Monitor de Validades</h2>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
              Dashboard de {isGerente ? 'Gerência' : 'Administração'} • {isGerente ? user.loja : 'Sistema Global'}
            </p>
          </div>

          {/* Filtro de Lojas - Apenas Admin pode mudar */}
          {isAdmin && (
            <div className="bg-white p-4 rounded-[32px] border border-slate-100 shadow-sm">
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 shrink-0">Filtrar por Loja:</span>
                <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
                  <button 
                    onClick={() => setSelectedLojaFilter('Todas')}
                    className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedLojaFilter === 'Todas' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    Todas
                  </button>
                  {LOJAS_DISPONIVEIS.map(l => (
                    <button 
                      key={l}
                      onClick={() => setSelectedLojaFilter(l)}
                      className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${selectedLojaFilter === l ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Cards de Estatísticas */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:border-red-100 transition-all">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Itens Caducados</p>
                <p className="text-4xl font-black text-red-600 tracking-tighter">{filteredRecords.filter(r => r.status === 'expired').length}</p>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm group hover:border-amber-100 transition-all">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximos do Fim</p>
                <p className="text-4xl font-black text-amber-500 tracking-tighter">{filteredRecords.filter(r => r.status === 'expiring_soon').length}</p>
             </div>
             <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total {selectedLojaFilter !== 'Todas' ? selectedLojaFilter : 'Lojas'}</p>
                <p className="text-4xl font-black text-white tracking-tighter">{filteredRecords.length}</p>
             </div>
          </div>
          
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50">
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto / Loja</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Validade</th>
                      <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                      {isAdmin && <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 4 : 3} className="px-6 py-12 text-center text-slate-400 font-bold text-sm uppercase tracking-widest">Nenhum registo encontrado</td>
                      </tr>
                    ) : filteredRecords.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <img src={r.imagem_url} referrerPolicy="no-referrer" className="w-10 h-10 rounded-xl object-cover shadow-sm" />
                             <div>
                               <span className="font-bold text-slate-900 text-sm block leading-tight">{r.nome_produto}</span>
                               <div className="flex items-center gap-2 mt-0.5">
                                 <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">{r.loja}</span>
                                 <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">•</span>
                                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{r.grupo || 'Geral'}</span>
                               </div>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                            {new Date(r.data_validade).toLocaleDateString('pt-PT')} {r.hora_registo && r.hora_registo !== 'N/A' ? `@ ${r.hora_registo}` : ''}
                          </span>
                        </td>
                        <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                        {isAdmin && (
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteRecord(r.id)}
                              className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
          </div>
        </div>
      )}

      {/* Catálogo e Gestão de Utilizadores - Apenas Admin */}
      {isAdmin && view === 'catalog' && (
        <div className="space-y-10">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xl font-black text-slate-900">Gestão de Produtos</h3>
            <button onClick={() => setIsAddingTemplate(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all active:scale-95">Novo Produto</button>
          </div>
          
          <div className="space-y-12">
            {PRODUCT_GROUPS.map(group => {
              const groupTemplates = templates.filter(t => t.grupo === group);
              if (groupTemplates.length === 0) return null;
              
              return (
                <section key={group} className="space-y-4 px-4">
                  <div className="flex items-center gap-4">
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{group}</h4>
                    <div className="h-px bg-slate-200 w-full"></div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {groupTemplates.map(t => (
                      <div key={t.id} className="bg-white p-4 rounded-[36px] border border-slate-100 shadow-sm text-center group hover:shadow-md transition-all relative">
                        {isAdmin && (
                          <button 
                            onClick={() => handleDeleteTemplate(t.id)}
                            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm text-slate-300 hover:text-red-500 rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-all z-10"
                            title="Eliminar Produto"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          </button>
                        )}
                        <img src={t.imagem_url} referrerPolicy="no-referrer" className="w-full aspect-square rounded-[28px] object-cover mb-4 group-hover:scale-105 transition-transform" alt="" />
                        <h5 className="font-black text-slate-900 text-xs truncate">{t.nome}</h5>
                        <div className="mt-2 flex items-center justify-center gap-2">
                           <span className="text-[9px] font-black bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-lg uppercase">{t.tempo_vida_dias} dias</span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase">{t.periodos.join(' • ')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}

      {isAdmin && view === 'users' && (
        <div className="space-y-6">
          <div className="px-4">
            <h3 className="text-xl font-black text-slate-900">Gestão de Acessos</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Aprovar ou remover colaboradores</p>
          </div>
          <div className="grid gap-4 px-4 sm:px-0">
            {users.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:shadow-md">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                   <span className="font-black text-indigo-600 text-lg">{u.name.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-slate-900 text-base truncate">{u.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-slate-900 text-white' : u.role === 'gerente' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>{u.role}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-400 truncate">{u.email}</p>
                    <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">({u.loja})</span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {!u.approved ? (
                    <button 
                      onClick={() => handleApproveUser(u.id)}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-md shadow-emerald-100"
                    >
                      Aprovar
                    </button>
                  ) : (
                    <span className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest border border-emerald-100">
                      Ativo
                    </span>
                  )}
                  {u.email !== user.email && (
                    <button 
                      onClick={() => handleDeleteUser(u.id)}
                      className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal Novo Produto - Somente Admin */}
      {isAddingTemplate && isAdmin && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-8 space-y-8 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Novo Produto</h3>
              <button onClick={() => setIsAddingTemplate(false)} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddTemplate} className="space-y-6">
              <div className="flex justify-center">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-[32px] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-indigo-500 overflow-hidden shrink-0 transition-all bg-slate-50">
                  {newTImage ? <img src={newTImage} referrerPolicy="no-referrer" className="w-full h-full object-cover" /> : (
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      <span className="text-[10px] font-black text-slate-300 text-center px-2 uppercase tracking-widest">Foto do Produto</span>
                    </div>
                  )}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="grid gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome do Produto</label>
                  <input type="text" required placeholder="Ex: Croissant" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={newTName} onChange={e => setNewTName(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Validade (Dias)</label>
                      <input type="number" required min="1" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 transition-all" value={newTLife} onChange={e => setNewTLife(Number(e.target.value))} />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Grupo</label>
                      <select required className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 appearance-none transition-all" value={newTGroup} onChange={(e) => setNewTGroup(e.target.value as ProductGroup)}>
                        {PRODUCT_GROUPS.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                   </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Períodos de Verificação</label>
                  <div className="flex gap-2">
                    {(['abertura', 'transicao', 'fecho'] as Period[]).map(p => (
                      <button key={p} type="button" onClick={() => togglePeriod(p)} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all ${newTPeriods.includes(p) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>

              <button disabled={isSubmitting} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-lg shadow-xl active:scale-[0.98] transition-all disabled:opacity-50">
                {isSubmitting ? 'A criar...' : 'Guardar Produto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

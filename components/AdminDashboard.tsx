
import React, { useState, useEffect, useRef } from 'react';
import { ValidityRecord, ProductTemplate, User, Period, ProductGroup } from '../types.ts';
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

  const [newTName, setNewTName] = useState('');
  const [newTLife, setNewTLife] = useState(30);
  const [newTImage, setNewTImage] = useState<string | null>(null);
  const [newTPeriods, setNewTPeriods] = useState<Period[]>(['abertura', 'transicao', 'fecho']);
  const [newTGroup, setNewTGroup] = useState<ProductGroup>('Frescos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    const [recData, tempData, userData] = await Promise.all([
      supabaseService.getRecords(),
      supabaseService.getTemplates(),
      supabaseService.getUsers()
    ]);
    setRecords(recData);
    setTemplates(tempData);
    setUsers(userData);
    setIsLoading(false);
  };

  const handleApproveUser = async (userId: string) => {
    const ok = await supabaseService.updateUserStatus(userId, true);
    if (ok) {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, approved: true } : u));
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Eliminar este utilizador permanentemente?')) {
      const ok = await supabaseService.removeUser(userId);
      if (ok) setUsers(prev => prev.filter(u => u.id !== userId));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setNewTImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTImage || !newTName || newTPeriods.length === 0) {
      alert('Preencha todos os campos!');
      return;
    }
    setIsSubmitting(true);
    try {
      const compressed = await compressImage(newTImage);
      const blob = base64ToBlob(compressed);
      const url = await supabaseService.uploadImage(blob, `cat_${newTName}.jpg`);
      
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
    setNewTLife(30);
    setNewTImage(null);
    setNewTPeriods(['abertura', 'transicao', 'fecho']);
    setNewTGroup('Frescos');
  };

  const togglePeriod = (p: Period) => {
    setNewTPeriods(prev => 
      prev.includes(p) ? prev.filter(item => item !== p) : [...prev, p]
    );
  };

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
      <div className="flex bg-white/70 p-1.5 rounded-[28px] border border-slate-200 shadow-sm backdrop-blur-md overflow-x-auto no-scrollbar">
        <button onClick={() => setView('records')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${view === 'records' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'}`}>Monitor</button>
        <button onClick={() => setView('catalog')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${view === 'catalog' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'}`}>Catálogo</button>
        <button onClick={() => setView('users')} className={`flex-1 min-w-[100px] py-4 text-[10px] font-black uppercase tracking-widest rounded-[22px] transition-all ${view === 'users' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-500 hover:bg-white/50'}`}>Utilizadores</button>
      </div>

      {view === 'records' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Itens Caducados</p>
                <p className="text-4xl font-black text-red-600 tracking-tighter">{records.filter(r => r.status === 'expired').length}</p>
             </div>
             <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Próximos do Fim</p>
                <p className="text-4xl font-black text-amber-500 tracking-tighter">{records.filter(r => r.status === 'expiring_soon').length}</p>
             </div>
             <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Registos</p>
                <p className="text-4xl font-black text-white tracking-tighter">{records.length}</p>
             </div>
          </div>
          <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50">
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Produto</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Validade</th>
                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {records.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                           <img src={r.imagem_url} className="w-10 h-10 rounded-xl object-cover" />
                           <div>
                             <span className="font-bold text-slate-900 text-sm block leading-tight">{r.nome_produto}</span>
                             <span className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{r.grupo || 'Geral'}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs font-bold text-slate-500">{new Date(r.data_validade).toLocaleDateString('pt-PT')}</td>
                      <td className="px-6 py-4"><StatusBadge status={r.status} /></td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        </div>
      )}

      {view === 'catalog' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-4">
            <h3 className="text-xl font-black text-slate-900">Gestão de Produtos</h3>
            <button onClick={() => setIsAddingTemplate(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-full font-black text-[10px] uppercase tracking-widest shadow-lg">Novo Produto</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {templates.map(t => (
              <div key={t.id} className="bg-white p-4 rounded-[36px] border border-slate-100 shadow-sm text-center group">
                <img src={t.imagem_url} className="w-full aspect-square rounded-[28px] object-cover mb-4 group-hover:scale-105 transition-transform" alt="" />
                <h5 className="font-black text-slate-900 text-xs truncate">{t.nome}</h5>
                <p className="text-[9px] font-bold text-indigo-500 uppercase mt-1">{t.grupo}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase mt-0.5">{t.periodos.join(' • ')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'users' && (
        <div className="space-y-6">
          <div className="px-4">
            <h3 className="text-xl font-black text-slate-900">Gestão de Acessos</h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Aprovar ou remover colaboradores</p>
          </div>
          <div className="grid gap-4 px-4 sm:px-0">
            {users.map(u => (
              <div key={u.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4 transition-all hover:shadow-md">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center shrink-0">
                   <span className="font-black text-indigo-600 text-lg">{u.name.charAt(0)}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-black text-slate-900 text-base truncate">{u.name}</h4>
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${u.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>{u.role}</span>
                  </div>
                  <p className="text-xs font-bold text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex items-center gap-3">
                  {!u.approved ? (
                    <button 
                      onClick={() => handleApproveUser(u.id)}
                      className="px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
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

      {isAddingTemplate && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[48px] p-8 space-y-8 animate-scale-in max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-black text-slate-900">Novo Produto</h3>
              <button onClick={() => setIsAddingTemplate(false)} className="p-2 text-slate-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleAddTemplate} className="space-y-6">
              <div className="flex justify-center">
                <button type="button" onClick={() => fileInputRef.current?.click()} className="w-32 h-32 rounded-[32px] border-4 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-indigo-500 overflow-hidden shrink-0">
                  {newTImage ? <img src={newTImage} className="w-full h-full object-cover" /> : <span className="text-[10px] font-black text-slate-300">FOTO</span>}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageChange} />
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Nome do Produto</label>
                  <input type="text" required placeholder="Ex: Croissant" className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500" value={newTName} onChange={e => setNewTName(e.target.value)} />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Grupo / Categoria</label>
                  <select 
                    required
                    className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold outline-none focus:border-indigo-500 appearance-none"
                    value={newTGroup}
                    onChange={(e) => setNewTGroup(e.target.value as ProductGroup)}
                  >
                    {PRODUCT_GROUPS.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Períodos de Verificação</label>
                  <div className="flex gap-2">
                    {(['abertura', 'transicao', 'fecho'] as Period[]).map(p => (
                      <button key={p} type="button" onClick={() => togglePeriod(p)} className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase transition-all ${newTPeriods.includes(p) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>{p}</button>
                    ))}
                  </div>
                </div>
              </div>

              <button disabled={isSubmitting} className="w-full py-5 bg-slate-900 text-white rounded-[24px] font-black text-lg shadow-xl active:scale-[0.98] transition-all">
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

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Trash2, 
  Edit2, 
  Lock, 
  User, 
  Mail, 
  AlertCircle, 
  Check, 
  Users,
  Shield
} from 'lucide-react';
import { 
  getRegisteredUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from '../../auth/auth';

export default function UserManagerModal({ isOpen, onClose, currentSessionUser }) {
  const [users, setUsers] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);

  // Formulário de Usuário
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'operator',
  });

  const [message, setMessage] = useState({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Recarrega lista de usuários ao abrir o modal
  const loadUsers = () => {
    const list = getRegisteredUsers();
    setUsers(list);
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
      resetForm();
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'operator',
    });
    setIsEditing(false);
    setEditingUserId(null);
    setMessage({ text: '', type: '' });
  };

  // Inicia edição de um usuário
  const handleStartEdit = (user) => {
    setIsEditing(true);
    setEditingUserId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Senha vazia significa não alterar
      role: user.role,
    });
    setMessage({ text: '', type: '' });
  };

  // Exclusão com confirmação
  const handleDelete = (user) => {
    if (user.isMaster || user.email.toLowerCase() === 'felipe@nftlogistics.com.br') {
      alert('O Administrador Principal não pode ser excluído.');
      return;
    }

    if (user.email.toLowerCase() === (currentSessionUser?.user || '').toLowerCase()) {
      alert('Você não pode excluir o seu próprio usuário logado.');
      return;
    }

    if (window.confirm(`Tem certeza que deseja excluir o acesso de "${user.name}" (${user.email})?`)) {
      try {
        deleteUser(user.id, currentSessionUser?.user);
        loadUsers();
        setMessage({ text: `Usuário ${user.email} excluído com sucesso.`, type: 'success' });
      } catch (err) {
        setMessage({ text: err.message, type: 'error' });
      }
    }
  };

  // Submissão do formulário (Criar ou Editar)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ text: '', type: '' });
    setIsSubmitting(true);

    try {
      if (isEditing) {
        await updateUser(editingUserId, formData);
        setMessage({ text: 'Usuário atualizado com sucesso!', type: 'success' });
      } else {
        await createUser(formData);
        setMessage({ text: 'Novo usuário cadastrado com sucesso!', type: 'success' });
      }
      loadUsers();
      resetForm();
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in no-print">
      
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Cabeçalho do Modal */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                Painel do Administrador • Gestão de Usuários
              </h2>
              <p className="text-xs text-slate-400">
                Cadastre, edite e gerencie quem pode acessar o Sistema de Etiquetas
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback visual de Mensagens */}
        {message.text && (
          <div className={`p-3.5 text-xs font-bold flex items-center gap-2 border-b ${
            message.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {message.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Conteúdo com Scroll */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Seção 1: Formulário (Criar / Editar) */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#ea5b27]" />
                <h3 className="text-xs sm:text-sm font-black text-slate-900 uppercase tracking-wide">
                  {isEditing ? 'Editar Usuário Selecionado' : 'Cadastrar Novo Usuário'}
                </h3>
              </div>

              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Nome Completo */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Nome Completo:
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Felipe Aguena"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#ea5b27]"
                    />
                  </div>
                </div>

                {/* E-mail / Usuário */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    E-mail de Acesso:
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="nome@nftlogistics.com.br"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#ea5b27]"
                    />
                  </div>
                </div>

                {/* Senha */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    {isEditing ? 'Nova Senha (opcional):' : 'Senha Inicial (mín. 6 dígitos):'}
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="password"
                      required={!isEditing}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder={isEditing ? 'Deixe em branco para não alterar' : '••••••••'}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:border-[#ea5b27]"
                    />
                  </div>
                </div>

                {/* Perfil de Acesso */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">
                    Nível de Permissão:
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-[#ea5b27] cursor-pointer"
                    >
                      <option value="operator">Operacional (Emissão e Gestão)</option>
                      <option value="admin">Administrador (Controle Total)</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Botão Salvar */}
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl bg-[#ea5b27] hover:bg-[#d24e1d] disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-orange-950/20 transition cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <span>Salvando...</span>
                  ) : (
                    <>
                      <span>{isEditing ? 'Atualizar Usuário' : 'Adicionar Usuário'}</span>
                      <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>

          {/* Seção 2: Tabela de Usuários Cadastrados */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider px-1">
              Usuários com Acesso Autorizado ({users.length})
            </h3>

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Nome</th>
                      <th className="py-3 px-4">E-mail / Usuário</th>
                      <th className="py-3 px-4 text-center">Permissão</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => {
                      const isCurrentUser = (currentSessionUser?.user || '').toLowerCase() === u.email.toLowerCase();
                      const isMasterAdmin = u.isMaster || u.email.toLowerCase() === 'felipe@nftlogistics.com.br';

                      return (
                        <tr key={u.id} className="hover:bg-slate-50/80 transition">
                          
                          {/* Nome */}
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div className="flex items-center gap-2">
                              <span>{u.name}</span>
                              {isCurrentUser && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-700">
                                  Você
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Email */}
                          <td className="py-3 px-4 font-mono text-slate-700">
                            {u.email}
                          </td>

                          {/* Permissão */}
                          <td className="py-3 px-4 text-center">
                            {u.role === 'admin' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 border border-purple-200">
                                <ShieldCheck className="w-3 h-3 text-purple-600" />
                                <span>{isMasterAdmin ? 'Admin Master' : 'Admin'}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-700 border border-slate-200">
                                <span>Operacional</span>
                              </span>
                            )}
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleStartEdit(u)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition cursor-pointer"
                                title="Editar dados"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {!isMasterAdmin && !isCurrentUser ? (
                                <button
                                  onClick={() => handleDelete(u)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                                  title="Excluir usuário"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <div className="w-7 h-7" title="Usuário protegido contra exclusão" />
                              )}
                            </div>
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Rodapé do Modal */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
          >
            Concluir e Fechar
          </button>
        </div>

      </div>

    </div>
  );
}

import streamlit as st
from streamlit_gsheets import GSheetsConnection

# 1. CONFIGURAÇÃO DA PÁGINA
st.set_page_config(page_title="Controlo de Validades", layout="wide", page_icon="📦")

# 2. BASE DE DADOS DE UTILIZADORES (Configuração solicitada)
# Podes alterar as senhas aqui sempre que quiseres
utilizadores = {
    "ricardo": {"senha": "123", "nivel": "admin"},
    "miguel": {"senha": "111", "nivel": "user"},
    "brites": {"senha": "222", "nivel": "user"},
    "toni": {"senha": "333", "nivel": "user"}
}

# 3. INICIALIZAÇÃO DO ESTADO DE SESSÃO
if "autenticado" not in st.session_state:
    st.session_state.autenticado = False
    st.session_state.user = None
    st.session_state.nivel = None

# --- ECRÃ DE LOGIN ---
if not st.session_state.autenticado:
    st.title("🔐 Sistema de Gestão de Validades")
    
    # Centralizar o formulário de login
    col1, col2, col3 = st.columns([1, 2, 1])
    with col2:
        with st.form("login_form"):
            st.subheader("Acesso de Colaborador")
            u_input = st.text_input("Utilizador").strip().lower()
            p_input = st.text_input("Palavra-passe", type="password").strip()
            submit = st.form_submit_button("Entrar")
            
            if submit:
                if u_input in utilizadores and utilizadores[u_input]["senha"] == p_input:
                    st.session_state.autenticado = True
                    st.session_state.user = u_input
                    st.session_state.nivel = utilizadores[u_input]["nivel"]
                    st.rerun()
                else:
                    st.error("❌ Utilizador ou senha incorretos.")
    st.stop()

# --- BARRA LATERAL (SIDEBAR) ---
st.sidebar.title(f"👤 Olá, {st.session_state.user.capitalize()}!")
st.sidebar.info(f"Nível de Acesso: {st.session_state.nivel.upper()}")

if st.sidebar.button("Terminar Sessão"):
    st.session_state.autenticado = False
    st.rerun()

# --- CONTEÚDO PRINCIPAL ---


if st.session_state.nivel == "admin":
    st.title("🛠️ Painel de Administração")
    st.write("Bem-vindo, Ricardo. Tens permissão para ver todos os dados e gerir o sistema.")
else:
    st.title("📦 Consulta de Stock e Validades")
    st.write("Bem-vindo ao painel de consulta rápida.")

# 4. LIGAÇÃO AO GOOGLE SHEETS
try:
    # Cria a conexão
    conn = st.connection("gsheets", type=GSheetsConnection)
    
    # Lê a folha principal (Aba inicial por padrão)
    # ttl="1m" faz com que a app atualize os dados a cada 1 minuto se houver mudanças no Excel
    df = conn.read(ttl="1m")
    
    # Mostrar os dados numa tabela bonita e interativa
    st.subheader("Produtos em Inventário")
    st.dataframe(
        df, 
        use_container_width=True, 
        hide_index=True
    )

except Exception as e:
    st.error("🚨 Erro ao carregar a base de dados do Google Sheets.")
    st.info("Verifica se o link nos Secrets está correto e se a folha está partilhada como 'Qualquer pessoa com o link'.")

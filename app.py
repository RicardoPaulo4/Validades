import streamlit as st
from streamlit_gsheets import GSheetsConnection

st.set_page_config(page_title="Gestão de Validades", layout="wide")

# Inicialização da sessão
if "auth_status" not in st.session_state:
    st.session_state.auth_status = False
    st.session_state.user_role = None

# --- ECRÃ DE LOGIN ---
if not st.session_state.auth_status:
    st.title("🔐 Login - Sistema de Validades")
    
    with st.form("meu_login"):
        u = st.text_input("Utilizador")
        p = st.text_input("Palavra-passe", type="password")
        submit = st.form_submit_button("Entrar")
        
        if submit:
            try:
                conn = st.connection("gsheets", type=GSheetsConnection)
                # Tenta ler a aba de utilizadores
                df_u = conn.read(worksheet="Utilizadores", ttl=0)
                
                # Procura o utilizador
                match = df_u[(df_u['utilizador'].astype(str) == u) & (df_u['senha'].astype(str) == p)]
                
                if not match.empty:
                    st.session_state.auth_status = True
                    st.session_state.user_role = match.iloc[0]['nivel']
                    st.rerun()
                else:
                    st.error("Credenciais inválidas")
            except Exception as e:
                st.error("Erro: Verifica se a aba 'Utilizadores' existe no Sheets.")
    st.stop()

# --- ÁREA PÓS-LOGIN (ADMIN E USERS) ---
st.sidebar.success(f"Perfil: {st.session_state.user_role}")
if st.sidebar.button("Sair"):
    st.session_state.auth_status = False
    st.rerun()

# Diferenciação de conteúdo
if st.session_state.user_role == "admin":
    st.title("🛠️ Painel Admin")
    # Aqui podes pôr o link para editar ou funções extra
    st.write("Bem-vindo, Chefe!")
else:
    st.title("📦 Consulta de Stock")
    st.write("Bem-vindo, Colaborador!")

# Conteúdo comum: A Tabela de Validades
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    df = conn.read() # Lê a primeira aba (Validades)
    st.dataframe(df, use_container_width=True)
except:
    st.error("Erro ao carregar os dados principais.")

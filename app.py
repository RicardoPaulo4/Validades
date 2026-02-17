import streamlit as st
from streamlit_gsheets import GSheetsConnection

st.set_page_config(page_title="Controlo de Validades", layout="wide")

# Inicialização da sessão
if "autenticado" not in st.session_state:
    st.session_state.autenticado = False
    st.session_state.user = None
    st.session_state.nivel = None

# --- ECRÃ DE LOGIN ---
if not st.session_state.autenticado:
    st.title("🔐 Acesso ao Sistema")
    
    with st.form("login_form"):
        u = st.text_input("Utilizador").strip()
        p = st.text_input("Palavra-passe", type="password").strip()
        btn = st.form_submit_button("Entrar")
        
        if btn:
            try:
                conn = st.connection("gsheets", type=GSheetsConnection)
                # Tentamos ler a aba de utilizadores
                df_u = conn.read(worksheet="Utilizadores", ttl=0)
                
                # Validação
                match = df_u[(df_u['utilizador'].astype(str) == u) & (df_u['senha'].astype(str) == p)]
                
                if not match.empty:
                    st.session_state.autenticado = True
                    st.session_state.user = u
                    st.session_state.nivel = match.iloc[0]['nivel']
                    st.rerun()
                else:
                    st.error("❌ Utilizador ou senha incorretos.")
            except Exception as e:
                st.error("🚨 Erro: Não foi possível encontrar a aba 'Utilizadores'.")
                st.info("Garanta que o nome da aba no Excel é exatamente 'Utilizadores'.")
    st.stop()

# --- ÁREA PÓS-LOGIN ---
st.sidebar.title(f"Olá, {st.session_state.user}!")
st.sidebar.write(f"Acesso: **{st.session_state.nivel}**")

if st.sidebar.button("Sair"):
    st.session_state.autenticado = False
    st.rerun()

# Conteúdo baseado no nível
if st.session_state.nivel == "admin":
    st.title("🛠️ Painel de Administração")
    st.write("Acesso total libertado.")
    # Aqui podes colocar funções de edição
else:
    st.title("📦 Consulta de Validades")
    st.write("Acesso de consulta para colaboradores.")

# Mostrar a tabela principal (Aba 1)
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    df = conn.read(ttl="1m") # Lê a primeira aba por padrão
    st.subheader("Lista de Artigos")
    st.dataframe(df, use_container_width=True)
except Exception as e:
    st.error(f"Erro ao carregar dados da planilha: {e}")

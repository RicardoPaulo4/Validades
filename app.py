import streamlit as st
from streamlit_gsheets import GSheetsConnection

st.set_page_config(page_title="Sistema de Validades", layout="wide")

# Inicialização do estado de login
if "autenticado" not in st.session_state:
    st.session_state.autenticado = False
    st.session_state.perfil = None

if not st.session_state.autenticado:
    st.title("🔐 Login")
    with st.form("login_form"):
        # Normalizamos a entrada para evitar erros de digitação
        u = st.text_input("Utilizador").strip().lower()
        p = st.text_input("Palavra-passe", type="password").strip()
        submit = st.form_submit_button("Entrar")
        
        if submit:
            try:
                # Conexão com o Google Sheets usando o link dos Secrets
                conn = st.connection("gsheets", type=GSheetsConnection)
                
                # IMPORTANTE: O nome da aba no Excel deve ser exatamente 'Utilizadores'
                df_u = conn.read(worksheet="Utilizadores", ttl=0)
                
                # Normalizamos os dados da planilha para a comparação
                df_u['utilizador'] = df_u['utilizador'].astype(str).str.strip().str.lower()
                df_u['senha'] = df_u['senha'].astype(str).str.strip()

                # Verificamos se existe correspondência
                match = df_u[(df_u['utilizador'] == u) & (df_u['senha'] == p)]
                
                if not match.empty:
                    st.session_state.autenticado = True
                    # Usamos 'nível' com acento conforme está na tua folha
                    st.session_state.perfil = match.iloc[0]['nível'].strip().lower()
                    st.rerun()
                else:
                    st.error("❌ Utilizador ou senha incorretos.")
            except Exception as e:
                st.error("🚨 Erro de Conexão (HTTP 400)")
                st.info("Causas comuns:\n1. O link nos Secrets está errado.\n2. A aba não se chama 'Utilizadores'.\n3. A folha não está pública.")
    st.stop()

# --- ÁREA PÓS-LOGIN ---
st.sidebar.success(f"Acesso: {st.session_state.perfil}")
if st.sidebar.button("Terminar Sessão"):
    st.session_state.autenticado = False
    st.rerun()

# Conteúdo para Admin (Ricardo)
if st.session_state.perfil == "admin":
    st.title("🛠️ Painel Administrativo")
    st.write("Bem-vindo ao centro de controlo.")
# Conteúdo para Utilizadores normais (os outros 100)
else:
    st.title("📦 Consulta de Stock")

# Tentativa de carregar os produtos
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    df_prod = conn.read() # Lê a primeira aba de dados
    st.dataframe(df_prod, use_container_width=True)
except:
    st.warning("Tabela de dados não encontrada.")

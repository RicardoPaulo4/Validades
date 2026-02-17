import streamlit as st
from streamlit_gsheets import GSheetsConnection

st.set_page_config(page_title="Sistema de Validades", layout="wide")

if "autenticado" not in st.session_state:
    st.session_state.autenticado = False

# --- PROCESSO DE LOGIN ---
if not st.session_state.autenticado:
    st.title("🔐 Login")
    with st.form("login_form"):
        u = st.text_input("Utilizador").strip().lower()
        p = st.text_input("Palavra-passe", type="password").strip()
        if st.form_submit_button("Entrar"):
            try:
                conn = st.connection("gsheets", type=GSheetsConnection)
                # Lendo a aba "Utilizadores" exatamente como na imagem
                df_u = conn.read(worksheet="Utilizadores", ttl=0)
                
                # Validação (convertendo para string para evitar erros de tipo)
                match = df_u[
                    (df_u['utilizador'].astype(str).str.lower() == u) & 
                    (df_u['senha'].astype(str) == p)
                ]
                
                if not match.empty:
                    st.session_state.autenticado = True
                    st.session_state.perfil = match.iloc[0]['nível']
                    st.rerun()
                else:
                    st.error("Utilizador ou senha incorretos.")
            except Exception as e:
                st.error(f"Erro ao ligar ao Sheets: {e}")
    st.stop()

# --- ÁREA LOGADA ---
st.success(f"Bem-vindo! Perfil: {st.session_state.perfil}")
if st.sidebar.button("Sair"):
    st.session_state.autenticado = False
    st.rerun()

# Mostrar a tabela de produtos conforme a tua aba 'produtos'
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    df_p = conn.read(worksheet="produtos")
    st.dataframe(df_p)
except:
    st.info("A carregar produtos...")

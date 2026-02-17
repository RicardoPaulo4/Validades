import streamlit as st
from streamlit_gsheets import GSheetsConnection

st.set_page_config(page_title="Gestão de Validades", layout="wide")

if "auth_status" not in st.session_state:
    st.session_state.auth_status = False
    st.session_state.user_role = None

if not st.session_state.auth_status:
    st.title("🔐 Login")
    with st.form("login_form"):
        u = st.text_input("Utilizador").strip().lower()
        p = st.text_input("Palavra-passe", type="password").strip()
        submit = st.form_submit_button("Entrar")
        
        if submit:
            try:
                conn = st.connection("gsheets", type=GSheetsConnection)
                # Lendo a aba com o nome exato: Utilizadores
                df_u = conn.read(worksheet="Utilizadores", ttl=0)
                
                # Ajustando para ler a coluna 'nível' com acento conforme a tua folha
                # E limpando espaços extras nos dados da folha
                df_u['utilizador'] = df_u['utilizador'].astype(str).str.strip().str.lower()
                df_u['senha'] = df_u['senha'].astype(str).str.strip()

                match = df_u[(df_u['utilizador'] == u) & (df_u['senha'] == p)]
                
                if not match.empty:
                    st.session_state.auth_status = True
                    # Acedendo à coluna 'nível' com acento
                    st.session_state.user_role = match.iloc[0]['nível']
                    st.rerun()
                else:
                    st.error("Credenciais inválidas")
            except Exception as e:
                st.error(f"Erro: Verifica se a aba 'Utilizadores' está acessível. Detalhe: {e}")
    st.stop()

# --- ÁREA PÓS-LOGIN ---
st.sidebar.write(f"Perfil: {st.session_state.user_role}")
if st.sidebar.button("Sair"):
    st.session_state.auth_status = False
    st.rerun()

if st.session_state.user_role == "admin":
    st.title("🛠️ Painel Admin")
    st.write("Bem-vindo, Ricardo!")
else:
    st.title("📦 Consulta de Stock")
    st.write("Olá!")

# Carregar os produtos (que estão noutra parte da folha)
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    df_prod = conn.read(worksheet="produtos") # Nome da aba na tua folha 
    st.dataframe(df_prod)
except:
    st.warning("Ainda não existem produtos registados.")

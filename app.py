import streamlit as st
from streamlit_gsheets import GSheetsConnection

st.set_page_config(page_title="Sistema de Validades", layout="wide")

# Inicialização da sessão
if "autenticado" not in st.session_state:
    st.session_state.autenticado = False
    st.session_state.perfil = None
    st.session_state.nome_utilizador = None

# --- ECRÃ DE LOGIN ---
if not st.session_state.autenticado:
    st.title("🔐 Login")
    
    with st.form("login_form"):
        # Usamos .strip().lower() para evitar erros com espaços ou maiúsculas
        u = st.text_input("Utilizador").strip().lower()
        p = st.text_input("Palavra-passe", type="password").strip()
        submit = st.form_submit_button("Entrar")
        
        if submit:
            try:
                conn = st.connection("gsheets", type=GSheetsConnection)
                # Lendo a aba com o nome exato: Utilizadores
                df_u = conn.read(worksheet="Utilizadores", ttl=0)
                
                # Normalização dos dados da folha para garantir a comparação
                df_u['utilizador'] = df_u['utilizador'].astype(str).str.strip().str.lower()
                df_u['senha'] = df_u['senha'].astype(str).str.strip()

                # Procura o utilizador
                match = df_u[(df_u['utilizador'] == u) & (df_u['senha'] == p)]
                
                if not match.empty:
                    st.session_state.autenticado = True
                    # Acedendo à coluna 'nível' com acento conforme o teu Excel
                    st.session_state.perfil = match.iloc[0]['nível']
                    st.session_state.nome_utilizador = u
                    st.rerun()
                else:
                    st.error("❌ Credenciais incorretas.")
            except Exception as e:
                st.error("🚨 Erro ao carregar base de dados.")
                st.info("Verifica se a aba 'Utilizadores' está com acesso público no Sheets.")
    st.stop()

# --- ÁREA PÓS-LOGIN ---
st.sidebar.success(f"Utilizador: {st.session_state.nome_utilizador}")
st.sidebar.write(f"Perfil: **{st.session_state.perfil}**")

if st.sidebar.button("Terminar Sessão"):
    st.session_state.autenticado = False
    st.rerun()

# --- CONTEÚDO DIFERENCIADO ---
if st.session_state.perfil == "admin":
    st.title("🛠️ Gestão de Stock (Modo Admin)")
    st.write("Bem-vindo, Ricardo. Tens acesso total.")
else:
    st.title("📦 Consulta de Validades")
    st.write("Bem-vindo! Aqui podes consultar o stock.")

# Carregar a tabela de produtos (Aba 'produtos')
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    df_prod = conn.read(worksheet="produtos")
    st.dataframe(df_prod, use_container_width=True)
except:
    st.warning("Ainda não existem dados na tabela de produtos.")

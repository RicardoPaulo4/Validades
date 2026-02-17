import streamlit as st
from streamlit_gsheets import GSheetsConnection

# Configuração da página
st.set_page_config(page_title="Gestão de Validades", layout="wide")

# --- INICIALIZAÇÃO DO ESTADO DE SESSÃO ---
if "auth_status" not in st.session_state:
    st.session_state.auth_status = False
    st.session_state.user_role = None
    st.session_state.user_login = None

# --- FUNÇÃO DE LOGIN ---
def login_screen():
    st.title("🔐 Login - Sistema de Validades")
    
    with st.form("login_form"):
        u = st.text_input("Utilizador")
        p = st.text_input("Palavra-passe", type="password")
        submit = st.form_submit_button("Entrar")
        
        if submit:
            try:
                conn = st.connection("gsheets", type=GSheetsConnection)
                # Lê a aba de utilizadores
                df_users = conn.read(worksheet="Utilizadores")
                
                # Valida as credenciais
                user_match = df_users[(df_users['utilizador'] == u) & (df_users['senha'].astype(str) == p)]
                
                if not user_match.empty:
                    st.session_state.auth_status = True
                    st.session_state.user_role = user_match.iloc[0]['nivel']
                    st.session_state.user_login = u
                    st.success("Login efetuado!")
                    st.rerun()
                else:
                    st.error("Credenciais incorretas.")
            except Exception as e:
                st.error(f"Erro ao carregar base de utilizadores: {e}")

# --- CONTROLO DE FLUXO ---
if not st.session_state.auth_status:
    login_screen()
    st.stop()

# --- ÁREA LOGADA ---
st.sidebar.title(f"👤 {st.session_state.user_login}")
st.sidebar.write(f"Perfil: **{st.session_state.user_role}**")

if st.sidebar.button("Terminar Sessão"):
    st.session_state.auth_status = False
    st.rerun()

# --- LÓGICA DE PERMISSÕES ---
if st.session_state.user_role == "admin":
    st.title("🛠️ Painel Administrativo")
    tab1, tab2 = st.tabs(["📊 Ver Validades", "⚙️ Gestão de Contas"])
    
    with tab1:
        conn = st.connection("gsheets", type=GSheetsConnection)
        df = conn.read() # Lê a aba principal de validades
        st.dataframe(df, use_container_width=True)
    
    with tab2:
        st.subheader("Controlo de Acessos")
        st.info("Aqui podes ver quem tem acesso ao sistema.")
        df_u = conn.read(worksheet="Utilizadores")
        st.table(df_u)

else:
    # VISÃO DO UTILIZADOR NORMAL
    st.title("📦 Consulta de Stock e Validades")
    conn = st.connection("gsheets", type=GSheetsConnection)
    df = conn.read()
    st.dataframe(df, use_container_width=True)
    st.info("Nota: Apenas o administrador pode editar estes dados.")

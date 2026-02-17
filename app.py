import streamlit as st
from streamlit_gsheets import GSheetsConnection

st.set_page_config(page_title="Gestão de Validades", layout="wide")

# --- SISTEMA DE AUTENTICAÇÃO INTERNO ---
def login():
    if "authenticated" not in st.session_state:
        st.session_state.authenticated = False
        st.session_state.user_level = None
        st.session_state.user_name = None

    if st.session_state.authenticated:
        return True

    st.title("🔐 Acesso ao Sistema")
    user_input = st.text_input("Utilizador")
    pass_input = st.text_input("Palavra-passe", type="password")

    if st.button("Entrar"):
        try:
            # Liga ao Sheets para validar quem entra
            conn = st.connection("gsheets", type=GSheetsConnection)
            df_users = conn.read(worksheet="Utilizadores") # Nome da aba criada
            
            # Procura o utilizador na tabela
            match = df_users[(df_users['utilizador'] == user_input) & (df_users['senha'].astype(str) == pass_input)]
            
            if not match.empty:
                st.session_state.authenticated = True
                st.session_state.user_level = match.iloc[0]['nivel']
                st.session_state.user_name = user_input
                st.rerun()
            else:
                st.error("❌ Utilizador ou senha incorretos")
        except Exception as e:
            st.error("Erro ao carregar base de utilizadores. Verifique se a aba 'Utilizadores' existe.")
    
    return False

# --- EXECUÇÃO DA APP ---
if login():
    # BARRA LATERAL DIFERENCIADA
    st.sidebar.write(f"Bem-vindo, **{st.session_state.user_name}**")
    st.sidebar.write(f"Nível: `{st.session_state.user_level}`")
    
    if st.sidebar.button("Sair"):
        st.session_state.authenticated = False
        st.rerun()

    # --- LÓGICA DE ACESSO ---
    if st.session_state.user_level == "admin":
        st.title("🛠️ Painel de Administração")
        st.success("Tens acesso total ao sistema.")
        
        # O Admin vê tudo e pode ter funções extra
        menu = st.tabs(["📊 Ver Dados", "➕ Gestão (Admin)"])
        
        with menu[0]:
            conn = st.connection("gsheets", type=GSheetsConnection)
            df = conn.read()
            st.dataframe(df, use_container_width=True)
            
        with menu[1]:
            st.subheader("Configurações de Administrador")
            st.write("Aqui podes ver a lista de utilizadores:")
            df_users_view = conn.read(worksheet="Utilizadores")
            st.table(df_users_view)

    else:
        # VISÃO DO UTILIZADOR COMUM (USER)
        st.title("📦 Consulta de Validades")
        st.info("Acesso de consulta rápida.")
        
        conn = st.connection("gsheets", type=GSheetsConnection)
        df = conn.read()
        # O User talvez só veja a tabela, sem permissão para apagar nada
        st.dataframe(df, use_container_width=True)

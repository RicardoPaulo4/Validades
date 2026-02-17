import streamlit as st
from streamlit_gsheets import GSheetsConnection

# Configuração da página (deve ser a primeira coisa)
st.set_page_config(page_title="Gestão de Validades", layout="wide")

# 1. FUNÇÃO DE LOGIN
def check_auth():
    if not st.user.get("is_logged_in"):
        # Se não está logado, mostra APENAS a página de entrada
        st.title("🔐 Sistema de Validades")
        st.info("Por favor, faça login para aceder aos dados.")
        
        if st.button("Entrar com Google"):
            st.login("google")
        
        # O st.stop() aqui é crucial para não carregar o resto da app
        st.stop()

# Executa a verificação
check_auth()

# 2. SE CHEGOU AQUI, É PORQUE ESTÁ LOGADO
# ---------------------------------------------------------
st.sidebar.success(f"Logado como: {st.user.email}")
if st.sidebar.button("Sair"):
    st.logout()

st.title("📦 Painel de Controlo de Validades")

# 3. CARREGAR DADOS DO GOOGLE SHEETS
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    # Substitua 'Folha1' pelo nome exato da sua aba no Excel
    df = conn.read(ttl="1m") 
    
    st.write("### Inventário Próximo do Vencimento")
    st.dataframe(df, use_container_width=True)
    
except Exception as e:
    st.error(f"Erro ao carregar Sheets: {e}")

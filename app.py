import streamlit as st

# 1. Configuração inicial
st.set_page_config(page_title="Gestão de Validades", layout="wide")

# 2. Forçar a verificação de sessão
if "user_info" not in st.session_state:
    st.session_state.user_info = st.user

# Se NÃO está logado ou a sessão está vazia
if not st.session_state.user_info.get("is_logged_in"):
    st.title("🔐 Acesso ao Sistema")
    st.warning("Aguardando autenticação...")
    if st.button("Entrar com Google"):
        st.login("google")
    st.stop()

# --- SE PASSOU DAQUI, O LOGIN É REAL ---
st.success(f"Bem-vindo, {st.session_state.user_info.name}!")

import streamlit as st

# Verificação de segurança
if "auth" not in st.secrets:
    st.error("❌ Erro: As chaves 'auth' não foram encontradas nos Secrets do Streamlit!")
    st.stop()

# Fluxo de Login
if not st.user.get("is_logged_in"):
    st.title("🔐 Acesso Sistema Validades")
    st.info("Clica no botão para validar a tua conta Google.")
    if st.button("Entrar com Google"):
        st.login()
    st.stop()

# App Principal
st.success(f"Bem-vindo, {st.user.email}!")

if st.sidebar.button("Sair"):
    st.logout()

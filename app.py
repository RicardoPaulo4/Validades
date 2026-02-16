import streamlit as st

# O Streamlit deteta as chaves nos Secrets e ativa o st.login automaticamente
if not st.experimental_user.is_logged_in:
    st.title("🔐 Acesso via Google")
    st.info("Por favor, clique no botão para entrar.")
    if st.button("Entrar com Google"):
        st.login()
    st.stop()

# Se logado, mostra o conteúdo
user = st.experimental_user
st.success(f"Olá, {user.email}! Bem-vindo ao sistema.")

if st.sidebar.button("Sair"):
    st.logout()

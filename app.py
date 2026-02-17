import streamlit as st

# 1. Lista de emails que podem aceder à app
UTILIZADORES_AUTORIZADOS = [
    "teu-email@gmail.com",
    "gerente@empresa.com",
    "funcionario1@gmail.com"
]

if not st.user.get("is_logged_in"):
    st.title("🔐 Acesso Restrito")
    if st.button("Entrar com Google"):
        st.login("google")
    st.stop()

# 2. VALIDAÇÃO: O email está na lista?
user_email = st.user.email

if user_email not in UTILIZADORES_AUTORIZADOS:
    st.error(f"O utilizador {user_email} não tem permissão para aceder a este sistema.")
    if st.button("Sair"):
        st.logout()
    st.stop()

# 3. Se passar a validação, a app continua aqui
st.success(f"Bem-vindo, {st.user.name}!")

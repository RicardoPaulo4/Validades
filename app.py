import streamlit as st

# No Streamlit 1.40+, o 'experimental_user' passou a ser apenas 'st.user'
# Se st.user estiver vazio, o utilizador não está logado
if not st.user.get("is_logged_in"):
    st.title("🔐 Gestão de Validades")
    st.write("Bem-vindo! Por favor, utilize a sua conta Google para aceder.")
    
    if st.button("Entrar com Google"):
        st.login() # Inicia o fluxo configurado nos Secrets
    st.stop()

# Se o código chegar aqui, o utilizador está autenticado
email_atual = st.user.email
st.success(f"Ligado como: {email_atual}")

if st.sidebar.button("Sair"):
    st.logout()

import streamlit as st

# Tenta usar o novo sistema de utilizador do Streamlit
# Se a tua versão for muito recente, usa-se st.user
# Se não, usamos st.session_state para controlar o login

if "logado" not in st.session_state:
    st.session_state.logado = False

if not st.session_state.logado:
    st.title("🔐 Acesso via Google")
    st.write("Clica no botão abaixo para entrar com a tua conta autorizada.")
    
    # O comando st.login() ativa a configuração que fizeste no Google Cloud
    if st.button("Entrar com Google"):
        try:
            st.login() # Inicia o fluxo OAuth2
            st.session_state.logado = True
        except Exception as e:
            st.error("Erro na configuração de autenticação. Verifica os Secrets.")
    st.stop()

# Se passar daqui, o utilizador está dentro
user_info = st.user # Obtém os dados do utilizador logado
st.write(f"Olá, {user_info.email}!")
import streamlit as st

# O Streamlit gere o login automaticamente se os Secrets estiverem corretos
if not st.experimental_user.is_logged_in:
    st.title("🔐 Acesso via Google")
    if st.button("Entrar com Google"):
        st.login()
    st.stop()

# Se logado, mostra o email
user = st.experimental_user
st.success(f"Ligado como: {user.email}")

if st.sidebar.button("Sair"):
    st.logout()

import streamlit as st

# Tenta limpar qualquer lixo de sessão anterior
if 'auth_status' not in st.session_state:
    st.session_state.auth_status = None

st.title("Teste de Autenticação")

# Verifica o estado real do utilizador
user = st.user

if not user.get("is_logged_in"):
    st.warning("Estado: Não Logado")
    if st.button("Efetuar Login"):
        st.login("google")
    st.stop()

# Se ele conseguir passar do stop, o login funcionou!
st.balloons()
st.success(f"Sucesso! Bem-vindo {user.name}")
st.write(f"O seu email é: {user.email}")

if st.button("Sair"):
    st.logout()

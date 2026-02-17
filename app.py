import streamlit as st
from streamlit_gsheets import GSheetsConnection

# 1. Verificação de Autenticação
if not st.user.get("is_logged_in"):
    st.title("🔐 Gestão de Validades")
    st.info("Bem-vindo! Por favor, utilize a sua conta Google para aceder ao sistema.")
    if st.button("Entrar com Google"):
        st.login()  # O Streamlit vai buscar as chaves [auth.google] automaticamente
    st.stop()

# 2. Se logado, mostra a App
st.sidebar.write(f"Utilizador: **{st.user.email}**")
if st.sidebar.button("Sair"):
    st.logout()

st.title("📦 Sistema de Controlo de Validades")

# 3. Ligação à Base de Dados (Google Sheets)
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    df = conn.read(ttl="1m") # Lê os dados (atualiza a cada 1 minuto)
    st.dataframe(df)
except Exception as e:
    st.error(f"Erro ao ligar ao Google Sheets: {e}")

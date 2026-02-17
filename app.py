import streamlit as st

# Verifica se o utilizador já está logado
if not st.user.get("is_logged_in"):
    st.title("🔐 Acesso ao Sistema")
    st.write("Bem-vindo! Identifique-se para continuar.")
    
    if st.button("Entrar com Google"):
        st.login("google")
    
    st.stop() # Importante: interrompe o script aqui para quem não está logado

# --- SE CHEGOU AQUI, O LOGIN FOI RECONHECIDO ---
st.success(f"Olá, {st.user.name}!")
st.write(f"Email: {st.user.email}")

if st.sidebar.button("Sair"):
    st.logout()

# Aqui colocas o resto do teu código (tabelas, gráficos, etc.)
st.title("📦 Inventário de Validades")

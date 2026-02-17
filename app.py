import streamlit as st

# Configuração correta: o layout deve ser "centered" ou "wide"
st.set_page_config(page_title="Validador", layout="centered")

# 1. VERIFICAÇÃO DE LOGIN
if not st.user.get("is_logged_in"):
    st.title("🔐 Portaria do Sistema")
    st.info("Aguardando autenticação Google...")
    
    if st.button("Clicar para Entrar"):
        st.login("google")
    
    st.stop()

# 2. CONTEÚDO PÓS-LOGIN (Só aparece se o login funcionar)
st.balloons()
st.title("✅ Acesso Concedido!")
st.success(f"Bem-vindo, {st.user.name}!")

st.write("---")
st.subheader("Conteúdo Protegido")
st.write("Se estás a ver isto, o sistema de login está 100% funcional.")

if st.sidebar.button("Terminar Sessão"):
    st.logout()

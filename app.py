import streamlit as st

st.title("Diagnóstico de Acesso")

# 1. Verificar se os segredos existem
if "auth" not in st.secrets:
    st.error("❌ O Streamlit NÃO detetou a secção [auth] nos Secrets.")
    st.write("Verifique se gravou os Secrets corretamente no painel do Streamlit Cloud.")
else:
    st.success("✅ Secção [auth] detetada.")
    
    # 2. Verificar se o Google ID está lá
    if "google" in st.secrets["auth"]:
        st.success("✅ Chaves do Google encontradas.")
    else:
        st.error("❌ Chaves [auth.google] em falta.")

# 3. Tentar o Login apenas se as chaves existirem
if not st.user.get("is_logged_in"):
    if st.button("Tentar Entrar com Google"):
        try:
            st.login()
        except Exception as e:
            st.error(f"Erro ao iniciar login: {e}")
else:
    st.write(f"Logado como: {st.user.email}")
    if st.button("Sair"):
        st.logout()

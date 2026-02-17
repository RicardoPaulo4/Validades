import streamlit as st

# 1. VERIFICAÇÃO INICIAL
st.set_page_config(page_title="Validador", centered=True)

if not st.user.get("is_logged_in"):
    # --- TUDO O QUE APARECE ANTES DO LOGIN ---
    st.title("🔒 Portaria do Sistema")
    st.info("Aguardando autenticação Google...")
    
    if st.button("Clicar para Entrar"):
        st.login("google")
    
    # O código MORRE aqui para quem não está logado
    st.stop()

# --- 2. TUDO O QUE APARECE DEPOIS DO LOGIN ---
# Se o código chegar aqui, é porque o login FUNCIONOU.
st.balloons()
st.title("✅ ÁREA RESTRITA ACEDIDA")
st.success(f"Bem-vindo, {st.user.name}!")

with st.expander("Ver teus dados de perfil"):
    st.write(st.user)

if st.button("Terminar Sessão"):
    st.logout()

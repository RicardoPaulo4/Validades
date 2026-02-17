import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd

# 1. Configuração da Página
st.set_page_config(page_title="Gestão de Validades", layout="wide")

# 2. Portaria (Login)
if not st.user.get("is_logged_in"):
    st.title("🔐 Sistema de Controlo de Validades")
    st.info("Identifique-se com a sua conta Google para aceder ao inventário.")
    if st.button("Entrar com Google"):
        st.login("google")
    st.stop() # Bloqueia tudo o que está abaixo se não houver login

# 3. Restante App (Onde estavam as tuas validades)
# ------------------------------------------------------------------
st.sidebar.success(f"Utilizador: {st.user.email}")
if st.sidebar.button("Sair"):
    st.logout()

st.title("📦 Inventário e Controlo de Validades")

# Ligação ao Google Sheets (Usando os teus Secrets configurados)
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    
    # Lê os dados da folha principal
    # (Podes mudar o nome da folha ou o TTL conforme precisares)
    df = conn.read(ttl="1m") 

    # --- Aqui podes adicionar os filtros ou gráficos que tinhas antes ---
    
    st.subheader("Lista de Produtos")
    st.dataframe(df, use_container_width=True)

    # Exemplo de um alerta visual simples
    if "Validade" in df.columns:
        st.info("Dica: Use os filtros laterais para gerir os prazos.")

except Exception as e:
    st.error(f"Erro ao carregar os dados do Google Sheets: {e}")
    st.info("Verifique se o URL da folha nos Secrets está correto.")

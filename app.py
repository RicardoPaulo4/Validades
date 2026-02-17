import streamlit as st
from streamlit_gsheets import GSheetsConnection

# 1. Configurações Iniciais do Layout
st.set_page_config(page_title="Controlo de Validades", layout="wide")

# 2. SISTEMA DE LOGIN (A "Portaria")
if not st.user.get("is_logged_in"):
    st.title("🔐 Acesso Restrito")
    st.info("Bem-vindo! Por favor, identifique-se com a sua conta Google para aceder ao inventário.")
    
    if st.button("Entrar com Google"):
        st.login("google")
    
    # Bloqueia a execução aqui até que o login seja feito
    st.stop()

# 3. CONTEÚDO DA APP ORIGINAL (A "Área Privada")
# ------------------------------------------------------------------

# Barra lateral com informações do utilizador e botão de saída
st.sidebar.image(st.user.picture, width=100)
st.sidebar.write(f"Olá, **{st.user.name}**!")
if st.sidebar.button("Terminar Sessão"):
    st.logout()

st.title("📦 Gestão de Inventário e Validades")

# Ligação ao Google Sheets
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    
    # Aqui recuperamos os dados da sua folha de cálculo
    df = conn.read(ttl="1m") 

    # --- ZONA DA SUA APP ANTERIOR ---
    # Aqui pode adicionar novamente os seus filtros, gráficos e tabelas
    st.subheader("Visualização de Stock")
    st.dataframe(df, use_container_width=True)
    
    # Exemplo: Se tiver uma coluna chamada 'Produto' e 'Data'
    # st.line_chart(df.set_index('Produto')) 

except Exception as e:
    st.error(f"Erro ao carregar os dados do Google Sheets: {e}")
    st.info("Dica: Confirme se o URL da folha nos 'Secrets' está correto.")

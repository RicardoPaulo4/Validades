import streamlit as st
from streamlit_gsheets import GSheetsConnection

# 1. DEFINE QUEM É O ADMIN (Coloca o teu email aqui)
ADMIN_EMAIL = "ricardo.maio.paulo@gmail.com" 

st.set_page_config(page_title="Gestão de Validades", layout="wide")

# 2. LOGIN
if not st.user.get("is_logged_in"):
    st.title("🔐 Sistema de Validades")
    if st.button("Entrar com Google"):
        st.login("google")
    st.stop()

# 3. VERIFICAÇÃO DE PERFIL
is_admin = (st.user.email == ADMIN_EMAIL)

# 4. MENU LATERAL DIFERENCIADO
st.sidebar.image(st.user.picture, width=50)
st.sidebar.write(f"Olá, {st.user.name}")

if is_admin:
    st.sidebar.info("⭐ Perfil: Administrador")
    menu = st.sidebar.radio("Ir para:", ["Ver Validades", "Painel Admin (Editar)"])
else:
    st.sidebar.warning("👤 Perfil: Utilizador")
    menu = "Ver Validades"

if st.sidebar.button("Sair"):
    st.logout()

# 5. LÓGICA DAS PÁGINAS
if menu == "Painel Admin (Editar)":
    st.title("🛠️ Área de Administração")
    st.write("Aqui podes adicionar novos produtos ou apagar registos.")
    # Exemplo: Link direto para o Google Sheets para editar
    st.link_button("Abrir Planilha Original", "https://docs.google.com/spreadsheets/d/1hrDjwIXP3Bffyt27v6LM_MYxQBAAfhPsOy4u6C4qOFc/edit")
    
else:
    st.title("📦 Consulta de Stock")
    try:
        conn = st.connection("gsheets", type=GSheetsConnection)
        df = conn.read(ttl="1m")
        st.dataframe(df, use_container_width=True)
    except Exception as e:
        st.error(f"Erro ao ler dados: {e}")

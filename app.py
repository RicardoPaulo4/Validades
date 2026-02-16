import streamlit as st
from streamlit_gsheets import GSheetsConnection

# Configuração da página
st.set_page_config(page_title="Validades Google Login")

# Conexão com Sheets
conn = st.connection("gsheets", type=GSheetsConnection)

# Função para ler utilizadores autorizados
def get_users():
    return conn.read(worksheet="utilizadores", ttl=0)

# --- SISTEMA DE AUTENTICAÇÃO ---
# Nota: st.login() e st.experimental_user são as novas funções do Streamlit
if not st.experimental_user.is_logged_in:
    st.title("🔐 Acesso Restrito")
    st.write("Usa a tua conta Google para entrar.")
    if st.button("Entrar com Google"):
        st.login()
    st.stop()

# Se chegou aqui, o utilizador está logado no Google
email_logado = st.experimental_user.email

# Verifica se o email existe na tua folha de utilizadores
try:
    df_u = get_users()
    if email_logado in df_u['email'].values:
        user_data = df_u[df_u['email'] == email_logado].iloc[0]
        
        if user_data['status'] == 'Ativo':
            st.success(f"Bem-vindo, {user_data['nome']}!")
            # --- AQUI COMEÇA O RESTO DA TUA APP (Produtos, etc) ---
            st.write("Conteúdo da App aqui...")
        else:
            st.warning("A tua conta aguarda ativação pelo Administrador.")
    else:
        st.error(f"O email {email_logado} não tem autorização.")
        if st.button("Solicitar Acesso"):
            # Lógica para adicionar o email à folha como 'Pendente'
            st.info("Pedido enviado.")
except Exception as e:
    st.error("Erro ao verificar base de dados. Verifica o link nos Secrets.")

if st.sidebar.button("Sair"):
    st.logout()

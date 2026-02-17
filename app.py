import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd

st.set_page_config(page_title="Gestão de Validades", layout="wide")

# Inicialização da sessão
if "autenticado" not in st.session_state:
    st.session_state.autenticado = False
    st.session_state.perfil = None

# --- ECRÃ DE LOGIN ---
if not st.session_state.autenticado:
    st.title("🔐 Login - Sistema de Validades")
    
    with st.form("login_form"):
        u_input = st.text_input("Utilizador").strip().lower()
        p_input = st.text_input("Palavra-passe", type="password").strip()
        submit = st.form_submit_button("Entrar")
        
        if submit:
            try:
                conn = st.connection("gsheets", type=GSheetsConnection)
                # Lendo a aba exatamente como está na imagem: "Utilizadores"
                df_u = conn.read(worksheet="Utilizadores", ttl=0)
                
                # Limpeza técnica para garantir que a comparação funciona
                df_u['utilizador'] = df_u['utilizador'].astype(str).str.strip().str.lower()
                df_u['senha'] = df_u['senha'].astype(str).str.strip()

                # Procura o utilizador na tabela
                user_match = df_u[(df_u['utilizador'] == u_input) & (df_u['senha'] == p_input)]
                
                if not user_match.empty:
                    st.session_state.autenticado = True
                    # Acedendo à coluna 'nível' com acento conforme a tua imagem
                    st.session_state.perfil = user_match.iloc[0]['nível'].strip().lower()
                    st.rerun()
                else:
                    st.error("❌ Utilizador ou senha incorretos.")
            except Exception as e:
                st.error("🚨 Erro de Ligação ao Sheets!")
                st.info("Verifica se o link nos Secrets termina em /edit e se a aba chama-se 'Utilizadores'.")
    st.stop()

# --- ÁREA PÓS-LOGIN ---
st.sidebar.success(f"Perfil: {st.session_state.perfil.upper()}")
if st.sidebar.button("Sair"):
    st.session_state.autenticado = False
    st.rerun()

# Diferenciação por nível
if st.session_state.perfil == "admin":
    st.title("🛠️ Painel de Administração")
    st.info("Bem-vindo, Ricardo. Tens permissão total.")
else:
    st.title("📦 Consulta de Stock")

# Carregar a tabela de produtos (aba 'produtos' na tua imagem)
try:
    conn = st.connection("gsheets", type=GSheetsConnection)
    df_prod = conn.read(worksheet="produtos", ttl="1m")
    st.dataframe(df_prod, use_container_width=True)
except Exception as e:
    st.warning("⚠️ Não foi possível carregar a aba 'produtos'. Verifique o nome da aba.")

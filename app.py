import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd
from datetime import datetime

# 1. CONFIGURAÇÃO DA PÁGINA
st.set_page_config(page_title="ValidaControl - Smart Expiry", layout="centered", page_icon="🔐")

# --- ESTILO CSS PARA DESIGN PROFISSIONAL ---
st.markdown("""
    <style>
    /* Esconder elementos padrão do Streamlit */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
    /* Fundo da página */
    .stApp {
        background-color: #F8F9FF;
    }

    /* Contentor do Login */
    .login-box {
        background-color: white;
        padding: 40px;
        border-radius: 30px;
        box-shadow: 0px 10px 30px rgba(0, 0, 0, 0.05);
        text-align: center;
    }

    /* Estilização dos inputs */
    .stTextInput > div > div > input {
        background-color: #F1F4F9;
        border: none;
        border-radius: 15px;
        padding: 15px;
        height: 50px;
    }

    /* Botão Entrar (Escuro como na imagem) */
    div.stButton > button {
        background-color: #111827;
        color: white;
        width: 100%;
        border-radius: 20px;
        height: 60px;
        font-weight: bold;
        font-size: 18px;
        border: none;
        transition: 0.3s;
    }
    
    div.stButton > button:hover {
        background-color: #2D3748;
        color: white;
    }

    /* Logo e Títulos */
    .main-title {
        color: #111827;
        font-family: 'Helvetica Neue', sans-serif;
        font-weight: 800;
        font-size: 32px;
        margin-bottom: 0px;
    }
    .main-title span { color: #6366F1; }
    .sub-title {
        color: #9CA3AF;
        letter-spacing: 2px;
        font-size: 12px;
        font-weight: 600;
        margin-bottom: 30px;
    }
    </style>
    """, unsafe_allow_html=True)

# 2. DEFINIÇÃO DE UTILIZADORES
utilizadores = {
    "ricardo": {"senha": "123", "nivel": "admin"},
    "miguel": {"senha": "111", "nivel": "user"},
    "brites": {"senha": "222", "nivel": "user"},
    "toni": {"senha": "333", "nivel": "user"}
}

if "autenticado" not in st.session_state:
    st.session_state.autenticado = False

# --- ECRÃ DE LOGIN ESTILIZADO ---
if not st.session_state.autenticado:
    # Cabeçalho Visual
    st.markdown("<div style='text-align: center; margin-top: 50px;'>", unsafe_allow_html=True)
    st.image("https://cdn-icons-png.flaticon.com/512/10552/10552013.png", width=80) # Ícone de check azul
    st.markdown("<h1 class='main-title'>Valida<span>Control</span></h1>", unsafe_allow_html=True)
    st.markdown("<p class='sub-title'>SMART EXPIRY SYSTEMS</p>", unsafe_allow_html=True)
    
    # Formulário
    with st.container():
        u = st.text_input("EMAIL EMPRESARIAL", placeholder="ex: ricardo@loja.pt").lower().strip()
        p = st.text_input("PALAVRA-PASSE", type="password", placeholder="••••••••")
        
        if st.button("Entrar na Loja"):
            if u in utilizadores and utilizadores[u]["senha"] == p:
                st.session_state.autenticado = True
                st.session_state.user = u
                st.session_state.nivel = utilizadores[u]["nivel"]
                st.rerun()
            else:
                st.error("Credenciais incorretas")
    st.markdown("</div>", unsafe_allow_html=True)
    st.stop()

# --- CONEXÃO AO SHEETS (Área Interna) ---
conn = st.connection("gsheets", type=GSheetsConnection)

# Conteúdo após o login (Admin/User)
if st.session_state.nivel == "admin":
    st.title("🛠️ Painel Admin")
    # ... resto do código do Dashboard ...
else:
    st.title("📦 Seleção de Produto")
    # ... resto do código das Fotos ...

if st.sidebar.button("Terminar Sessão"):
    st.session_state.autenticado = False
    st.rerun()

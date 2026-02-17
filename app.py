import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd
from datetime import datetime

# CONFIGURAÇÃO DE INTERFACE
st.set_page_config(page_title="ValidaControl", layout="centered", initial_sidebar_state="collapsed")

# REPLICAÇÃO DO DESIGN (CSS)
st.markdown("""
    <style>
    .stApp { background-color: #F8F9FF; }
    .stButton>button {
        background-color: #111827;
        color: white;
        border-radius: 20px;
        height: 3em;
        width: 100%;
        border: none;
        font-weight: bold;
    }
    .product-card {
        background: white;
        padding: 15px;
        border-radius: 20px;
        box-shadow: 0 4px 10px rgba(0,0,0,0.05);
        text-align: center;
        margin-bottom: 15px;
    }
    </style>
    """, unsafe_allow_html=True)

# GESTÃO DE ESTADO (Equivalente ao AuthState do React)
if "isAuthenticated" not in st.session_state:
    st.session_state.update({
        "isAuthenticated": False,
        "user": None,
        "session": None, # Guarda o Turno (Abertura/Fecho)
        "step": "login"
    })

# --- LÓGICA DE NAVEGAÇÃO ---

# 1. AUTH (Replica Auth.tsx)
if not st.session_state.isAuthenticated:
    st.markdown("<h1 style='text-align:center;'>🔵 ValidaControl</h1>", unsafe_allow_html=True)
    with st.container():
        user_input = st.text_input("UTILIZADOR").lower().strip()
        pass_input = st.text_input("PALAVRA-PASSE", type="password")
        if st.button("ENTRAR NA LOJA"):
            # Lógica de validação simples
            if user_input == "ricardo":
                st.session_state.update({"isAuthenticated": True, "user": {"name": "Ricardo", "role": "admin"}})
                st.rerun()
            elif user_input in ["miguel", "brites", "toni"]:
                st.session_state.update({"isAuthenticated": True, "user": {"name": user_input.capitalize(), "role": "operator"}})
                st.rerun()

# 2. PERIOD SELECTOR (Replica PeriodSelector.tsx)
elif st.session_state.user['role'] == 'operator' and st.session_state.session is None:
    st.markdown(f"### Olá, {st.session_state.user['name']}\nSeleccione o turno:")
    col1, col2, col3 = st.columns(3)
    if col1.button("🌅 ABERTURA"): st.session_state.session = "Abertura"; st.rerun()
    if col2.button("☀️ TRANSIÇÃO"): st.session_state.session = "Transição"; st.rerun()
    if col3.button("🌙 FECHO"): st.session_state.session = "Fecho"; st.rerun()

# 3. OPERATOR FORM (Replica OperatorForm.tsx)
elif st.session_state.isAuthenticated:
    if st.session_state.user['role'] == 'admin':
        st.title("📊 Dashboard Admin")
        # Aqui conectamos ao Sheets para ler registos
    else:
        st.markdown(f"**Turno:** {st.session_state.session}")
        
        # CONEXÃO GOOGLE SHEETS
        conn = st.connection("gsheets", type=GSheetsConnection)
        
        # BUSCAR PRODUTOS (Catálogo Visual)
        try:
            df_p = conn.read(worksheet="produtos")
            st.write("Seleccione o produto para registar:")
            
            # Grelha de fotos
            cols = st.columns(2)
            for i, row in df_p.iterrows():
                with cols[i % 2]:
                    st.markdown(f'<div class="product-card">', unsafe_allow_html=True)
                    st.image(row['Foto_URL'], use_container_width=True)
                    if st.button(f"Registar {row['Nome']}", key=f"p_{i}"):
                        st.session_state.selected_prod = row['Nome']
                    st.markdown('</div>', unsafe_allow_html=True)
            
            # Form de data (aparece após clique na foto)
            if "selected_prod" in st.session_state:
                st.divider()
                st.subheader(f"Data para: {st.session_state.selected_prod}")
                val_date = st.date_input("Validade")
                if st.button("Confirmar Registo"):
                    # Aqui entra o código de gravar no Sheets
                    st.success("Gravado com sucesso!")
                    del st.session_state.selected_prod
                    
        except:
            st.warning("Configure a aba 'produtos' no seu Google Sheets.")

    if st.sidebar.button("Terminar Sessão"):
        st.session_state.isAuthenticated = False
        st.session_state.session = None
        st.rerun()

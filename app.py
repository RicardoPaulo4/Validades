import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd
from datetime import datetime

# 1. CONFIGURAÇÃO VISUAL DA PÁGINA
st.set_page_config(page_title="ValidaControl PWA", layout="wide", initial_sidebar_state="collapsed")

# --- DESIGN CUSTOMIZADO (CSS) ---
st.markdown("""
    <style>
    .stApp { background-color: #F8F9FF; }
    [data-testid="stHeader"] { background: rgba(0,0,0,0); }
    
    /* Cartões de Métricas */
    .metric-card {
        background-color: white;
        padding: 30px;
        border-radius: 40px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.03);
        text-align: left;
        border: 1px solid #F1F4F9;
    }
    .metric-title { font-size: 12px; font-weight: 700; letter-spacing: 1px; margin-bottom: 10px; }
    .metric-value { font-size: 64px; font-weight: 800; color: #111827; line-height: 1; }
    .metric-unit { font-size: 14px; color: #9CA3AF; font-weight: 500; }
    
    /* Cartão Dark (Risco) */
    .risk-card {
        background-color: #111827;
        color: white;
        padding: 30px;
        border-radius: 40px;
        position: relative;
        overflow: hidden;
    }
    
    /* Tabs Customizadas */
    .stTabs [data-baseweb="tab-list"] {
        gap: 10px;
        background-color: white;
        padding: 10px;
        border-radius: 50px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.05);
        justify-content: center;
    }
    .stTabs [data-baseweb="tab"] {
        height: 50px;
        border-radius: 40px;
        padding: 0 60px;
        font-weight: 700;
        background-color: transparent;
        border: none;
        color: #9CA3AF;
    }
    .stTabs [aria-selected="true"] {
        background-color: #111827 !important;
        color: white !important;
    }
    </style>
    """, unsafe_allow_html=True)

# 2. LOGIN (Simplificado conforme imagens anteriores)
if "autenticado" not in st.session_state:
    st.session_state.autenticado = False

if not st.session_state.autenticado:
    # (Inserir aqui o bloco de login do passo anterior se quiseres testar)
    st.session_state.autenticado = True # Forçar True apenas para visualizares agora
    st.session_state.nivel = "admin"
    st.session_state.user = "Ricardo"

# --- INTERFACE ADMIN ---
# Header
col_logo, col_space, col_user = st.columns([1, 3, 1])
with col_logo:
    st.markdown("### 🔵 **Valida**Control")
with col_user:
    st.markdown(f"<div style='text-align:right;'><p style='margin:0; font-size:12px; font-weight:700;'>Administrador</p><p style='margin:0; font-size:11px; color:gray;'>{st.session_state.user.upper()}</p></div>", unsafe_allow_html=True)

st.write("---")

# Seleção de Menu (Registos / Catálogo)
tab_registos, tab_catalogo = st.tabs(["REGISTOS", "CATÁLOGO"])

with tab_registos:
    # 3. DASHBOARD DE MÉTRICAS (Igual à imagem 2)
    m1, m2, m3 = st.columns(3)
    
    with m1:
        st.markdown(f"""<div class="metric-card">
            <div class="metric-title" style="color: #F59E0B;">● PRÓXIMOS</div>
            <div class="metric-value">0 <span class="metric-unit">unid.</span></div>
        </div>""", unsafe_allow_html=True)
        
    with m2:
        st.markdown(f"""<div class="metric-card">
            <div class="metric-title" style="color: #EF4444;">● EXPIRADOS</div>
            <div class="metric-value">0 <span class="metric-unit">unid.</span></div>
        </div>""", unsafe_allow_html=True)
        
    with m3:
        st.markdown(f"""<div class="risk-card">
            <div class="metric-title" style="color: #9CA3AF;">RISCO DE STOCK</div>
            <div class="metric-value" style="color: white;">0%</div>
            <div style="height: 4px; background: #374151; margin-top: 20px; border-radius: 2px;"></div>
        </div>""", unsafe_allow_html=True)

    st.markdown("<br><br><p style='font-size:12px; font-weight:700; color:#9CA3AF;'>ACTIVIDADE RECENTE</p>", unsafe_allow_html=True)
    
    # Área de Lista Vazia (Igual à imagem)
    st.markdown("""
        <div style="text-align: center; padding: 80px; background-color: white; border-radius: 40px; border: 2px dashed #E5E7EB; margin-top: 20px;">
            <img src="https://cdn-icons-png.flaticon.com/512/4076/4076432.png" width="60" style="opacity: 0.2; margin-bottom: 20px;">
            <p style="font-weight: 700; color: #111827; margin:0;">Sem registos activos</p>
            <p style="color: #9CA3AF; font-size: 12px;">Os novos registos de operadores aparecerão aqui.</p>
        </div>
    """, unsafe_allow_html=True)

with tab_catalogo:
    st.subheader("Gestão do Catálogo de Produtos")
    # Aqui entra o código que já fizemos para o Admin criar produtos no Sheets

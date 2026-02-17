import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd
from datetime import datetime

# 1. CONFIGURAÇÃO E LOGIN
st.set_page_config(page_title="Gestão de Validades", layout="wide")

utilizadores = {
    "ricardo": {"senha": "123", "nivel": "admin"},
    "miguel": {"senha": "111", "nivel": "user"},
    "brites": {"senha": "222", "nivel": "user"},
    "toni": {"senha": "333", "nivel": "user"}
}

if "autenticado" not in st.session_state:
    st.session_state.autenticado = False
    st.session_state.user = None
    st.session_state.nivel = None

# (Lógica de Login simplificada para poupar espaço, igual ao código anterior)
if not st.session_state.autenticado:
    st.title("🔐 Login")
    u = st.text_input("Utilizador").lower().strip()
    p = st.text_input("Palavra-passe", type="password")
    if st.button("Entrar"):
        if u in utilizadores and utilizadores[u]["senha"] == p:
            st.session_state.autenticado = True
            st.session_state.user = u
            st.session_state.nivel = utilizadores[u]["nivel"]
            st.rerun()
    st.stop()

# --- CONEXÃO AO SHEETS ---
conn = st.connection("gsheets", type=GSheetsConnection)
df_produtos = conn.read(worksheet="produtos") # Aba com: Nome, Foto_URL, Vida_Util

# --- ÁREA ADMIN (CRIAÇÃO E DASHBOARD) ---
if st.session_state.nivel == "admin":
    st.title("🛠️ Painel Admin - Gestão de Produtos")
    
    menu = st.sidebar.radio("Navegação", ["Dashboard", "Registar Novo Produto"])
    
    if menu == "Registar Novo Produto":
        with st.form("novo_produto"):
            nome = st.text_input("Nome do Produto")
            foto = st.text_input("URL da Fotografia (Link)")
            vida = st.number_input("Tempo de Vida (Dias)", min_value=1)
            desc = st.text_area("Descrição")
            if st.form_submit_button("Gravar Produto"):
                st.success(f"Produto {nome} configurado!")
                # Aqui adicionarias a lógica de append para o Sheets
    
    else:
        st.subheader("📊 Dashboard de Validades")
        # Exemplo de métrica rápida
        st.metric("Total de Produtos", len(df_produtos))
        st.dataframe(df_produtos, use_container_width=True)

# --- ÁREA USER (REGISTO DE VALIDADE) ---
else:
    st.title("📦 Registo de Validades")
    st.write("Selecione o produto pela imagem:")

    # Mostrar produtos em grelha para seleção visual
    cols = st.columns(3)
    for index, row in df_produtos.iterrows():
        with cols[index % 3]:
            st.image(row['Foto_URL'], use_column_width=True)
            if st.button(f"Selecionar {row['Nome']}", key=row['Nome']):
                st.session_state.selected_prod = row['Nome']

    if "selected_prod" in st.session_state:
        st.divider()
        st.subheader(f"Registo para: {st.session_state.selected_prod}")
        
        with st.form("registo_validade"):
            data_v = st.date_input("Data de Validade")
            sem_hora = st.checkbox("Registo sem hora")
            
            if not sem_hora:
                hora_v = st.time_input("Hora de Validade")
            
            if st.form_submit_button("Confirmar Registo"):
                hora_str = "N/A" if sem_hora else hora_v.strftime("%H:%M")
                st.success(f"Registado: {st.session_state.selected_prod} | Validade: {data_v} às {hora_str}")

st.sidebar.button("Sair", on_click=lambda: st.session_state.update({"autenticado": False}))

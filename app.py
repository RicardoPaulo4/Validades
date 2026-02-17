import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd
from datetime import datetime

# 1. CONFIGURAÇÃO DA PÁGINA
st.set_page_config(page_title="Registo de Validades", layout="wide")

# 2. UTILIZADORES (ADMIN: Ricardo | USERS: Miguel, Brites, Toni)
utilizadores = {
    "ricardo": {"senha": "123", "nivel": "admin"},
    "miguel": {"senha": "111", "nivel": "user"},
    "brites": {"senha": "222", "nivel": "user"},
    "toni": {"senha": "333", "nivel": "user"}
}

if "autenticado" not in st.session_state:
    st.session_state.autenticado = False

# --- LÓGICA DE LOGIN ---
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

# --- CONEXÃO AO GOOGLE SHEETS ---
conn = st.connection("gsheets", type=GSheetsConnection)

# --- ÁREA ADMIN (DASHBOARD) ---
if st.session_state.nivel == "admin":
    st.title("🛠️ Painel Admin - Ricardo")
    st.subheader("Registos Efetuados")
    try:
        df_registos = conn.read(worksheet="registos", ttl=0)
        st.dataframe(df_registos, use_container_width=True)
    except:
        st.warning("A aba 'registos' ainda está vazia ou não foi criada.")

# --- ÁREA USER (SELEÇÃO POR IMAGEM) ---
else:
    st.title("📦 Selecione o Produto")
    
    try:
        # Lê a lista de produtos que criaste no Sheets
        df_produtos = conn.read(worksheet="produtos", ttl=0)
        
        # Cria colunas para mostrar as imagens lado a lado
        cols = st.columns(3) 
        
        for index, row in df_produtos.iterrows():
            with cols[index % 3]:
                # EXIBE A IMAGEM REAL (não o link)
                st.image(row['Foto_URL'], use_container_width=True)
                
                # BOTÃO DE SELEÇÃO POR BAIXO DA IMAGEM
                if st.button(f"Registar {row['Nome']}", key=f"btn_{index}"):
                    st.session_state.produto_escolhido = row['Nome']
        
        # FORMULÁRIO QUE APARECE APÓS CLICAR NA IMAGEM
        if "produto_escolhido" in st.session_state:
            st.divider()
            st.subheader(f"Registo para: {st.session_state.produto_escolhido}")
            
            with st.form("form_validade"):
                data_v = st.date_input("Data de Validade")
                sem_hora = st.checkbox("Registo sem hora")
                hora_v = st.time_input("Hora") if not sem_hora else "N/A"
                
                if st.form_submit_button("Confirmar Registo"):
                    # Aqui a app grava no Sheets (Aba registos)
                    novo_reg = pd.DataFrame([{
                        "Produto": st.session_state.produto_escolhido,
                        "Data_Validade": str(data_v),
                        "Hora": str(hora_v),
                        "Utilizador": st.session_state.user,
                        "Data_Registo": datetime.now().strftime("%d/%m/%Y %H:%M")
                    }])
                    conn.create(worksheet="registos", data=novo_reg)
                    st.success(f"✅ Feito! {st.session_state.produto_escolhido} guardado.")
                    del st.session_state.produto_escolhido # Limpa seleção para o próximo

    except Exception as e:
        st.error("Erro: Garante que a aba 'produtos' existe e tem as colunas 'Nome' e 'Foto_URL'.")

# SAIR
if st.sidebar.button("Sair"):
    st.session_state.autenticado = False
    st.rerun()

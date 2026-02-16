import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd
import re
from datetime import datetime

# --- CONFIGURAÇÃO E CONEXÃO ---
st.set_page_config(page_title="Gestão de Validades", layout="wide")
conn = st.connection("gsheets", type=GSheetsConnection)

# --- FUNÇÕES (Devem estar no topo) ---
def get_data(sheet):
    """Lê os dados do Google Sheets."""
    return conn.read(worksheet=sheet, ttl=0)

def save_data(df, sheet):
    """Guarda os dados no Google Sheets."""
    conn.update(worksheet=sheet, data=df)

def email_valido(email):
    """Valida o formato do email."""
    regex = r'^[a-z0-9]+[\._]?[a-z0-9]+[@]\w+[.]\w{2,3}$'
    return re.search(regex, email)

# --- INÍCIO DA LÓGICA DO PROGRAMA ---
if 'auth' not in st.session_state:
    st.title("🔐 Acesso à Equipa")
    tab_login, tab_registo = st.tabs(["Entrar", "Criar Conta"])

    with tab_login:
        email_in = st.text_input("Email")
        pass_in = st.text_input("Password", type="password")
        if st.button("Login"):
            # Login mestre para o teu acesso inicial
            if email_in == "admin@admin.com" and pass_in == "admin123":
                st.session_state.auth = "admin"
                st.rerun()
            else:
                df_u = get_data("utilizadores")
                user_match = df_u[(df_u['email'] == email_in) & (df_u['password'] == pass_in)]
                if not user_match.empty:
                    if user_match.iloc[0]['status'] == 'Ativo':
                        st.session_state.auth = "user"
                        st.session_state.username = user_match.iloc[0]['nome']
                        st.rerun()
                    else:
                        st.warning("Aguarde aprovação do Admin.")
                else:
                    st.error("Credenciais incorretas.")

    with tab_registo:
        st.subheader("Solicitar Novo Acesso")
        nome_r = st.text_input("Nome Completo")
        email_r = st.text_input("Teu Email")
        pass_r = st.text_input("Escolhe uma Password", type="password")
        if st.button("Enviar Pedido"):
            if email_valido(email_r):
                df_u = get_data("utilizadores")
                novo_u = pd.DataFrame([{"nome": nome_r, "email": email_r, "password": pass_r, "status": "Pendente"}])
                save_data(pd.concat([df_u, novo_u], ignore_index=True), "utilizadores")
                st.success("Pedido enviado para o Admin!")
            else:
                st.error("Email inválido.")
    st.stop()

# --- INTERFACE ADMIN ---
if st.session_state.auth == "admin":
    st.sidebar.title("Administrador")
    menu = st.sidebar.radio("Ir para:", ["Aprovações", "Produtos", "Dashboard"])

    if menu == "Aprovações":
        st.header("👥 Aprovar Novos Utilizadores")
        df_u = get_data("utilizadores")
        pendentes = df_u[df_u['status'] == 'Pendente']
        if not pendentes.empty:
            st.dataframe(pendentes)
            u_ativar = st.selectbox("Ativar email:", pendentes['email'])
            if st.button("Ativar"):
                df_u.loc[df_u['email'] == u_ativar, 'status'] = 'Ativo'
                save_data(df_u, "utilizadores")
                st.success("Ativado!")
                st.rerun()
        else:
            st.info("Nada pendente.")

    elif menu == "Produtos":
        st.header("📦 Adicionar ao Catálogo")
        with st.form("add_p"):
            nome = st.text_input("Nome")
            foto = st.text_input("URL da Foto")
            if st.form_submit_button("Gravar"):
                df_p = get_data("produtos")
                save_data(pd.concat([df_p, pd.DataFrame([{"nome": nome, "foto": foto}])], ignore_index=True), "produtos")
                st.success("Gravado!")

    elif menu == "Dashboard":
        st.header("📊 Registos Efetuados")
        st.dataframe(get_data("registos"))

# --- INTERFACE UTILIZADOR ---
else:
    st.header(f"📦 Bem-vindo, {st.session_state.username}")
    df_p = get_data("produtos")
    if not df_p.empty:
        col1, col2, col3 = st.columns(3)
        for i, row in df_p.iterrows():
            with [col1, col2, col3][i % 3]:
                st.image(row['foto'] if row['foto'] else "https://via.placeholder.com/150")
                if st.button(f"Registar {row['nome']}", key=f"btn_{i}"):
                    st.session_state.p_sel = row['nome']
        
        if 'p_sel' in st.session_state:
            with st.form("reg_val"):
                st.write(f"Validade para: {st.session_state.p_sel}")
                d = st.date_input("Data")
                if st.form_submit_button("Confirmar"):
                    df_r = get_data("registos")
                    novo_r = pd.DataFrame([{"produto": st.session_state.p_sel, "data": str(d), "data_reg": datetime.now()}])
                    save_data(pd.concat([df_r, novo_r], ignore_index=True), "registos")
                    st.success("Registo concluído!")
    else:
        st.warning("Sem produtos cadastrados.")

if st.sidebar.button("Sair"):
    st.session_state.clear()
    st.rerun()

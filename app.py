import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd
import re # Para validar o formato do email

# --- FUNÇÃO PARA VALIDAR EMAIL ---
def email_valido(email):
    regex = r'^[a-z0-9]+[\._]?[a-z0-9]+[@]\w+[.]\w{2,3}$'
    return re.search(regex, email)

# ... (conexão e funções de dados mantêm-se)

if 'auth' not in st.session_state:
    st.title("🔐 Acesso Equipa")
    tab_login, tab_registo = st.tabs(["Entrar", "Criar Conta"])

    with tab_login:
        email_input = st.text_input("Email")
        p_input = st.text_input("Password", type="password")
        if st.button("Entrar"):
            if email_input == "admin@admin.com" and p_input == "admin123":
                st.session_state.auth = "admin"
                st.rerun()
            else:
                df_u = get_data("utilizadores")
                # Procurar pelo email na base de dados
                user_match = df_u[(df_u['email'] == email_input) & (df_u['password'] == p_input)]
                
                if not user_match.empty:
                    if user_match.iloc[0]['status'] == 'Ativo':
                        st.session_state.auth = "user"
                        st.session_state.username = user_match.iloc[0]['nome']
                        st.rerun()
                    else:
                        st.warning("O teu acesso ainda não foi ativado pelo Administrador.")
                else:
                    st.error("Email ou password incorretos.")

    with tab_registo:
        st.subheader("Novo Registo")
        novo_nome = st.text_input("Nome Completo")
        novo_email = st.text_input("Email Profissional")
        nova_pass = st.text_input("Senha", type="password")
        
        if st.button("Solicitar Acesso"):
            if not email_valido(novo_email):
                st.error("Por favor, insere um email válido.")
            else:
                df_u = get_data("utilizadores")
                if novo_email in df_u['email'].values:
                    st.error("Este email já está registado.")
                else:
                    novo_u_df = pd.DataFrame([{
                        "nome": novo_nome, 
                        "email": novo_email, 
                        "password": nova_pass, 
                        "status": "Pendente"
                    }])
                    df_final = pd.concat([df_u, novo_u_df], ignore_index=True)
                    save_data(df_final, "utilizadores")
                    st.success("Pedido enviado! O Admin irá validar o seu email.")
    st.stop()

# --- CONFIGURAÇÃO DA PÁGINA ---
st.set_page_config(page_title="Gestão de Validades", layout="wide")

# --- CONEXÃO GOOGLE SHEETS ---
conn = st.connection("gsheets", type=GSheetsConnection)

def get_data(sheet_name):
    return conn.read(worksheet=sheet_name, ttl=0)

# --- ESTILIZAÇÃO ---
st.markdown("""
    <style>
    .stButton>button { width: 100%; border-radius: 5px; height: 3em; }
    .validade-ok { color: green; font-weight: bold; }
    .validade-aviso { color: orange; font-weight: bold; }
    .validade-critica { color: red; font-weight: bold; }
    </style>
    """, unsafe_allow_html=True)

# --- LÓGICA DE LOGIN ---
if 'auth' not in st.session_state:
    st.title("🔐 Acesso Equipa")
    user = st.text_input("Utilizador")
    passw = st.text_input("Password", type="password")
    if st.button("Entrar"):
        if user == "admin" and passw == "admin123":
            st.session_state.auth = "admin"
            st.rerun()
        elif user == "user" and passw == "user123":
            st.session_state.auth = "user"
            st.rerun()
        else:
            st.error("Credenciais Inválidas")
    st.stop()

# --- INTERFACE ADMIN ---
if st.session_state.auth == "admin":
    st.sidebar.title("Painel Admin")
    menu = st.sidebar.radio("Ir para:", ["Dashboard", "Cadastrar Produto"])

    if menu == "Cadastrar Produto":
        st.header("➕ Novo Produto")
        with st.form("form_cadastro"):
            nome = st.text_input("Nome do Produto")
            vida_util = st.number_input("Tempo de Vida (Dias)", min_value=1, value=30)
            foto_url = st.text_input("URL da Foto do Produto")
            desc = st.text_area("Descrição Adicional")
            
            if st.form_submit_button("Guardar Produto"):
                df_p = get_data("produtos")
                novo = pd.DataFrame([{"nome": nome, "vida_util": vida_util, "foto": foto_url, "descricao": desc}])
                df_final = pd.concat([df_p, novo], ignore_index=True)
                conn.update(worksheet="produtos", data=df_final)
                st.success("Produto adicionado ao catálogo!")

    elif menu == "Dashboard":
        st.header("📊 Gestão de Dados")
        df_r = get_data("registos")
        
        if not df_r.empty:
            # Lógica de alerta visual
            df_r['data'] = pd.to_datetime(df_r['data'])
            st.dataframe(df_r.style.highlight_max(axis=0, color='lightgrey'))
            
            # Botão para exportar
            st.download_button("Descarregar CSV", df_r.to_csv(index=False), "validades.csv")
        else:
            st.info("Ainda não há registos para mostrar.")

# --- INTERFACE USER ---
else:
    st.header("📦 Registo de Validade")
    df_p = get_data("produtos")
    
    if not df_p.empty:
        # Galeria de Fotos
        cols = st.columns(3)
        for i, row in df_p.iterrows():
            with cols[i % 3]:
                st.image(row['foto'] if row['foto'] else "https://via.placeholder.com/150", width=150)
                if st.button(f"Registar {row['nome']}", key=f"btn_{i}"):
                    st.session_state.sel_prod = row['nome']

        if 'sel_prod' in st.session_state:
            st.divider()
            st.subheader(f"Registar: {st.session_state.sel_prod}")
            d_val = st.date_input("Data de Validade")
            sem_hora = st.checkbox("Sem hora específica")
            h_val = "N/A" if sem_hora else st.time_input("Hora de Validade")
            
            if st.button("Confirmar Submissão"):
                df_r = get_data("registos")
                novo_r = pd.DataFrame([{
                    "produto": st.session_state.sel_prod,
                    "data": str(d_val),
                    "hora": str(h_val),
                    "data_registo": datetime.now().strftime("%d/%m/%Y %H:%M")
                }])
                df_f = pd.concat([df_r, novo_r], ignore_index=True)
                conn.update(worksheet="registos", data=df_f)
                st.success("Registo efetuado com sucesso!")
    else:
        st.warning("O Admin ainda não inseriu produtos no sistema.")

if st.sidebar.button("Sair"):
    del st.session_state.auth
    st.rerun()

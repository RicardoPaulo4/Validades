import streamlit as st
import pandas as pd
from datetime import date

# Configuração da página
st.set_page_config(page_title="Gestão de Validades", layout="centered")

st.title("📦 Controlo de Validades da Equipa")

# Criar um formulário para adicionar produtos
with st.form("novo_produto"):
    produto = st.text_input("Nome do Produto")
    validade = st.date_input("Data de Validade", min_value=date.today())
    submeter = st.form_submit_button("Registar Produto")

# Lógica simples para guardar os dados (apenas nesta sessão)
if "lista_produtos" not in st.session_state:
    st.session_state.lista_produtos = []

if submeter:
    st.session_state.lista_produtos.append({"Produto": produto, "Validade": validade})
    st.success(f"Produto '{produto}' registado com sucesso!")

# Mostrar a tabela de validades
if st.session_state.lista_produtos:
    df = pd.DataFrame(st.session_state.lista_produtos)
    st.subheader("Produtos em Stock")
    st.table(df)
else:
    st.info("Ainda não existem produtos registados.")

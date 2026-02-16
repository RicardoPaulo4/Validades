import streamlit as st
from streamlit_gsheets import GSheetsConnection
import pandas as pd
import re
from datetime import datetime

# 1. Primeiro definimos a CONEXÃO
conn = st.connection("gsheets", type=GSheetsConnection)

# 2. Depois definimos as FUNÇÕES (Essencial estarem aqui em cima!)
def get_data(sheet):
    """Lê os dados de uma aba específica do Google Sheets."""
    return conn.read(worksheet=sheet, ttl=0)

def save_data(df, sheet):
    """Guarda/Atualiza os dados numa aba específica."""
    conn.update(worksheet=sheet, data=df)

def email_valido(email):
    """Valida o formato do email usando Regex."""
    regex = r'^[a-z0-9]+[\._]?[a-z0-9]+[@]\w+[.]\w{2,3}$'
    return re.search(regex, email)

# 3. SÓ AGORA começa a lógica do programa (onde o get_data é chamado)
if 'auth' not in st.session_state:
    # ... resto do código (login, etc)

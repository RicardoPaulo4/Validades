# ... (início do código anterior) ...

        if submit:
            try:
                conn = st.connection("gsheets", type=GSheetsConnection)
                
                # Teste de leitura da aba específica
                df_users = conn.read(worksheet="Utilizadores", ttl=0) 
                
                # Validação
                user_match = df_users[
                    (df_users['utilizador'].astype(str) == str(u)) & 
                    (df_users['senha'].astype(str) == str(p))
                ]
                
                if not user_match.empty:
                    st.session_state.auth_status = True
                    st.session_state.user_role = user_match.iloc[0]['nivel']
                    st.session_state.user_login = u
                    st.rerun()
                else:
                    st.error("❌ Credenciais incorretas.")
            except Exception as e:
                st.error(f"Erro de Conexão: Verifique se a aba 'Utilizadores' existe no Google Sheets e se o ficheiro está partilhado publicamente.")
                st.debug(e) # Mostra o erro técnico se necessário

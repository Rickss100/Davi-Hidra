# Regra 06: Versionamento Git e Pull Requests

Para manter o histórico do repositório limpo, auditável e seguro para revisões em equipe, adote o seguinte fluxo de Git:

1. **Proibido Commits na Main:** Nunca faça commits diretamente nas branches main ou master.
2. **Criação de Branches:** Toda nova funcionalidade, correção ou refatoração deve ser feita em uma branch isolada. Use padrões semânticos como:
   - eat/nome-da-feature`n   - ix/nome-do-bug`n   - efactor/nome-do-modulo`n3. **Commits Atômicos:** Faça commits com mensagens claras, em português, descrevendo exatamente o que foi alterado.
4. **Pull Requests (PR):** Ao finalizar o trabalho da branch, faça o push para o repositório remoto (ex: GitHub, Bitbucket) e gere ou sugira a criação de um Pull Request (PR) para possibilitar o Code Review antes da integração oficial.
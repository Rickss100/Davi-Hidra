# Regra 05: Testes Automatizados e Prevenção de Regressão

Para evitar a inserção de 'bugs bestas' e regressões silenciosas no código, siga rigorosamente as diretrizes de testes:

1. **Obrigatoriedade de .spec:** Sempre que criar ou atualizar um módulo, componente, rota ou serviço, crie ou atualize o respectivo arquivo de teste automatizado (ex: NomeDoComponente.spec.jsx ou servico.spec.js).
2. **Foco Anti-Regressão:** Os testes devem garantir que o comportamento anterior não foi quebrado pelas novas implementações.
3. **Fechamento de Módulo:** Nunca considere um módulo 'finalizado' ou 'fechado' sem antes validar que a suíte de testes .spec cobre as regras de negócio cruciais.
4. **Ferramental:** Utilize o framework de testes configurado no projeto para escrever testes descritivos e assertivos.
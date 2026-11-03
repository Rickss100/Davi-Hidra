import React from 'react';
import Link from 'next/link';
import { 
  ShieldAlert, 
  Scale, 
  ShieldCheck, 
  Lock, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft,
  MessageCircle,
  Sparkles
} from 'lucide-react';
import { Card, Badge, Button } from '@/components/ui/primitives';
import { BrandLogo } from '@/components/ui/brand-logo';

export const metadata = {
  title: 'Termos de Uso, Adesão & Aviso Regulatório CVM | Norte Invest',
  description: 'Contrato de Licença de Software (SaaS), Termos de Adesão, Isenção Regulatória CVM, Política de Privacidade LGPD e Defesa do Consumidor da Norte Invest.'
};

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-obsidian-800 via-obsidian-950 to-obsidian-950 text-slate-200 py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        
        {/* Topo Institucional */}
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <BrandLogo size="lg" centered />
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-3.5 py-1 text-xs font-bold text-gold-300">
            <Scale className="h-3.5 w-3.5 text-gold-400" />
            GOVERNANÇA JURÍDICA &amp; COMPLIANCE REGULATÓRIO
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Termos de Uso, Adesão &amp; Isenção CVM
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            Transparência radical, proteção aos seus dados pessoais e clareza sobre a natureza educacional e instrumental da nossa tecnologia.
          </p>
        </div>

        {/* ALERTA CVM CRUCIAL (Em Destaque Dourado/Âmbar) */}
        <div className="rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-[#151d2f] to-obsidian-950 p-5 sm:p-7 shadow-xl">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Aviso Regulatório Obrigatório &bull; Isenção CVM
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                A plataforma <strong>Norte Invest (Método DAVI &amp; Mecanismo Hydra)</strong> é exclusivamente uma <strong>ferramenta tecnológica de simulação matemática, organização de carteira e educação financeira</strong>.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Não Somos Analistas nem Consultores:</strong> Não emitimos recomendações individualizadas de compra ou venda de valores mobiliários (Resoluções CVM nº 19/2021 e 20/2021).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Não Substitui Especialista Certificado:</strong> O uso do sistema e as 30 aulas pedagógicas não substituem o aconselhamento de um profissional habilitado (CFP, CNPI, CEA, AAI).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                  <span><strong>Soberania Decisória Exclusiva do Investidor:</strong> Toda decisão de alocação, compra ou venda de ativos é de sua inteira e soberana responsabilidade. Rentabilidade passada não é garantia de rentabilidade futura.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* TRÍPLICE COMPLIANCE (Cards Resumo) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-slate-800 bg-[#0d162a]/90 p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Scale className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">CDC &bull; Sem Cobrança Oculta</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              30 dias de teste sem exigir cartão de crédito. Sem renovação automática silenciosa. Direito de arrependimento integral de 7 dias (Art. 49).
            </p>
          </Card>

          <Card className="border-slate-800 bg-[#0d162a]/90 p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Lock className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">LGPD &bull; Sigilo Patrimonial</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Seus dados de investimentos nunca são vendidos a corretoras ou terceiros. Arquitetura Zero-Trust com cookies HttpOnly e criptografia AES-256.
            </p>
          </Card>

          <Card className="border-slate-800 bg-[#0d162a]/90 p-5 space-y-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500/10 text-gold-400 border border-gold-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Propriedade Intelectual</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              O Método DAVI, a Carteira Hydra e o Algoritmo AM2O são marcas e softwares protegidos pelas Leis 9.609/1998 e 9.279/1996.
            </p>
          </Card>
        </div>

        {/* CORPO DO CONTRATO NA ÍNTEGRA */}
        <Card className="border-slate-800 bg-[#0b1325]/95 p-6 sm:p-9 space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          
          <div className="border-b border-slate-800 pb-5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gold-400">Contrato de Adesão v2.0</span>
            <h2 className="text-xl font-bold text-white mt-1">Cláusulas Gerais de Licenciamento de Software (SaaS)</h2>
            <p className="text-xs text-slate-400 mt-1">
              Ao criar sua conta ou utilizar a Plataforma Norte Invest, você declara ciência e concordância integral com as condições abaixo:
            </p>
          </div>

          {/* Cláusula 1 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-gold-400">1.</span> Objeto da Licença
            </h3>
            <p>
              A Norte Invest concede ao Usuário uma licença de uso temporária, revogável, não exclusiva e intransferível para utilização de sua plataforma web de simulação matemática patrimonial, consolidação de investimentos e acesso aos módulos instrucionais da Academia Norte Invest. O software não realiza operações automáticas em nome do Usuário nem detém custódia de recursos financeiros.
            </p>
          </section>

          {/* Cláusula 2 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-gold-400">2.</span> Delimitação de Função &bull; Instrumento de Apoio Didático
            </h3>
            <p>
              O <strong>Algoritmo AM2O (Alocação com Maximização da Menor Oscilação)</strong> é um algoritmo de rebalanceamento financeiro passivo que processa estritamente as metas percentuais e os ativos informados livremente pelo próprio Usuário. O <strong>Radar de Ativos</strong> compila indicadores fundamentalistas de domínio público para facilitar a análise do investidor. Nenhuma exibição gráfica ou sugestão algorítmica constitui recomendação vinculante de investimento.
            </p>
          </section>

          {/* Cláusula 3 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-gold-400">3.</span> Degustação (Trial de 30 Dias) e Planos Comerciais
            </h3>
            <p>
              Novos usuários recebem 30 (trinta) dias de degustação gratuita sem a necessidade de informar dados de cartão de crédito antecipadamente. Ao término do período, caso não haja interesse na contratação de um dos planos comerciais (Trimestral, Semestral ou Anual), a conta será pausada sem qualquer cobrança surpresa, penalidade ou inscrição em cadastros de inadimplentes.
            </p>
          </section>

          {/* Cláusula 4 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-gold-400">4.</span> Política de Não Renovação Automática Furtiva &amp; Arrependimento
            </h3>
            <p>
              A Norte Invest não realiza cobranças recorrentes automáticas silenciosas em cartões de crédito. Toda renovação é precedida de contato transparente e acordada com o investidor. Adicionalmente, em estrito cumprimento ao <strong>Artigo 49 do Código de Defesa do Consumidor</strong>, o Usuário possui o prazo incondicional de <strong>7 (sete) dias corridos</strong> a partir da contratação de plano pago para requerer o cancelamento com reembolso de 100% dos valores pagos diretamente com nossa equipe de suporte.
            </p>
          </section>

          {/* Cláusula 5 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-gold-400">5.</span> Privacidade e Segurança de Dados (LGPD)
            </h3>
            <p>
              Em conformidade com a Lei Federal nº 13.709/2018 (LGPD), a Norte Invest coleta apenas os dados estritamente necessários para a prestação dos serviços (nome e e-mail). É terminantemente vedada a comercialização, cessão ou repasse de informações patrimoniais a corretoras de valores, financeiras ou parceiros comerciais. O Usuário pode solicitar a exclusão de sua conta a qualquer momento.
            </p>
          </section>

          {/* Cláusula 6 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-gold-400">6.</span> Limitação de Responsabilidade Tecnológica
            </h3>
            <p>
              As cotações e proventos são obtidos de fontes públicas e podem sofrer atrasos regulatórios de mercado (delay legal). A conferência de dados cabe ao investidor perante suas notas de corretagem oficiais e extratos da B3. A Norte Invest não se responsabiliza por indisponibilidades temporárias de serviços de telecomunicação ou provedores de nuvem de grande porte.
            </p>
          </section>

          {/* Cláusula 7 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span className="text-gold-400">7.</span> Propriedade Intelectual e Foro
            </h3>
            <p>
              É proibida a engenharia reversa do código-fonte ou a redistribuição comercial dos materiais educativos sem autorização escrita. Fica eleito o Foro da Comarca de Vitória/ES para dirimir quaisquer controvérsias decorrentes deste contrato, sem prejuízo das normas cogentes protetivas ao consumidor.
            </p>
          </section>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <Link 
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-obsidian-950 px-4 py-2 text-xs font-semibold text-slate-300 hover:border-gold-500/40 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Login
            </Link>

            <a
              href="https://api.whatsapp.com/send?phone=5527995263026&text=Ol%C3%A1%2C%20gostaria%20de%20esclarecer%20d%C3%BAvidas%20jur%C3%ADdicas%20ou%20contratuais%20sobre%20a%20Norte%20Invest."
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 px-4 py-2 text-xs font-bold text-emerald-400 hover:bg-emerald-500/25 transition-colors"
            >
              <MessageCircle className="h-4 w-4" />
              Falar com o Compliance / Suporte
            </a>
          </div>

        </Card>

      </div>
    </div>
  );
}

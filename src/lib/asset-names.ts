export interface SeedAssetEntry {
  code: string;
  name: string;
  category: 'acoes' | 'fiis' | 'stocks' | 'reits' | 'fixed';
  market: 'BR' | 'US';
  sector: string;
}

/**
 * Dicionário institucional de nomes completos de companhias, FIIs, Stocks, REITs e Títulos Públicos/Privados.
 * Enriquece os códigos vindos de planilhas fundamentalistas (onde muitas vezes name === ticker).
 */
export const OFFICIAL_ASSET_NAMES: Record<string, { name: string; sector?: string }> = {
  // === AÇÕES BRASIL (B3) ===
  ABEV3: { name: 'Ambev S.A.', sector: 'Bebidas & Consumo' },
  ALOS3: { name: 'Allos Shopping Centers', sector: 'Shoppings & Imóveis' },
  ALPA4: { name: 'Alpargatas PN', sector: 'Calçados & Vestuário' },
  ALUP11: { name: 'Alupar Investimento Unit', sector: 'Energia Elétrica' },
  ARML3: { name: 'Armac Locação', sector: 'Máquinas & Logística' },
  ASAI3: { name: 'Assaí Atacadista', sector: 'Varejo Alimentar' },
  AURE3: { name: 'Auren Energia', sector: 'Energia Elétrica' },
  AZUL4: { name: 'Azul Linhas Aéreas PN', sector: 'Aviação' },
  B3SA3: { name: 'B3 — Brasil, Bolsa, Balcão', sector: 'Serviços Financeiros' },
  BBAS3: { name: 'Banco do Brasil ON', sector: 'Bancos' },
  BBDC3: { name: 'Banco Bradesco ON', sector: 'Bancos' },
  BBDC4: { name: 'Banco Bradesco PN', sector: 'Bancos' },
  BBSE3: { name: 'BB Seguridade Participações', sector: 'Seguros' },
  BEEF3: { name: 'Minerva Foods', sector: 'Alimentos & Proteínas' },
  BPAC11: { name: 'BTG Pactual Unit', sector: 'Bancos de Investimento' },
  BRAP4: { name: 'Bradespar PN', sector: 'Mineração & Holdings' },
  BRFS3: { name: 'BRF S.A.', sector: 'Alimentos & Proteínas' },
  BRKM5: { name: 'Braskem PNA', sector: 'Petroquímica' },
  BRSR6: { name: 'Banrisul PNB', sector: 'Bancos' },
  CCRO3: { name: 'CCR Rodovias (Motiva)', sector: 'Infraestrutura & Concessões' },
  CEAB3: { name: 'C&A Modas', sector: 'Varejo' },
  CMIG3: { name: 'Cemig ON', sector: 'Energia Elétrica' },
  CMIG4: { name: 'Cemig PN', sector: 'Energia Elétrica' },
  CMIN3: { name: 'CSN Mineração', sector: 'Mineração' },
  COGN3: { name: 'Cogna Educação', sector: 'Educação' },
  CPFE3: { name: 'CPFL Energia', sector: 'Energia Elétrica' },
  CPLE3: { name: 'Copel Energia ON', sector: 'Energia Elétrica' },
  CPLE6: { name: 'Copel Energia PNB', sector: 'Energia Elétrica' },
  CRFB3: { name: 'Carrefour Brasil', sector: 'Varejo Alimentar' },
  CSAN3: { name: 'Cosan S.A.', sector: 'Energia & Infraestrutura' },
  CSMG3: { name: 'Copasa Saneamento', sector: 'Saneamento' },
  CSNA3: { name: 'CSN — Companhia Siderúrgica Nacional', sector: 'Siderurgia' },
  CURY3: { name: 'Cury Construtora', sector: 'Construção Civil' },
  CVCB3: { name: 'CVC Brasil Turismo', sector: 'Turismo' },
  CXSE3: { name: 'Caixa Seguridade', sector: 'Seguros' },
  CYRE3: { name: 'Cyrela Brazil Realty', sector: 'Construção Civil' },
  DIRR3: { name: 'Direcional Engenharia', sector: 'Construção Civil' },
  DXCO3: { name: 'Dexco S.A.', sector: 'Materiais de Construção' },
  ECOR3: { name: 'EcoRodovias Infraestrutura', sector: 'Concessões Rodoviárias' },
  EGIE3: { name: 'Engie Brasil Energia', sector: 'Energia Elétrica' },
  ELET3: { name: 'Eletrobras ON', sector: 'Energia Elétrica' },
  ELET6: { name: 'Eletrobras PNB', sector: 'Energia Elétrica' },
  EMBR3: { name: 'Embraer S.A.', sector: 'Aeroespacial & Defesa' },
  ENEV3: { name: 'Eneva Energia', sector: 'Energia & Gás' },
  ENGI11: { name: 'Energisa Unit', sector: 'Energia Elétrica' },
  EQTL3: { name: 'Equatorial Energia', sector: 'Energia Elétrica' },
  EZTC3: { name: 'EZTEC Empreendimentos', sector: 'Construção Civil' },
  FLRY3: { name: 'Fleury Medicina e Saúde', sector: 'Saúde & Diagnósticos' },
  GGBR3: { name: 'Gerdau S.A. ON', sector: 'Siderurgia' },
  GGBR4: { name: 'Gerdau S.A. PN', sector: 'Siderurgia' },
  GMAT3: { name: 'Grupo Mateus', sector: 'Varejo Alimentar' },
  GOAU4: { name: 'Metalúrgica Gerdau PN', sector: 'Siderurgia' },
  HAPV3: { name: 'Hapvida Participações', sector: 'Saúde' },
  HYPE3: { name: 'Hypera Pharma', sector: 'Farmacêutico' },
  IGTI11: { name: 'Iguatemi S.A. Unit', sector: 'Shoppings' },
  INTB3: { name: 'Intelbras S.A.', sector: 'Tecnologia & Segurança' },
  IRBR3: { name: 'IRB(Re) Brasil Resseguros', sector: 'Resseguros' },
  ISAE4: { name: 'ISA Energia Brasil PN (ex-TRPL4)', sector: 'Transmissão Elétrica' },
  ITSA3: { name: 'Itaúsa S.A. ON', sector: 'Holdings Financeiras' },
  ITSA4: { name: 'Itaúsa S.A. PN', sector: 'Holdings Financeiras' },
  ITUB3: { name: 'Itaú Unibanco ON', sector: 'Bancos' },
  ITUB4: { name: 'Itaú Unibanco PN', sector: 'Bancos' },
  JBSS3: { name: 'JBS S.A.', sector: 'Alimentos & Proteínas' },
  KLBN3: { name: 'Klabin S.A. ON', sector: 'Papel & Celulose' },
  KLBN4: { name: 'Klabin S.A. PN', sector: 'Papel & Celulose' },
  KLBN11: { name: 'Klabin S.A. Unit', sector: 'Papel & Celulose' },
  LEVE3: { name: 'Mahle Metal Leve', sector: 'Autopeças & Indústria' },
  LREN3: { name: 'Lojas Renner S.A.', sector: 'Varejo' },
  LWSA3: { name: 'LWSA (Locaweb)', sector: 'Tecnologia' },
  MDIA3: { name: 'M. Dias Branco', sector: 'Alimentos' },
  MGLU3: { name: 'Magazine Luiza', sector: 'Varejo & E-commerce' },
  MOTV3: { name: 'Motiva Infraestrutura (ex-CCR)', sector: 'Infraestrutura' },
  MRFG3: { name: 'Marfrig Global Foods', sector: 'Alimentos & Proteínas' },
  MRVE3: { name: 'MRV Engenharia', sector: 'Construção Civil' },
  MULT3: { name: 'Multiplan Shopping Centers', sector: 'Shoppings' },
  MWET3: { name: 'Wetzel S.A. ON', sector: 'Bens Industriais' },
  MWET4: { name: 'Wetzel S.A. PN', sector: 'Bens Industriais' },
  NEOE3: { name: 'Neoenergia S.A.', sector: 'Energia Elétrica' },
  NTCO3: { name: 'Natura &Co Holding', sector: 'Cosméticos & Consumo' },
  ODPV3: { name: 'OdontoPrev S.A.', sector: 'Saúde Odontológica' },
  PCAR3: { name: 'GPA — Pão de Açúcar', sector: 'Varejo Alimentar' },
  PETR3: { name: 'Petrobras ON', sector: 'Petróleo & Gás' },
  PETR4: { name: 'Petrobras PN', sector: 'Petróleo & Gás' },
  PETZ3: { name: 'Petz S.A.', sector: 'Varejo Pet' },
  POMO4: { name: 'Marcopolo PN', sector: 'Bens Industriais' },
  PRIO3: { name: 'PRIO S.A. (PetroRio)', sector: 'Petróleo & Gás' },
  PSSA3: { name: 'Porto Seguro S.A.', sector: 'Seguros' },
  RADL3: { name: 'Raia Drogasil (RD Saúde)', sector: 'Farmácias & Saúde' },
  RAIL3: { name: 'Rumo Logística S.A.', sector: 'Ferrovias & Logística' },
  RAIZ4: { name: 'Raízen PN', sector: 'Energia & Biocombustíveis' },
  RANI3: { name: 'Irani Papel e Embalagem', sector: 'Papel & Celulose' },
  RDOR3: { name: 'Rede D’Or São Luiz', sector: 'Hospitais & Saúde' },
  RECV3: { name: 'PetroRecôncavo S.A.', sector: 'Petróleo & Gás' },
  RENT3: { name: 'Localiza&Co', sector: 'Locação de Veículos' },
  SANB11: { name: 'Banco Santander Brasil Unit', sector: 'Bancos' },
  SAPR4: { name: 'Sanepar PN', sector: 'Saneamento' },
  SAPR11: { name: 'Sanepar Unit', sector: 'Saneamento' },
  SBSP3: { name: 'Sabesp Saneamento', sector: 'Saneamento' },
  SLCE3: { name: 'SLC Agrícola', sector: 'Agronegócio' },
  SMTO3: { name: 'São Martinho S.A.', sector: 'Agronegócio & Açúcar/Etanol' },
  STBP3: { name: 'Santos Brasil Participações', sector: 'Portos & Logística' },
  SUZB3: { name: 'Suzano S.A.', sector: 'Papel & Celulose' },
  TAEE3: { name: 'Taesa ON', sector: 'Transmissão Elétrica' },
  TAEE4: { name: 'Taesa PN', sector: 'Transmissão Elétrica' },
  TAEE11: { name: 'Taesa Unit', sector: 'Transmissão Elétrica' },
  TGMA3: { name: 'Tegma Gestão Logística', sector: 'Logística' },
  TIMS3: { name: 'TIM Brasil S.A.', sector: 'Telecomunicações' },
  TOTS3: { name: 'TOTVS S.A.', sector: 'Software & Tecnologia' },
  TRPL4: { name: 'ISA CTEEP Transmissão Paulista PN', sector: 'Transmissão Elétrica' },
  TUPY3: { name: 'Tupy S.A.', sector: 'Bens Industriais' },
  UGPA3: { name: 'Ultrapar Participações', sector: 'Energia & Distribuição' },
  UNIP6: { name: 'Unipar Carbocloro PNB', sector: 'Química' },
  USIM5: { name: 'Usiminas PNA', sector: 'Siderurgia' },
  VALE3: { name: 'Vale S.A.', sector: 'Mineração' },
  VAMO3: { name: 'Vamos Locação', sector: 'Logística & Frotas' },
  VBBR3: { name: 'Vibra Energia', sector: 'Combustíveis & Energia' },
  VIVA3: { name: 'Vivara Participações', sector: 'Varejo Alto Padrão' },
  VIVT3: { name: 'Telefônica Brasil (Vivo)', sector: 'Telecomunicações' },
  VULC3: { name: 'Vulcabras S.A.', sector: 'Calçados Esportivos' },
  WEGE3: { name: 'WEG S.A.', sector: 'Bens Industriais & Motores' },
  WEST3: { name: 'Westwing Comércio Varejista', sector: 'E-commerce & Casa' },
  WIZC3: { name: 'Wiz Co Participações', sector: 'Seguros & Corretagem' },
  YDUQ3: { name: 'Yduqs Participações', sector: 'Educação' },

  // === FUNDOS IMOBILIÁRIOS (FIIs B3) ===
  ALZR11: { name: 'Alianza Trust Renda Imobiliária FII', sector: 'Renda Urbana / Híbrido' },
  BCFF11: { name: 'BTG Pactual Fundo de Fundos FII', sector: 'Fundo de Fundos (FOF)' },
  BRCO11: { name: 'Bresco Logística FII', sector: 'Galpões Logísticos' },
  BTLG11: { name: 'BTG Pactual Logística FII', sector: 'Galpões Logísticos' },
  CPTS11: { name: 'Capitânia Securities II FII', sector: 'Papel / Recebíveis CRI' },
  CVBI11: { name: 'VBI CRI Recebíveis Imobiliários FII', sector: 'Papel / Recebíveis CRI' },
  DEVA11: { name: 'Devant Recebíveis Imobiliários FII', sector: 'Papel / Recebíveis CRI' },
  GARE11: { name: 'Guardian Real Estate FII', sector: 'Logística & Renda Urbana' },
  GGRC11: { name: 'GGR Covepi Renda FII', sector: 'Galpões Industriais & Logísticos' },
  HCTR11: { name: 'Hectare CE FII', sector: 'Papel High Yield' },
  HFOF11: { name: 'Hedge Top FOFII 3 FII', sector: 'Fundo de Fundos (FOF)' },
  HGBS11: { name: 'Hedge Brasil Shopping FII', sector: 'Shoppings' },
  HGCR11: { name: 'CSHG Recebíveis Imobiliários FII', sector: 'Papel / Recebíveis CRI' },
  HGLG11: { name: 'CSHG Logística (Pátria Log) FII', sector: 'Galpões Logísticos' },
  HGPO11: { name: 'CSHG Prime Offices FII', sector: 'Lajes Corporativas' },
  HGRE11: { name: 'CSHG Real Estate FII', sector: 'Lajes Corporativas' },
  HGRU11: { name: 'CSHG Renda Urbana FII', sector: 'Renda Urbana & Varejo' },
  HSML11: { name: 'HSI Malls Shopping FII', sector: 'Shoppings' },
  IRDM11: { name: 'Iridium Recebíveis Imobiliários FII', sector: 'Papel / Recebíveis CRI' },
  JSRE11: { name: 'JS Real Estate Multigestão FII', sector: 'Lajes Corporativas' },
  KNCA11: { name: 'Kinea Crédito Agro FIAGRO', sector: 'Fiagro / Crédito' },
  KNCR11: { name: 'Kinea Rendimentos Imobiliários FII', sector: 'Papel Pós-Fixado CDI' },
  KNHY11: { name: 'Kinea High Yield CRI FII', sector: 'Papel / Recebíveis CRI' },
  KNIP11: { name: 'Kinea Índices de Preços FII', sector: 'Papel IPCA+ High Grade' },
  KNRI11: { name: 'Kinea Renda Imobiliária FII', sector: 'Híbrido (Logística & Lajes)' },
  KNSC11: { name: 'Kinea Securities FII', sector: 'Papel / Recebíveis CRI' },
  LVBI11: { name: 'VBI Logístico FII', sector: 'Galpões Logísticos' },
  MCCI11: { name: 'Mauá Capital Recebíveis FII', sector: 'Papel / Recebíveis CRI' },
  MXRF11: { name: 'Maxi Renda FII', sector: 'Híbrido / Permutas & CRI' },
  PVBI11: { name: 'VBI Prime Properties FII', sector: 'Lajes Corporativas AAA' },
  RBRF11: { name: 'RBR Alpha Multiestratégia FII', sector: 'Fundo de Fundos (FOF)' },
  RBRP11: { name: 'RBR Properties FII', sector: 'Lajes & Híbrido' },
  RBRR11: { name: 'RBR Rendimento High Grade FII', sector: 'Papel High Grade' },
  RECR11: { name: 'REC Recebíveis Imobiliários FII', sector: 'Papel / Recebíveis CRI' },
  RZTR11: { name: 'Riza Terrax Agronegócio FII', sector: 'Terras Agrícolas' },
  TGAR11: { name: 'TG Ativo Real FII', sector: 'Desenvolvimento Imobiliário' },
  TRXF11: { name: 'TRX Real Estate FII', sector: 'Renda Urbana & Varejo' },
  VGIP11: { name: 'Valora CRI Índice de Preço FII', sector: 'Papel IPCA+' },
  VGIR11: { name: 'Valora RE III Recebíveis CDI FII', sector: 'Papel CDI+' },
  VILG11: { name: 'Vinci Logística FII', sector: 'Galpões Logísticos' },
  VISC11: { name: 'Vinci Shopping Centers FII', sector: 'Shoppings' },
  VPLT11: { name: 'Vinci Logística FII', sector: 'Galpões Logísticos' },
  VRTA11: { name: 'Fator Verità Recebíveis FII', sector: 'Papel / Recebíveis CRI' },
  XPCI11: { name: 'XP Crédito Imobiliário FII', sector: 'Papel / Recebíveis CRI' },
  XPLG11: { name: 'XP Logística FII', sector: 'Galpões Logísticos' },
  XPML11: { name: 'XP Malls Shopping FII', sector: 'Shoppings' },

  // === STOCKS & ETFs EUA ===
  AAPL: { name: 'Apple Inc.', sector: 'Technology' },
  ABBV: { name: 'AbbVie Inc.', sector: 'Healthcare' },
  AMD: { name: 'Advanced Micro Devices (AMD)', sector: 'Semiconductors' },
  AMZN: { name: 'Amazon.com Inc.', sector: 'Consumer & Cloud' },
  AVGO: { name: 'Broadcom Inc.', sector: 'Semiconductors' },
  BERK34: { name: 'Berkshire Hathaway BDR', sector: 'Financials' },
  'BRK.B': { name: 'Berkshire Hathaway Class B', sector: 'Financials & Holdings' },
  COST: { name: 'Costco Wholesale Corp.', sector: 'Consumer Staples' },
  DIS: { name: 'The Walt Disney Company', sector: 'Entertainment' },
  GOOGL: { name: 'Alphabet Inc. (Google)', sector: 'Technology' },
  HD: { name: 'The Home Depot Inc.', sector: 'Retail' },
  IVVB11: { name: 'iShares S&P 500 B3 ETF', sector: 'ETF S&P 500' },
  JNJ: { name: 'Johnson & Johnson', sector: 'Healthcare' },
  JPM: { name: 'JPMorgan Chase & Co.', sector: 'Banking' },
  KO: { name: 'The Coca-Cola Company', sector: 'Beverages' },
  LLY: { name: 'Eli Lilly and Company', sector: 'Pharmaceuticals' },
  MA: { name: 'Mastercard Incorporated', sector: 'Payments' },
  MCD: { name: 'McDonald’s Corporation', sector: 'Restaurants' },
  META: { name: 'Meta Platforms Inc.', sector: 'Technology' },
  MSFT: { name: 'Microsoft Corporation', sector: 'Technology & Cloud' },
  NFLX: { name: 'Netflix Inc.', sector: 'Streaming' },
  NVDA: { name: 'NVIDIA Corporation', sector: 'AI & Semiconductors' },
  PEP: { name: 'PepsiCo Inc.', sector: 'Consumer Staples' },
  PG: { name: 'Procter & Gamble Co.', sector: 'Consumer Staples' },
  QQQ: { name: 'Invesco QQQ Trust (Nasdaq-100)', sector: 'ETF US Tech' },
  SCHD: { name: 'Schwab US Dividend Equity ETF', sector: 'ETF Dividendos EUA' },
  TSLA: { name: 'Tesla Inc.', sector: 'Automotive & Energy' },
  UNH: { name: 'UnitedHealth Group', sector: 'Healthcare' },
  V: { name: 'Visa Inc.', sector: 'Payments' },
  VOO: { name: 'Vanguard S&P 500 ETF', sector: 'ETF S&P 500' },
  VT: { name: 'Vanguard Total World Stock ETF', sector: 'ETF Global' },
  WFC: { name: 'Wells Fargo & Company', sector: 'Banking' },
  WMT: { name: 'Walmart Inc.', sector: 'Consumer Staples' },
  XOM: { name: 'Exxon Mobil Corporation', sector: 'Energy' },

  // === REITs EUA ===
  ADC: { name: 'Agree Realty Corporation', sector: 'Net Lease Retail REIT' },
  AMT: { name: 'American Tower Corporation', sector: 'Telecom Towers REIT' },
  AVB: { name: 'AvalonBay Communities', sector: 'Residential REIT' },
  DLR: { name: 'Digital Realty Trust', sector: 'Data Centers REIT' },
  EQIX: { name: 'Equinix Inc.', sector: 'Data Centers REIT' },
  NNN: { name: 'NNN REIT Inc.', sector: 'Retail Net Lease REIT' },
  O: { name: 'Realty Income Corporation', sector: 'Monthly Dividend Net Lease REIT' },
  PLD: { name: 'Prologis Inc.', sector: 'Global Logistics REIT' },
  PSA: { name: 'Public Storage', sector: 'Self-Storage REIT' },
  SPG: { name: 'Simon Property Group', sector: 'Premium Malls REIT' },
  STAG: { name: 'STAG Industrial Inc.', sector: 'Industrial Logistics REIT' },
  VICI: { name: 'VICI Properties Inc.', sector: 'Experiential & Hospitality REIT' },
  VNQ: { name: 'Vanguard Real Estate ETF', sector: 'ETF REITs EUA' },
  WELL: { name: 'Welltower Inc.', sector: 'Healthcare Infrastructure REIT' },

  // === RENDA FIXA & RESERVA ===
  'TESOURO SELIC': { name: 'Tesouro Selic Pós-Fixado (LFT)', sector: 'Soberano Liquidez Diária' },
  'TESOURO SELIC 2029': { name: 'Tesouro Selic 2029 Pós-Fixado (Soberano)', sector: 'Tesouro Direto' },
  TESOURO_SELIC_2029: { name: 'Tesouro Selic 2029 Pós-Fixado (Soberano)', sector: 'Tesouro Direto' },
  TESOURO_SELIC_2031: { name: 'Tesouro Selic 2031 Pós-Fixado (Soberano)', sector: 'Tesouro Direto' },
  CDB_LIQ_DIARIA: { name: 'CDB Liquidez Diária 100% do CDI (FGC)', sector: 'Bancário Liquidez D+0' },
  CONTA_REMUNERADA_CDI: { name: 'Conta Digital Remunerada 100% do CDI', sector: 'Liquidez Imediata D+0' },
  'TESOURO IPCA+ 2029': { name: 'Tesouro IPCA+ 2029 Proteção Inflação', sector: 'Tesouro Direto' },
  'TESOURO IPCA+ 2035': { name: 'Tesouro IPCA+ 2035 Longo Prazo', sector: 'Tesouro Direto' },
  'TESOURO IPCA+ 2045': { name: 'Tesouro IPCA+ 2045 Previdenciário', sector: 'Tesouro Direto' },
  'TESOURO PREFIXADO': { name: 'Tesouro Prefixado (LTN)', sector: 'Tesouro Direto' },
  'CDB 100% CDI': { name: 'CDB Liquidez Diária 100% do CDI', sector: 'Bancário FGC' },
  'CDB 110% CDI': { name: 'CDB Pós-Fixado 110% do CDI', sector: 'Bancário FGC' },
  'LCI 93% CDI': { name: 'LCI Isenta de IR Pós-Fixada CDI', sector: 'Crédito Imobiliário Isento' },
  'LCA 93% CDI': { name: 'LCA Isenta de IR Pós-Fixada CDI', sector: 'Crédito Agronegócio Isento' }
};

/**
 * Resolve o nome amigável do ativo garantindo que, se o banco tiver apenas o ticker repetido,
 * utilizemos o nome oficial da empresa/fundo.
 */
export function resolveAssetDisplayName(code: string, dbName?: string | null): string {
  const upper = code.trim().toUpperCase();
  const normalized = upper.replace(/_/g, ' ');
  const dict = OFFICIAL_ASSET_NAMES[upper] || OFFICIAL_ASSET_NAMES[normalized];
  const cleanDb = (dbName || '').trim();

  if (cleanDb && cleanDb.toUpperCase() !== upper && cleanDb.toUpperCase() !== normalized) {
    return cleanDb;
  }
  if (dict?.name) {
    return dict.name;
  }
  return cleanDb || normalized;
}

export function resolveAssetSector(code: string, dbSector?: string | null): string | null {
  const upper = code.trim().toUpperCase();
  const dictSector = OFFICIAL_ASSET_NAMES[upper]?.sector ?? null;
  const cleanDb = (dbSector || '').trim();

  if (cleanDb && cleanDb.toLowerCase() !== 'carteira') {
    return cleanDb;
  }
  return dictSector || cleanDb || null;
}

function inferSeedCategory(code: string): {
  category: SeedAssetEntry['category'];
  market: SeedAssetEntry['market'];
} {
  if (
    code.startsWith('TESOURO') ||
    code.startsWith('CDB') ||
    code.startsWith('CONTA') ||
    code.startsWith('LCI') ||
    code.startsWith('LCA')
  ) {
    return { category: 'fixed', market: 'BR' };
  }
  const reitTickers = new Set([
    'ADC',
    'AMT',
    'AVB',
    'DLR',
    'EQIX',
    'NNN',
    'O',
    'PLD',
    'PSA',
    'SPG',
    'STAG',
    'VICI',
    'VNQ',
    'WELL'
  ]);
  if (reitTickers.has(code)) {
    return { category: 'reits', market: 'US' };
  }
  if (!/\d$/.test(code) && code !== 'IVVB11') {
    return { category: 'stocks', market: 'US' };
  }
  const fiiExceptions = new Set([
    'ALUP11',
    'BPAC11',
    'ENGI11',
    'IGTI11',
    'IVVB11',
    'KLBN11',
    'SANB11',
    'SAPR11',
    'TAEE11'
  ]);
  if (code.endsWith('11') && !fiiExceptions.has(code)) {
    return { category: 'fiis', market: 'BR' };
  }
  return { category: 'acoes', market: 'BR' };
}

/**
 * Catálogo semente disponível instantaneamente (0ms) no cliente antes mesmo do fetch de 1.524 ativos concluir.
 */
export const SEED_CATALOG_ASSETS: SeedAssetEntry[] = Object.entries(OFFICIAL_ASSET_NAMES).map(
  ([code, info]) => {
    const { category, market } = inferSeedCategory(code);
    return {
      code,
      name: info.name,
      category,
      market,
      sector: info.sector || ''
    };
  }
);

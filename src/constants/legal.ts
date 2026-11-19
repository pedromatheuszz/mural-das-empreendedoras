import { APP_NAME, LEGAL_ENTITY, LEGAL_VERSION } from './app';

/**
 * Textos legais exibidos no app.
 * ⚠️ Modelo inicial orientado pela LGPD (Lei 13.709/2018) e pelo Marco Civil da Internet.
 * Revise com assessoria jurídica e preencha LEGAL_ENTITY (constants/app.ts) antes de publicar.
 */
export type LegalSection = { title: string; paragraphs: string[] };
export type LegalDocument = { title: string; updatedAt: string; intro: string; sections: LegalSection[] };

const contact = `${LEGAL_ENTITY.name}, inscrita no CNPJ ${LEGAL_ENTITY.document}, com sede em ${LEGAL_ENTITY.city}`;

export const PRIVACY_POLICY: LegalDocument = {
  title: 'Política de Privacidade',
  updatedAt: LEGAL_VERSION,
  intro: `Esta política explica, de forma simples, como o ${APP_NAME} coleta, usa e protege os seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (LGPD).`,
  sections: [
    {
      title: '1. Quem é responsável pelos seus dados',
      paragraphs: [
        `O ${APP_NAME} é operado por ${contact} (controladora dos dados). Dúvidas sobre privacidade podem ser enviadas para ${LEGAL_ENTITY.privacyEmail}.`,
      ],
    },
    {
      title: '2. Quais dados coletamos',
      paragraphs: [
        'Dados da conta (privados): nome completo, e-mail e a data em que você aceitou os Termos e esta Política. Sua senha é protegida pelo serviço de autenticação e nunca é armazenada pelo aplicativo nem fica visível para a equipe.',
        'Dados do perfil empresarial (públicos somente após a publicação, com o seu consentimento): nome da marca, nome da responsável, descrição dos serviços, categoria, cidade e estado, links de contato (WhatsApp, Instagram ou outra rede, site), logotipo, foto e cortesias oferecidas.',
        'Dados técnicos: registros de acesso (como endereço IP, data e hora) mantidos pelo provedor de infraestrutura para segurança, e o histórico de alterações do perfil, usado para moderação.',
        'Denúncias: o motivo e os detalhes que você informar ao denunciar um perfil.',
        'Não coletamos localização precisa, lista de contatos, dados de pagamento nem dados pessoais sensíveis.',
      ],
    },
    {
      title: '3. Para que usamos os dados e com qual base legal',
      paragraphs: [
        'Criar e manter sua conta e permitir o acesso ao app — execução de contrato (art. 7º, V, da LGPD).',
        'Exibir seu perfil empresarial para as demais usuárias — consentimento (art. 7º, I). Você pode revogá-lo a qualquer momento retirando o perfil do Mural ou excluindo-o.',
        'Garantir a segurança, prevenir fraudes e moderar conteúdos — legítimo interesse (art. 7º, IX).',
        'Cumprir obrigações legais, como a guarda de registros de acesso — obrigação legal (art. 7º, II, e art. 15 do Marco Civil da Internet).',
        'Enviar mensagens essenciais, como confirmação de e-mail e recuperação de senha.',
      ],
    },
    {
      title: '4. Com quem compartilhamos',
      paragraphs: [
        'Não vendemos nem alugamos seus dados. Eles são tratados por fornecedores que nos ajudam a operar o serviço, como o Neon (banco de dados e autenticação) e o Cloudinary (armazenamento de imagens) e o provedor de envio de e-mails. Esses fornecedores podem armazenar dados fora do Brasil, sempre com salvaguardas adequadas (art. 33 da LGPD).',
        'Também podemos compartilhar dados com autoridades públicas quando houver obrigação legal ou ordem judicial.',
      ],
    },
    {
      title: '5. Informações públicas do perfil',
      paragraphs: [
        'Ao publicar seu perfil, as informações dele ficam visíveis para quem usa o app. Não publique dados pessoais sensíveis, nem dados ou imagens de outras pessoas sem autorização. E-mail e demais dados da conta nunca aparecem no perfil público.',
      ],
    },
    {
      title: '6. Como protegemos seus dados',
      paragraphs: [
        'Usamos conexão criptografada (HTTPS), regras de segurança no banco de dados que garantem que cada pessoa só altere os próprios dados, armazenamento seguro da sessão no aparelho (Keychain/Keystore) e acesso restrito às informações de moderação.',
      ],
    },
    {
      title: '7. Por quanto tempo guardamos',
      paragraphs: [
        'Mantemos seus dados enquanto sua conta existir. Ao excluir a conta, apagamos a conta, o perfil e as imagens. Registros de acesso podem ser mantidos pelo prazo mínimo exigido em lei (6 meses) e metadados técnicos de moderação são mantidos sem identificar você.',
      ],
    },
    {
      title: '8. Seus direitos',
      paragraphs: [
        'Você pode, a qualquer momento: confirmar a existência de tratamento, acessar e corrigir seus dados, pedir anonimização, portabilidade ou eliminação, saber com quem compartilhamos, revogar o consentimento e reclamar à Autoridade Nacional de Proteção de Dados (ANPD).',
        `Muitas dessas ações estão no próprio app (editar perfil, retirar do Mural, excluir perfil e excluir conta). Para as demais, escreva para ${LEGAL_ENTITY.privacyEmail}.`,
      ],
    },
    {
      title: '9. Maiores de 18 anos',
      paragraphs: [`O ${APP_NAME} é destinado a pessoas com 18 anos ou mais.`],
    },
    {
      title: '10. Alterações desta política',
      paragraphs: [
        'Podemos atualizar esta política para refletir melhorias no serviço ou mudanças legais. Mudanças relevantes serão avisadas no aplicativo.',
      ],
    },
  ],
};

export const TERMS_OF_USE: LegalDocument = {
  title: 'Termos de Uso',
  updatedAt: LEGAL_VERSION,
  intro: `Bem-vinda ao ${APP_NAME}! Ao criar uma conta, você concorda com estes Termos. Leia com atenção.`,
  sections: [
    {
      title: '1. O que é o Mural',
      paragraphs: [
        `O ${APP_NAME} é uma plataforma para dar visibilidade a negócios de mulheres empreendedoras. O Mural apresenta negócios: não vende produtos, não intermedeia pagamentos e não participa das negociações. Cada empreendedora responde pelos produtos e serviços que oferece.`,
      ],
    },
    {
      title: '2. Sua conta',
      paragraphs: [
        'Para usar o Mural é preciso ter 18 anos ou mais, informar dados verdadeiros e manter sua senha em sigilo. Você é responsável pelas atividades realizadas na sua conta.',
        'Nesta versão, cada conta pode ter um perfil empresarial.',
      ],
    },
    {
      title: '3. Conteúdo que você publica',
      paragraphs: [
        'Você é responsável pelas informações, imagens e links do seu perfil e garante que tem o direito de usá-los (incluindo marcas, logotipos e fotos).',
        'Enquanto o perfil estiver publicado, você autoriza o Mural, de forma gratuita e não exclusiva, a exibir esse conteúdo no aplicativo. Você pode retirar o perfil ou excluí-lo a qualquer momento.',
      ],
    },
    {
      title: '4. O que não é permitido',
      paragraphs: [
        'Publicar conteúdo ilegal, enganoso, discriminatório, ofensivo, sexual ou violento; oferecer produtos ou serviços proibidos por lei; aplicar golpes ou pedir dados pessoais de forma suspeita; enviar spam; se passar por outra pessoa ou marca; coletar dados de outras usuárias; ou tentar burlar a segurança do aplicativo.',
      ],
    },
    {
      title: '5. Moderação e denúncias',
      paragraphs: [
        'Qualquer usuária pode denunciar um perfil. A equipe do Mural analisa as denúncias e pode suspender ou remover perfis que descumpram estes Termos. Um perfil suspenso só pode ser reativado pela moderação.',
      ],
    },
    {
      title: '6. Relações entre empreendedoras e clientes',
      paragraphs: [
        'Combinações de preço, pagamento, entrega e qualidade dos serviços são de responsabilidade exclusiva de quem negocia. O Mural não garante resultados nem se responsabiliza por acordos feitos entre usuárias e clientes.',
      ],
    },
    {
      title: '7. Disponibilidade do serviço',
      paragraphs: [
        'Trabalhamos para manter o Mural sempre disponível e seguro, mas podem ocorrer interrupções para manutenção ou por fatores externos. Recursos podem ser alterados para melhorar a experiência.',
      ],
    },
    {
      title: '8. Propriedade intelectual',
      paragraphs: [
        `A marca, o design e o software do ${APP_NAME} pertencem aos seus titulares e não podem ser copiados ou usados sem autorização.`,
      ],
    },
    {
      title: '9. Encerramento',
      paragraphs: [
        'Você pode excluir sua conta a qualquer momento em Meu Perfil → Excluir minha conta. O Mural pode encerrar contas que violem estes Termos, garantindo seus direitos previstos em lei.',
      ],
    },
    {
      title: '10. Lei aplicável',
      paragraphs: [
        'Estes Termos seguem as leis brasileiras, incluindo o Código de Defesa do Consumidor e a LGPD. Fica eleito o foro do domicílio da usuária para resolver eventuais conflitos.',
      ],
    },
    {
      title: '11. Contato',
      paragraphs: [`Dúvidas ou sugestões: ${LEGAL_ENTITY.supportEmail}. Responsável: ${contact}.`],
    },
  ],
};

-- =============================================================================
-- Integrantes do grupo Joinville Empreendedoras (instagram.com/joinvilleempreendedoras)
-- Lista enviada pela organização em 18/11/2026: 89 itens → 85 perfis
-- (6 duplicados unidos e 2 linhas com dois negócios separadas).
-- Em 19/11/2026: + Daay Perfumaria e Personalizados da Je (87 perfis).
--
-- Como usar: npm run db:migrate -- --seed (DEPOIS das migrations).
-- Pode ser executado de novo sem duplicar (compara pelo nome da marca).
--
-- ⚠️ LGPD: os perfis entram PUBLICADOS e o consentimento é registrado em nome da
-- organização do grupo. Confirme com cada empreendedora que ela autoriza a divulgação
-- e retire do Mural quem pedir (veja docs/SUPABASE.md → "Empreendedoras do grupo").
--
-- Revisar com o grupo (dados incompletos ou duvidosos na lista original):
--   * sem Instagram válido: Paula Doce Alegria (@paula-doce-alegria tem hífen, que o
--     Instagram não aceita), Ebenézer Produtos Artesanais (@Ebenézer_produros_artesanais
--     tem acento) e Juliana Hasegawa Crochê (sem @);
--   * @ com grafia duvidosa: lis_desapego_jvlle (veio "@Lis_desapego _jvlle") e
--     antoniaazevedotabuasdefrios (também apareceu como antoniaazevedo.tabuasdefrios);
--   * nomes de marca escritos a partir do @ e "Integrante do grupo"
--     onde a lista não trazia o nome da empreendedora;
--   * descrições genéricas onde a lista só trazia o @.
-- =============================================================================

with source (business_name, entrepreneur_name, service_description, category, instagram) as (
  values
    -- 1
    ('Amat Consultoria'::text, 'Milena'::text, 'Consultoria em presença digital.'::text, 'marketing'::text, 'amatconsultoria'::text),
    -- 2
    ('Studio Ita Beauty', 'Itaciara Silva', 'Studio de beleza. Conheça os serviços no Instagram.', 'beleza', 'studio_itabeauty'),
    -- 3
    ('Zenaide Plano de Saúde', 'Zenaide', 'Planos de saúde. Conheça as opções no Instagram.', 'saude', 'zenaide.planodesaude'),
    -- 4
    ('Bia Rocha Confeitaria', 'Bia Rocha', 'Confeitaria. Conheça os produtos no Instagram.', 'gastronomia', 'biarochaconfeitaria'),
    -- 5
    ('Auras Cosméticos', 'Integrante do grupo', 'Cosméticos. Conheça os produtos no Instagram.', 'beleza', 'aurascosmeticos_'),
    -- 6
    ('Karolyne Paola Beauty', 'Karolyne Paola', 'Serviços de massagem e estética.', 'beleza', 'karolynepaolabeauty'),
    -- 7
    ('Cah Figueredo', 'Cah Figueredo', 'Influenciadora e criadora de conteúdo. Para serviços de social media, veja também o perfil profissional @storymaker_cahfigueredo.', 'marketing', 'cah_figueredo0'),
    -- 8
    ('Studio Susch', 'Suzane', 'Personal trainer com studio personalizado e criadora de conteúdo. Perfil pessoal: @suzane_sch.', 'saude', 'studiosusch'),
    -- 9
    ('Licaliel', 'Integrante do grupo', 'Criadora de conteúdo e influenciadora.', 'marketing', 'licaliel'),
    -- 10
    ('Camila Sweets', 'Camila', 'Confeitaria: bolos, brigadeiros, tortas doces e salgadas.', 'gastronomia', 'camilasweets.joinville'),
    -- 11
    ('Louvin Studio 3D', 'Integrante do grupo', 'Impressão 3D, personalizados, decoração e muito mais.', 'artesanato', 'louvinstudio3d'),
    -- 12 + 87
    ('DK Face', 'Integrante do grupo', 'Cuidados e beleza facial: produtos de skincare, maquiagem e acessórios que tornam o autocuidado mais simples no dia a dia, além de dicas de maquiagem.', 'beleza', 'dk_face_oficial'),
    -- 13
    ('Delícias da Kah', 'Kah', 'Bolos, docinhos, empadão e tortas doces.', 'gastronomia', 'deliciasdakah50'),
    -- 14 + 81
    ('Heluce', 'Mariana', 'Biscoitos artesanais amanteigados e sequilhos.', 'gastronomia', 'heluce_joinville'),
    -- 15 (descrição e nome da empreendedora conforme o mural original)
    ('Planeta das Batidas', 'Cris', 'Venda de batidas alcoólicas.', 'gastronomia', 'planetadasbatidas'),
    -- 16
    ('Forno da Fran', 'Fran', 'Padaria e confeitaria artesanal.', 'gastronomia', 'fornodafran'),
    -- 17
    ('Franciele Berny', 'Franciele Berny', 'Gestora de redes sociais para empreendedores.', 'marketing', 'francieleberny_'),
    -- 18
    ('Rosi Mercedes', 'Rosi Mercedes', 'Integrante do grupo Joinville Empreendedoras. Conheça os produtos e serviços no Instagram.', null, 'rosimercedess'),
    -- 19
    ('Crislaine Luz', 'Crislaine Luz', 'Maquiadora e penteadista. Cursos de automaquiagem e de maquiagem profissional; criadora de conteúdo.', 'beleza', 'soucrislaineluz'),
    -- 20
    ('Yza Hair Studio', 'Integrante do grupo', 'Salão de beleza especialista em alisamentos, tratamentos e unhas.', 'beleza', 'yzahairstudio'),
    -- 21
    ('Jessica Oliveira', 'Jessica Oliveira', 'Profissional de marketing; conteúdo sobre empreendedorismo na área da beleza.', 'marketing', 'ajessicaoliiveira'),
    -- 22
    ('Maison Margot', 'Integrante do grupo', 'Venda de cosméticos e produtos de autocuidado, além de maquiagem personalizada a domicílio.', 'beleza', 'margotbelezaeautocuidado'),
    -- 23
    ('Maison Margot Decor', 'Integrante do grupo', 'Decoração, peças personalizadas e itens decorativos sob encomenda.', 'casa', 'maisonmargotdecor'),
    -- 24 + 88
    ('Camii Sabores e Camadas', 'Camila', 'Venda de empadão artesanal.', 'gastronomia', 'camii_sabores_e_camadas'),
    -- 25
    ('Thainy Nails', 'Thainy Queiroz', 'Alongamento de unhas com foco em naturalidade, realçando ainda mais a beleza das mãos.', 'beleza', 'thainynails'),
    -- 26
    ('Madame M Perfumaria', 'Maiara', 'Perfumaria. Conheça os produtos no Instagram.', 'beleza', 'madamem.perfumaria'),
    -- 27
    ('Amare Criativa', 'Natália', 'Produtos em impressão 3D.', 'artesanato', 'amare.criativa'),
    -- 28
    ('Papel Dobrado Papelaria', 'Integrante do grupo', 'Materiais escolares, de escritório e de scrapbook, além de ateliê com oficinas.', 'outros', 'papeldobradopapelaria'),
    -- 29
    ('JF Confeitando com Amor', 'Integrante do grupo', 'Confeitaria: bolos, brigadeiros, tortas, pudim, pão de mel e muito mais.', 'gastronomia', 'jfconfeitandocomamor'),
    -- 30
    ('Aflora Semijoias', 'Integrante do grupo', 'Semijoias hipoalergênicas.', 'moda', 'aflorasemijoias._'),
    -- 31
    ('Jami Doces no Pote', 'Integrante do grupo', 'Doces no pote: mousses e pudins.', 'gastronomia', 'jamidocesnopote'),
    -- 32
    ('Adryy Bolos', 'Integrante do grupo', 'Bolos, tortas, docinhos e salgados: tudo para o seu evento.', 'gastronomia', 'adryy_bolos'),
    -- 33
    ('Dunzer Lanches', 'Integrante do grupo', 'Lanches. Conheça o cardápio no Instagram.', 'gastronomia', 'dunzerlanches'),
    -- 34
    ('Helo Ribeiro Beauty Studio', 'Helo Ribeiro', 'Studio de beleza. Conheça os serviços no Instagram.', 'beleza', 'helo.ribeirobeautystudio'),
    -- 35
    ('Mih Body Piercer', 'Mih', 'Body piercer especialista em visagismo auricular e reconstrução de lóbulo.', 'beleza', 'mih_body_piercer'),
    -- 36
    ('Studio Sandy Menez', 'Sandy Menez', 'Extensão de cílios, design de sobrancelhas, brow lamination e spa dos lábios.', 'beleza', 'freitassandy.lash'),
    -- 37
    ('Break Fit', 'Integrante do grupo', 'Tortas e doces zero açúcar, com algumas opções sem glúten.', 'gastronomia', 'breakfit.oficial'),
    -- 38
    ('Aroma Blesse', 'Integrante do grupo', 'Sabonetes, body splash e artigos de crochê, como bolsas duplas, entre outros.', 'artesanato', 'aroma.blesse'),
    -- 39
    ('Ede Casa Personalizados', 'Integrante do grupo', 'Produtos personalizados: canecas, papelaria, bótons e foto ímã.', 'artesanato', 'edecasapersonalizados'),
    -- 40
    ('Nature Leve', 'Integrante do grupo', 'Comida saudável. Conheça o cardápio no Instagram.', 'gastronomia', 'nature_leve'),
    -- 41
    ('Alyas Doces', 'Integrante do grupo', 'Festa completa: decoração, doces e salgados.', 'eventos', 'alyasdoces'),
    -- 42
    ('Empanadas da Colômbia', 'Integrante do grupo', 'Empanadas colombianas, avenas cubanas e molhos da casa.', 'gastronomia', 'empanadasdacolombia'),
    -- 43
    ('Juliana Furbringer', 'Juliana', 'Consultora de imagem e estilo.', 'moda', 'julianafurbringer_'),
    -- 44
    ('Ateliê Ju Gaspar', 'Ju Gaspar', 'Bolsas em corda náutica, nécessaires e sousplats.', 'artesanato', 'atelie.ju.gaspar'),
    -- 45
    ('Bestcell', 'Vanessa', 'Assistência técnica e acessórios para celular. Perfis: @bestcelljardimiririu e @bestcellaventureiro.', 'servicos', 'bestcelljardimiririu'),
    -- 46 + 80
    ('Alimi e Amor em Cestas', 'Integrante do grupo', 'Cestas de café da manhã, box de cookies e pães caseiros.', 'gastronomia', 'alimieamoremcestas'),
    -- 47
    ('Viviane Menes Gomes', 'Viviane Menes Gomes', 'Personal trainer. Conheça o trabalho no Instagram.', 'saude', 'vivianemenesgomes'),
    -- 48
    ('Muy Guapa', 'Integrante do grupo', 'Saboaria artesanal. Conheça os produtos no Instagram.', 'artesanato', 'muyguapamk'),
    -- 49
    ('Roberta Daltro Beauty Studio', 'Roberta Daltro', 'Studio de beleza. Conheça os serviços no Instagram.', 'beleza', 'robertadaltro.beautystudio'),
    -- 50
    ('RD Semijoias', 'Integrante do grupo', 'Semijoias. Conheça as peças no Instagram.', 'moda', '_rd.semijoias'),
    -- 51
    ('JE Escritora', 'Integrante do grupo', 'Escritora e revisora gramatical. 📖', 'educacao', 'jeescritora'),
    -- 52
    ('Dai Quitutes', 'Integrante do grupo', 'Kits festa com preço bom e qualidade!', 'eventos', 'daiquitutesda'),
    -- 53 (@ a confirmar)
    ('Lis Desapego', 'Integrante do grupo', 'Desapegos em Joinville. Conheça as peças no Instagram.', 'moda', 'lis_desapego_jvlle'),
    -- 54 + 78 (@ a confirmar)
    ('Antonia Azevedo Tábuas de Frios', 'Antonia Azevedo', 'Tábuas de frios, cestas de café da manhã e mimos.', 'gastronomia', 'antoniaazevedotabuasdefrios'),
    -- 55
    ('Alma Basic', 'Integrante do grupo', 'Camisetas femininas (t-shirts).', 'moda', 'almabasic.br'),
    -- 56
    ('Manos Conveniência', 'Natália Tino', 'Loja de conveniência. Perfil pessoal da empreendedora: @nataliatino.', 'outros', 'manosconveniencia1207'),
    -- 57 + 86
    ('BenPro 3D', 'Integrante do grupo', 'Impressão 3D. Conheça os produtos no Instagram.', 'artesanato', 'benpro3d'),
    -- 58 (sem Instagram válido)
    ('Paula Doce Alegria', 'Paula', 'Doces. Integrante do grupo Joinville Empreendedoras.', 'gastronomia', null),
    -- 59
    ('Babi Confeitaria', 'Integrante do grupo', 'Confeitaria: bolos e docinhos.', 'gastronomia', 'babiconfeitaria_'),
    -- 60
    ('Urbanski Collection', 'Karol', 'Integrante do grupo Joinville Empreendedoras. Conheça os produtos e serviços no Instagram.', null, 'urbanski_collection'),
    -- 61
    ('Grasi Smolski', 'Grasi Smolski', 'Consultora de beleza Mary Kay.', 'beleza', 'grasismolski'),
    -- 61 (segundo item com o mesmo número)
    ('Aurora Semijoias', 'Integrante do grupo', 'Semijoias e personalizados.', 'moda', 'semi.joiaaurora'),
    -- 62
    ('Heaven Aromas', 'Integrante do grupo', 'Integrante do grupo Joinville Empreendedoras. Conheça os produtos e serviços no Instagram.', null, 'heaven_aromas'),
    -- 62 (segundo negócio na mesma linha)
    ('Inc2 Mídia', 'Integrante do grupo', 'Tráfego pago e pilotagem de drone.', 'marketing', 'inc2midia'),
    -- 63
    ('Berenice & Co.', 'Integrante do grupo', 'Difusores e velas aromáticas.', 'casa', 'bereniceeco'),
    -- 64
    ('Dois Tesouros Kids', 'Integrante do grupo', 'Integrante do grupo Joinville Empreendedoras. Conheça os produtos e serviços no Instagram.', null, 'doistesouros.kids'),
    -- 65
    ('A Virtuosa Propósito', 'Integrante do grupo', 'Camisetas (t-shirts) cristãs femininas e masculinas.', 'moda', 'avirtuosa_proposito'),
    -- 66 (sem Instagram válido)
    ('Ebenézer Produtos Artesanais', 'Integrante do grupo', 'Produtos artesanais. Integrante do grupo Joinville Empreendedoras.', 'artesanato', null),
    -- 67
    ('Sheila Artesanato Religioso', 'Sheila', 'Artesanato religioso. Conheça as peças no Instagram.', 'artesanato', 'sheila_artesanatoreligioso'),
    -- 68
    ('Rute Decora', 'Rute', 'Acessórios temáticos personalizados.', 'eventos', 'rutedecora'),
    -- 69
    ('Josine Kallebe', 'Integrante do grupo', 'Consultora de beleza Mary Kay.', 'beleza', 'josinekallebe'),
    -- 70
    ('Gabriela Cristina Massoterapeuta', 'Gabriela Cristina', 'Massoterapia integrativa.', 'saude', 'gabrielacristinamassoterapeuta'),
    -- 71
    ('Doce Lolo Doceria', 'Integrante do grupo', 'Doces personalizados, sobremesas e muito mais.', 'gastronomia', 'docelolo_doceria'),
    -- 72
    ('Store Faby Santos', 'Faby Santos', 'Loja de roupas femininas.', 'moda', 'store_fabysantos'),
    -- 73
    ('Flor Primavera Personalizados', 'Integrante do grupo', 'Personalizados. Conheça os produtos no Instagram.', 'artesanato', 'personalizado_florprimavera'),
    -- 74
    ('Studio Tabata Goulart', 'Tabata Goulart', 'Integrante do grupo Joinville Empreendedoras. Conheça os produtos e serviços no Instagram.', null, 'studio.tabatagoulart'),
    -- 75
    ('La Dorothea Natural', 'Natália Tino', 'Produtos naturais para saúde e autocuidado da pele. Perfil pessoal da empreendedora: @nataliatino.', 'saude', 'ladorothea.natural'),
    -- 76 (sem Instagram na lista)
    ('Juliana Hasegawa Crochê', 'Juliana Hasegawa', 'Peças artesanais em crochê.', 'artesanato', null),
    -- 77
    ('Afeto e Ponto', 'Integrante do grupo', 'Bolsas artesanais em crochê.', 'artesanato', 'afetoepontoo'),
    -- 79
    ('Joy Semijoias', 'Integrante do grupo', 'Semijoias com banho de ouro e prata 925.', 'moda', '_joy.semijoias'),
    -- 82
    ('Tudo10 Make', 'Integrante do grupo', 'Maquiagem. Conheça os produtos no Instagram.', 'beleza', 'tudo10makeoficial'),
    -- 83
    ('Norte Sul Salgados Delivery', 'Integrante do grupo', 'Salgados com entrega (delivery).', 'gastronomia', 'nortesulsalgadosdelivery'),
    -- 84
    ('Ateliê Arte Aroma', 'Integrante do grupo', 'Artesanato natalino. Conheça as peças no Instagram.', 'artesanato', 'atelie_artearoma'),
    -- 85
    ('Fabiana Mohr', 'Fabiana Mohr', 'Integrante do grupo Joinville Empreendedoras. Conheça os produtos e serviços no Instagram.', null, 'fabiana.mohr'),
    -- 89
    ('Nanda Rocha Depiladora', 'Nanda Rocha', 'Epiladora e designer de sobrancelhas, com atendimentos unissex.', 'beleza', 'nandarochadepiladora'),
    -- Adicionadas em 19/11/2026
    ('Daay Perfumaria', 'Integrante do grupo', 'Perfumes árabes e importados.', 'beleza', 'daay_perfumariaa'),
    ('Personalizados da Je', 'Integrante do grupo', 'Produtos personalizados. Conheça os produtos no Instagram.', 'artesanato', 'personalizados.da.je')
)
insert into public.entrepreneur_profiles (
  user_id,
  business_name,
  entrepreneur_name,
  service_description,
  category,
  city,
  state,
  instagram_url,
  publication_status,
  public_consent_at
)
select
  null,
  s.business_name,
  s.entrepreneur_name,
  s.service_description,
  s.category,
  'Joinville',
  'SC',
  case when s.instagram is not null then 'https://www.instagram.com/' || s.instagram end,
  'published',
  now()
from source s
where not exists (
  select 1
  from public.entrepreneur_profiles p
  where p.user_id is null
    and p.business_name = s.business_name
);

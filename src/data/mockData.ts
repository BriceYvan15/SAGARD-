import type { Client, Contract, Site, Agent, Invoice, Operation, Notification } from '../types';

export const clients: Client[] = [
  { id:'c1', name:'NSIA Banque CI', sector:'Finance & Banque', contactName:'M. Kouassi Akissi', email:'direction@nsia.ci', phone:'+225 2720 030000', address:'Avenue Terrasson de Fougères, Plateau', city:'Abidjan', status:'actif', createdAt:'2023-03-15', contracts:3, totalRevenue:21600000,
    history:[
      {id:'h1',date:'2023-03-15',action:'Client créé',user:'Admin',details:'Ouverture dossier NSIA Banque CI',type:'create'},
      {id:'h2',date:'2023-04-01',action:'Contrat signé',user:'Kouamé Diallo',details:'Contrat SAG-CT-2301 — 6 agences Plateau',type:'document'},
      {id:'h3',date:'2024-01-10',action:'Renouvellement',user:'Admin',details:'Contrat renouvelé — 2 100 000 XOF/mois',type:'status'},
      {id:'h4',date:'2024-05-20',action:'Paiement reçu',user:'Système',details:'Facture SAG-202405-0012 — 2 100 000 XOF',type:'payment'},
    ]},
  { id:'c2', name:"Orange Côte d'Ivoire", sector:'Télécommunications', contactName:'Mme Fatoumata Bamba', email:'securite@orange.ci', phone:'+225 2721 000000', address:'Bld du Général de Gaulle, Cocody', city:'Abidjan', status:'actif', createdAt:'2022-11-01', contracts:2, totalRevenue:36000000,
    history:[
      {id:'h1',date:'2022-11-01',action:'Client créé',user:'Admin',details:'Prospection aboutie — contact DSI',type:'create'},
      {id:'h2',date:'2022-12-01',action:'Contrat signé',user:'Admin',details:'Gardiennage siège social',type:'document'},
      {id:'h3',date:'2024-03-01',action:'Extension',user:'Kouamé Diallo',details:'+4 agents — nouveau site Marcory',type:'update'},
    ]},
  { id:'c3', name:"Ecobank Côte d'Ivoire", sector:'Finance & Banque', contactName:'M. Serge Tah', email:'facilities@ecobank.com', phone:'+225 2721 010101', address:'Immeuble Ecobank, Avenue Joseph Anoma', city:'Abidjan', status:'actif', createdAt:'2023-06-01', contracts:4, totalRevenue:28800000,
    history:[
      {id:'h1',date:'2023-06-01',action:'Client créé',user:'Admin',details:'Référencé par NSIA Banque',type:'create'},
      {id:'h2',date:'2023-07-15',action:'Contrat signé',user:'Admin',details:'4 agences — 12 agents',type:'document'},
    ]},
  { id:'c4', name:'Hôtel Ivoire Sofitel', sector:'Hôtellerie & Tourisme', contactName:'M. François Mensah', email:'gm@hotelivoire.ci', phone:'+225 2722 400000', address:'Boulevard Hassan II, Cocody', city:'Abidjan', status:'actif', createdAt:'2022-08-10', contracts:1, totalRevenue:14400000,
    history:[
      {id:'h1',date:'2022-08-10',action:'Client créé',user:'Admin',details:'Hôtel luxe — sécurité 24h',type:'create'},
    ]},
  { id:'c5', name:'INFLUO Media', sector:'Marketing & Communication', contactName:'Mme Adjoua Koné', email:'admin@influo.ci', phone:'+225 0749 000001', address:'Cité Verte, Yopougon', city:'Abidjan', status:'actif', createdAt:'2024-02-01', contracts:1, totalRevenue:1200000,
    history:[
      {id:'h1',date:'2024-02-01',action:'Client créé',user:'Admin',details:'Nouveau client — surveillance bureau',type:'create'},
      {id:'h2',date:'2024-02-16',action:'Facture pro forma',user:'Admin',details:'SAG-PF2403 — 600 000 XOF',type:'document'},
    ]},
  { id:'c6', name:'Playce Marcory', sector:'Commerce & Distribution', contactName:"M. Abdoulaye Traoré", email:'direction@playce.ci', phone:'+225 2722 555555', address:'Boulevard de Marseille, Marcory', city:'Abidjan', status:'actif', createdAt:'2023-01-15', contracts:2, totalRevenue:19200000,
    history:[{id:'h1',date:'2023-01-15',action:'Client créé',user:'Admin',details:'Centre commercial 24h',type:'create'}]},
  { id:'c7', name:'Polyclinique Internationale de Cocody', sector:'Santé', contactName:'Dr. Ama Assi', email:'admin@pic.ci', phone:'+225 2722 123456', address:'Rue des Jardins, Cocody Angré', city:'Abidjan', status:'actif', createdAt:'2023-09-01', contracts:1, totalRevenue:9600000,
    history:[{id:'h1',date:'2023-09-01',action:'Client créé',user:'Admin',details:'Établissement de santé',type:'create'}]},
  { id:'c8', name:"MTN Côte d'Ivoire", sector:'Télécommunications', contactName:'M. Issouf Sawadogo', email:'facilities@mtn.ci', phone:'+225 0701 234567', address:'Boulevard Latrille, Cocody', city:'Abidjan', status:'actif', createdAt:'2022-05-01', contracts:3, totalRevenue:43200000,
    history:[{id:'h1',date:'2022-05-01',action:'Client créé',user:'Admin',details:'Contrat cadre multi-sites',type:'create'}]},
  { id:'c9', name:'Université FHB', sector:'Éducation', contactName:'M. Gnamien Yao', email:'daf@ufhb.ci', phone:'+225 2744 080808', address:'Route de la Corniche, Cocody', city:'Abidjan', status:'actif', createdAt:'2023-02-20', contracts:1, totalRevenue:6000000,
    history:[{id:'h1',date:'2023-02-20',action:'Client créé',user:'Admin',details:'Campus 4 sites',type:'create'}]},
  { id:'c10', name:'SODECI', sector:'Services Publics', contactName:'Mme Lucie Koffi', email:'securite@sodeci.ci', phone:'+225 2720 808080', address:'Avenue Christiani, Plateau', city:'Abidjan', status:'inactif', createdAt:'2021-11-01', contracts:1, totalRevenue:5400000,
    history:[
      {id:'h1',date:'2021-11-01',action:'Client créé',user:'Admin',details:'Surveillance entrepôts',type:'create'},
      {id:'h2',date:'2023-10-31',action:'Contrat expiré',user:'Système',details:'Non renouvellement — client inactif',type:'status'},
    ]},
  { id:'c11', name:'CFAO Motors CI', sector:'Automobile', contactName:'M. Patrice Gueu', email:'admin@cfao.ci', phone:'+225 2721 777777', address:'Route de Bingerville, Zone 4', city:'Abidjan', status:'prospect', createdAt:'2024-04-10', contracts:0, totalRevenue:0,
    history:[
      {id:'h1',date:'2024-04-10',action:'Prospect créé',user:'Kouamé Diallo',details:'Forum économique Abidjan',type:'create'},
      {id:'h2',date:'2024-05-02',action:'Relance',user:'Kouamé Diallo',details:'Devis pro forma envoyé',type:'note'},
    ]},
  { id:'c12', name:'SIB — Société Ivorienne de Banque', sector:'Finance & Banque', contactName:'M. Kpan Noël', email:'daf@sib.ci', phone:'+225 2720 900000', address:"Avenue Franchet d'Esperey, Plateau", city:'Abidjan', status:'actif', createdAt:'2023-05-15', contracts:2, totalRevenue:12000000,
    history:[{id:'h1',date:'2023-05-15',action:'Client créé',user:'Admin',details:'Référencé par Ecobank',type:'create'}]},
];

export const sites: Site[] = [
  {id:'s1',name:'NSIA Banque — Siège Plateau',clientId:'c1',clientName:'NSIA Banque CI',address:'Avenue Terrasson de Fougères',city:'Abidjan',district:'Plateau',agentsDeployed:4,contractId:'ct1',status:'actif',riskLevel:'eleve'},
  {id:'s2',name:'NSIA Banque — Agence Cocody',clientId:'c1',clientName:'NSIA Banque CI',address:'Rue des Jardins, Cocody',city:'Abidjan',district:'Cocody',agentsDeployed:2,contractId:'ct1',status:'actif',riskLevel:'moyen'},
  {id:'s3',name:"Orange CI — Siège Social",clientId:'c2',clientName:"Orange Côte d'Ivoire",address:'Bld du Général de Gaulle',city:'Abidjan',district:'Cocody',agentsDeployed:6,contractId:'ct2',status:'actif',riskLevel:'eleve'},
  {id:'s4',name:'Orange CI — Data Center',clientId:'c2',clientName:"Orange Côte d'Ivoire",address:'Zone Industrielle Marcory',city:'Abidjan',district:'Marcory',agentsDeployed:4,contractId:'ct2',status:'actif',riskLevel:'eleve'},
  {id:'s5',name:'Ecobank — Agence Plateau',clientId:'c3',clientName:"Ecobank Côte d'Ivoire",address:'Avenue Joseph Anoma',city:'Abidjan',district:'Plateau',agentsDeployed:3,contractId:'ct3',status:'actif',riskLevel:'eleve'},
  {id:'s6',name:'Hôtel Ivoire — Périmètre',clientId:'c4',clientName:'Hôtel Ivoire Sofitel',address:'Boulevard Hassan II',city:'Abidjan',district:'Cocody',agentsDeployed:8,contractId:'ct4',status:'actif',riskLevel:'moyen'},
  {id:'s7',name:'INFLUO Media — Yopougon',clientId:'c5',clientName:'INFLUO Media',address:'Cité Verte, Yopougon',city:'Abidjan',district:'Yopougon',agentsDeployed:2,contractId:'ct5',status:'actif',riskLevel:'faible'},
  {id:'s8',name:'Playce Marcory — Centre Commercial',clientId:'c6',clientName:'Playce Marcory',address:'Boulevard de Marseille',city:'Abidjan',district:'Marcory',agentsDeployed:10,contractId:'ct6',status:'actif',riskLevel:'moyen'},
  {id:'s9',name:'PIC — Entrée Principale',clientId:'c7',clientName:'Polyclinique Internationale',address:'Rue des Jardins, Angré',city:'Abidjan',district:'Cocody',agentsDeployed:4,contractId:'ct7',status:'actif',riskLevel:'moyen'},
  {id:'s10',name:"MTN CI — Tour MTN",clientId:'c8',clientName:"MTN Côte d'Ivoire",address:'Boulevard Latrille',city:'Abidjan',district:'Cocody',agentsDeployed:5,contractId:'ct8',status:'actif',riskLevel:'eleve'},
  {id:'s11',name:'UFHB — Campus Principal',clientId:'c9',clientName:'Université FHB',address:'Route de la Corniche',city:'Abidjan',district:'Cocody',agentsDeployed:6,contractId:'ct9',status:'actif',riskLevel:'faible'},
  {id:'s12',name:'SIB — Agence Plateau',clientId:'c12',clientName:'SIB',address:"Avenue Franchet d'Esperey",city:'Abidjan',district:'Plateau',agentsDeployed:3,contractId:'ct10',status:'actif',riskLevel:'eleve'},
];

export const contracts: Contract[] = [
  {id:'ct1',reference:'SAG-CT-2301',clientId:'c1',clientName:'NSIA Banque CI',siteId:'s1',siteName:'NSIA Banque — Multi-sites',type:'Gardiennage armé',nbAgents:6,startDate:'2023-04-01',endDate:'2025-03-31',monthlyAmount:1800000,status:'actif',description:'Surveillance et contrôle accès pour 2 agences bancaires. Agents armés 24h/24.',
    history:[
      {id:'h1',date:'2023-04-01',action:'Contrat activé',user:'Admin',details:'Signature et démarrage effectif',type:'create'},
      {id:'h2',date:'2024-01-10',action:'Révision tarifaire',user:'Admin',details:'Montant ajusté à 1 800 000 XOF/mois',type:'update'},
    ]},
  {id:'ct2',reference:'SAG-CT-2208',clientId:'c2',clientName:"Orange Côte d'Ivoire",siteId:'s3',siteName:'Orange CI — Siège + Data Center',type:"Gardiennage & Contrôle d'accès",nbAgents:10,startDate:'2022-12-01',endDate:'2024-11-30',monthlyAmount:3000000,status:'renouvellement',description:'Protection périmétrique siège et data center. Gestion badges et contrôle accès biométrique.',
    history:[
      {id:'h1',date:'2022-12-01',action:'Contrat activé',user:'Admin',details:'Démarrage 10 agents',type:'create'},
      {id:'h2',date:'2024-10-01',action:'Avis renouvellement',user:'Système',details:'Contrat expire le 30/11/2024',type:'status'},
    ]},
  {id:'ct3',reference:'SAG-CT-2312',clientId:'c3',clientName:"Ecobank Côte d'Ivoire",siteId:'s5',siteName:'Ecobank — 4 agences Abidjan',type:'Gardiennage armé multi-sites',nbAgents:12,startDate:'2023-07-15',endDate:'2025-07-14',monthlyAmount:2400000,status:'actif',description:'Sécurisation 4 agences bancaires. Agents armés + vidéosurveillance.',
    history:[{id:'h1',date:'2023-07-15',action:'Contrat activé',user:'Admin',details:'Démarrage simultané 4 sites',type:'create'}]},
  {id:'ct4',reference:'SAG-CT-2209',clientId:'c4',clientName:'Hôtel Ivoire Sofitel',siteId:'s6',siteName:'Hôtel Ivoire — Sécurité Périmétrique',type:'Gardiennage & Ronde',nbAgents:8,startDate:'2022-09-01',endDate:null,monthlyAmount:1200000,status:'actif',description:'Surveillance périmètre hôtel, gestion accès visiteurs et rondes nocturnes.',
    history:[{id:'h1',date:'2022-09-01',action:'Contrat activé',user:'Admin',details:'Contrat CDI sans date de fin',type:'create'}]},
  {id:'ct5',reference:'SAG-CT-2402',clientId:'c5',clientName:'INFLUO Media',siteId:'s7',siteName:'INFLUO Media — Yopougon',type:'Gardiennage',nbAgents:2,startDate:'2024-02-16',endDate:'2025-02-15',monthlyAmount:300000,status:'actif',description:'Surveillance locaux agence communication — faction journée.',
    history:[{id:'h1',date:'2024-02-16',action:'Contrat activé',user:'Admin',details:'2 ASJ en faction',type:'create'}]},
  {id:'ct6',reference:'SAG-CT-2301B',clientId:'c6',clientName:'Playce Marcory',siteId:'s8',siteName:'Playce Marcory — Centre Commercial',type:'Sécurité & Gardiennage',nbAgents:10,startDate:'2023-02-01',endDate:'2025-01-31',monthlyAmount:1600000,status:'actif',description:'Sécurisation centre commercial — contrôle accès, surveillance et gestion foules.',
    history:[{id:'h1',date:'2023-02-01',action:'Contrat activé',user:'Admin',details:'10 agents dont 2 armés',type:'create'}]},
  {id:'ct7',reference:'SAG-CT-2310',clientId:'c7',clientName:'Polyclinique Internationale',siteId:'s9',siteName:'PIC — Entrée Principale',type:'Gardiennage',nbAgents:4,startDate:'2023-10-01',endDate:'2025-09-30',monthlyAmount:800000,status:'actif',description:'Contrôle accès et surveillance clinique privée 24h.',
    history:[{id:'h1',date:'2023-10-01',action:'Contrat activé',user:'Admin',details:'4 agents en rotation',type:'create'}]},
  {id:'ct8',reference:'SAG-CT-2206',clientId:'c8',clientName:"MTN Côte d'Ivoire",siteId:'s10',siteName:"MTN CI — Multi-sites",type:'Gardiennage & Sécurité Électronique',nbAgents:15,startDate:'2022-06-01',endDate:'2025-05-31',monthlyAmount:3600000,status:'actif',description:'Protection tour MTN et entrepôts techniques. Agents armés + caméras.',
    history:[{id:'h1',date:'2022-06-01',action:'Contrat activé',user:'Admin',details:'15 agents multi-sites',type:'create'}]},
];

export const agents: Agent[] = [
  {id:'ag1',firstName:'Kouamé',lastName:'Bogui',matricule:'SAG-AG-001',position:'Agent Sécurité Nuit Armé',phone:'+225 0707 112233',email:'k.bogui@sagard.ci',siteId:'s1',siteName:'NSIA Banque — Siège',status:'actif',hireDate:'2021-03-01',shift:'nuit',certifications:['FKNS Armé','Secourisme SST']},
  {id:'ag2',firstName:'Aya',lastName:'Coulibaly',matricule:'SAG-AG-002',position:'Chef de Poste',phone:'+225 0708 223344',email:'a.coulibaly@sagard.ci',siteId:'s1',siteName:'NSIA Banque — Siège',status:'actif',hireDate:'2020-06-15',shift:'jour',certifications:['Chef de Poste Certifié','FKNS Armé']},
  {id:'ag3',firstName:'Souleymane',lastName:'Ouédraogo',matricule:'SAG-AG-003',position:'Agent Sécurité Jour',phone:'+225 0502 334455',email:'s.ouedraogo@sagard.ci',siteId:'s3',siteName:'Orange CI — Siège',status:'actif',hireDate:'2022-01-10',shift:'jour',certifications:['FKNS']},
  {id:'ag4',firstName:'Mariam',lastName:'Diallo',matricule:'SAG-AG-004',position:'Agent Sécurité Nuit Armée',phone:'+225 0101 445566',email:'m.diallo@sagard.ci',siteId:'s6',siteName:'Hôtel Ivoire',status:'actif',hireDate:'2022-10-01',shift:'nuit',certifications:['FKNS Armé','Gestion de crise']},
  {id:'ag5',firstName:'Ibrahim',lastName:'Cissé',matricule:'SAG-AG-005',position:'Agent de Sécurité Jour',phone:'+225 0505 556677',email:'i.cisse@sagard.ci',siteId:'s8',siteName:'Playce Marcory',status:'actif',hireDate:'2023-03-15',shift:'jour',certifications:['FKNS']},
  {id:'ag6',firstName:'Fatou',lastName:'Sanogo',matricule:'SAG-AG-006',position:'Agent de Ronde',phone:'+225 0777 667788',email:'f.sanogo@sagard.ci',siteId:'s6',siteName:'Hôtel Ivoire',status:'actif',hireDate:'2021-07-01',shift:'nuit',certifications:['FKNS','Secourisme SST']},
  {id:'ag7',firstName:'Yaya',lastName:'Konaté',matricule:'SAG-AG-007',position:'Chef de Poste',phone:'+225 0101 778899',email:'y.konate@sagard.ci',siteId:'s8',siteName:'Playce Marcory',status:'actif',hireDate:'2020-09-01',shift:'mixte',certifications:['Chef de Poste Certifié']},
  {id:'ag8',firstName:'Aminata',lastName:'Touré',matricule:'SAG-AG-008',position:'Agent Sécurité Jour',phone:'+225 0505 889900',email:'a.toure@sagard.ci',siteId:'s9',siteName:'PIC — Entrée',status:'actif',hireDate:'2023-11-01',shift:'jour',certifications:['FKNS']},
  {id:'ag9',firstName:'Brice',lastName:'Ahoussou',matricule:'SAG-AG-009',position:'Agent Sécurité Nuit',phone:'+225 0102 990011',email:'b.ahoussou@sagard.ci',siteId:'s5',siteName:'Ecobank — Plateau',status:'actif',hireDate:'2023-08-15',shift:'nuit',certifications:['FKNS Armé']},
  {id:'ag10',firstName:'Clarisse',lastName:'Gnago',matricule:'SAG-AG-010',position:'Agent Sécurité Jour',phone:'+225 0708 001122',email:'c.gnago@sagard.ci',siteId:'s7',siteName:'INFLUO Media',status:'actif',hireDate:'2024-02-16',shift:'jour',certifications:['FKNS']},
  {id:'ag11',firstName:'Dramane',lastName:'Coulibaly',matricule:'SAG-AG-011',position:'Agent Armé',phone:'+225 0101 112233',email:'d.coulibaly@sagard.ci',siteId:'s10',siteName:'MTN CI — Tour',status:'actif',hireDate:'2022-06-01',shift:'nuit',certifications:['FKNS Armé','Tir Défensif']},
  {id:'ag12',firstName:'Rosalie',lastName:'Akaffou',matricule:'SAG-AG-012',position:'Agent Sécurité Jour',phone:'+225 0202 223344',email:'r.akaffou@sagard.ci',siteId:null,siteName:null,status:'formation',hireDate:'2024-04-01',shift:'jour',certifications:[]},
  {id:'ag13',firstName:'Moussa',lastName:'Traoré',matricule:'SAG-AG-013',position:'Agent Sécurité Nuit',phone:'+225 0303 334455',email:'m.traore@sagard.ci',siteId:'s11',siteName:'UFHB — Campus',status:'actif',hireDate:'2023-03-01',shift:'nuit',certifications:['FKNS']},
  {id:'ag14',firstName:'Victorine',lastName:'Konan',matricule:'SAG-AG-014',position:'Chef de Poste',phone:'+225 0404 445566',email:'v.konan@sagard.ci',siteId:'s3',siteName:'Orange CI — Siège',status:'actif',hireDate:'2021-11-01',shift:'mixte',certifications:['Chef de Poste Certifié','FKNS Armé']},
  {id:'ag15',firstName:'Adama',lastName:'Kouyaté',matricule:'SAG-AG-015',position:'Agent Armé',phone:'+225 0505 556677',email:'a.kouyate@sagard.ci',siteId:'s12',siteName:'SIB — Plateau',status:'conge',hireDate:'2022-04-01',shift:'jour',certifications:['FKNS Armé']},
];

export const invoices: Invoice[] = [
  {id:'inv1',reference:'SAG-202405-0018',clientId:'c1',clientName:'NSIA Banque CI',clientAddress:'Avenue Terrasson de Fougères, Plateau',clientCity:'Abidjan',contractId:'ct1',contractRef:'SAG-CT-2301',issueDate:'2024-05-01',dueDate:'2024-05-15',deliveryDate:'2024-05-01',status:'payee',totalAmount:1800000,paidAt:'2024-05-12',notes:'Paiement reçu par virement bancaire.',
    lines:[
      {id:'l1',code:'ASJ',description:'Agent de Sécurité Jour',details:'Faction diurne 8h-20h',quantity:3,unitPrice:400000,discount:0},
      {id:'l2',code:'ASNA',description:'Agent de Sécurité Nuit Armé',details:'Faction nocturne 20h-8h',quantity:3,unitPrice:200000,discount:0},
    ],
    history:[
      {id:'h1',date:'2024-05-01',action:'Facture créée',user:'Admin',details:'Génération automatique — mois de mai 2024',type:'create'},
      {id:'h2',date:'2024-05-12',action:'Paiement reçu',user:'Système',details:'Virement NSIA — 1 800 000 XOF',type:'payment'},
    ]},
  {id:'inv2',reference:'SAG-202405-0019',clientId:'c2',clientName:"Orange Côte d'Ivoire",clientAddress:"Bld du Général de Gaulle, Cocody",clientCity:'Abidjan',contractId:'ct2',contractRef:'SAG-CT-2208',issueDate:'2024-05-01',dueDate:'2024-05-20',deliveryDate:'2024-05-01',status:'payee',totalAmount:3000000,paidAt:'2024-05-18',notes:'',
    lines:[
      {id:'l1',code:'ASJ',description:'Agent de Sécurité Jour',details:'Surveillance périmétrique',quantity:5,unitPrice:300000,discount:0},
      {id:'l2',code:'ASNA',description:'Agent Sécurité Nuit Armé',details:'Faction nocturne',quantity:5,unitPrice:300000,discount:0},
    ],
    history:[
      {id:'h1',date:'2024-05-01',action:'Facture créée',user:'Admin',details:'Génération mai 2024',type:'create'},
      {id:'h2',date:'2024-05-18',action:'Paiement reçu',user:'Système',details:'Virement Orange — 3 000 000 XOF',type:'payment'},
    ]},
  {id:'inv3',reference:'SAG-202405-0020',clientId:'c3',clientName:"Ecobank Côte d'Ivoire",clientAddress:'Avenue Joseph Anoma, Plateau',clientCity:'Abidjan',contractId:'ct3',contractRef:'SAG-CT-2312',issueDate:'2024-05-01',dueDate:'2024-05-15',deliveryDate:'2024-05-01',status:'retard',totalAmount:2400000,paidAt:null,notes:'Relance envoyée le 20/05/2024.',
    lines:[
      {id:'l1',code:'ASNA',description:'Agent Sécurité Nuit Armé',details:'Multi-agences',quantity:6,unitPrice:200000,discount:0},
      {id:'l2',code:'CP',description:'Chef de Poste',details:'Coordination 4 sites',quantity:2,unitPrice:300000,discount:0},
    ],
    history:[
      {id:'h1',date:'2024-05-01',action:'Facture créée',user:'Admin',details:'Génération mai 2024',type:'create'},
      {id:'h2',date:'2024-05-20',action:'Relance',user:'Admin',details:'Email de relance envoyé — pas de réponse',type:'note'},
    ]},
  {id:'inv4',reference:'SAG-PF2403',clientId:'c5',clientName:'INFLUO Media',clientAddress:'Cité Verte, Yopougon',clientCity:'Abidjan',contractId:'ct5',contractRef:'SAG-CT-2402',issueDate:'2024-02-16',dueDate:'2024-02-23',deliveryDate:'2024-02-16',status:'payee',totalAmount:600000,paidAt:'2024-02-22',notes:'Facture pro forma — service de gardiennage.',
    lines:[
      {id:'l1',code:'ASJ',description:'Agent de Sécurité Jour',details:'Agent de Sécurité Jour',quantity:2,unitPrice:140000,discount:0},
      {id:'l2',code:'ASNA',description:'Agent de Sécurité de Nuit Armés',details:'Agent de Sécurité de Nuit Armés',quantity:2,unitPrice:160000,discount:0},
    ],
    history:[
      {id:'h1',date:'2024-02-16',action:'Facture créée',user:'Admin',details:'Pro forma INFLUO Media',type:'create'},
      {id:'h2',date:'2024-02-22',action:'Paiement reçu',user:'Système',details:'Espèces — 600 000 XOF',type:'payment'},
    ]},
  {id:'inv5',reference:'SAG-202406-0021',clientId:'c4',clientName:'Hôtel Ivoire Sofitel',clientAddress:'Boulevard Hassan II, Cocody',clientCity:'Abidjan',contractId:'ct4',contractRef:'SAG-CT-2209',issueDate:'2024-06-01',dueDate:'2024-06-15',deliveryDate:'2024-06-01',status:'envoyee',totalAmount:1200000,paidAt:null,notes:'',
    lines:[
      {id:'l1',code:'AG-RONDE',description:'Agent de Ronde Nocturne',details:'Rondes périmètre hôtel',quantity:4,unitPrice:180000,discount:0},
      {id:'l2',code:'ASJ',description:'Agent de Sécurité Jour',details:'Contrôle accès entrée',quantity:4,unitPrice:120000,discount:0},
    ],
    history:[
      {id:'h1',date:'2024-06-01',action:'Facture créée',user:'Admin',details:'Génération juin 2024',type:'create'},
      {id:'h2',date:'2024-06-02',action:'Envoyée',user:'Admin',details:'Email envoyé à gm@hotelivoire.ci',type:'document'},
    ]},
  {id:'inv6',reference:'SAG-202406-0022',clientId:'c6',clientName:'Playce Marcory',clientAddress:'Boulevard de Marseille, Marcory',clientCity:'Abidjan',contractId:'ct6',contractRef:'SAG-CT-2301B',issueDate:'2024-06-01',dueDate:'2024-06-20',deliveryDate:'2024-06-01',status:'retard',totalAmount:1600000,paidAt:null,notes:'2ème relance envoyée.',
    lines:[
      {id:'l1',code:'ASJ',description:'Agent de Sécurité Jour',details:'Surveillance centre commercial',quantity:6,unitPrice:160000,discount:0},
      {id:'l2',code:'CP',description:'Chef de Poste',details:'Coordination',quantity:1,unitPrice:340000,discount:0},
      {id:'l3',code:'ASNA',description:'Agent Sécurité Nuit',details:'Faction nocturne',quantity:3,unitPrice:120000,discount:0},
    ],
    history:[
      {id:'h1',date:'2024-06-01',action:'Facture créée',user:'Admin',details:'Génération juin 2024',type:'create'},
      {id:'h2',date:'2024-06-22',action:'1ère relance',user:'Admin',details:'Email envoyé',type:'note'},
      {id:'h3',date:'2024-07-01',action:'2ème relance',user:'Admin',details:'Appel téléphonique + email',type:'note'},
    ]},
  {id:'inv7',reference:'SAG-202406-0023',clientId:'c8',clientName:"MTN Côte d'Ivoire",clientAddress:'Boulevard Latrille, Cocody',clientCity:'Abidjan',contractId:'ct8',contractRef:'SAG-CT-2206',issueDate:'2024-06-01',dueDate:'2024-06-30',deliveryDate:'2024-06-01',status:'payee',totalAmount:3600000,paidAt:'2024-06-25',notes:'',
    lines:[
      {id:'l1',code:'ASNA',description:'Agent Sécurité Nuit Armé',details:'Tour MTN + entrepôts',quantity:8,unitPrice:200000,discount:0},
      {id:'l2',code:'ASJ',description:'Agent Sécurité Jour',details:'Accueil et contrôle',quantity:7,unitPrice:200000,discount:0},
    ],
    history:[
      {id:'h1',date:'2024-06-01',action:'Facture créée',user:'Admin',details:'Génération juin 2024',type:'create'},
      {id:'h2',date:'2024-06-25',action:'Paiement reçu',user:'Système',details:'Virement MTN — 3 600 000 XOF',type:'payment'},
    ]},
  {id:'inv8',reference:'SAG-202407-0024',clientId:'c1',clientName:'NSIA Banque CI',clientAddress:'Avenue Terrasson de Fougères, Plateau',clientCity:'Abidjan',contractId:'ct1',contractRef:'SAG-CT-2301',issueDate:'2024-07-01',dueDate:'2024-07-15',deliveryDate:'2024-07-01',status:'brouillon',totalAmount:1800000,paidAt:null,notes:'En attente de validation.',
    lines:[
      {id:'l1',code:'ASJ',description:'Agent de Sécurité Jour',details:'Faction diurne',quantity:3,unitPrice:400000,discount:0},
      {id:'l2',code:'ASNA',description:'Agent Sécurité Nuit Armé',details:'Faction nocturne',quantity:3,unitPrice:200000,discount:0},
    ],
    history:[
      {id:'h1',date:'2024-07-01',action:'Brouillon créé',user:'Admin',details:'En attente validation direction',type:'create'},
    ]},
];

export const operations: Operation[] = [
  {id:'op1',agentId:'ag1',agentName:'Kouamé Bogui',siteId:'s1',siteName:'NSIA Banque — Siège',contractId:'ct1',date:'2024-07-14',checkIn:'19:58',checkOut:null,shift:'nuit',status:'en_cours',notes:''},
  {id:'op2',agentId:'ag2',agentName:'Aya Coulibaly',siteId:'s1',siteName:'NSIA Banque — Siège',contractId:'ct1',date:'2024-07-14',checkIn:'07:55',checkOut:'20:02',shift:'jour',status:'termine',notes:''},
  {id:'op3',agentId:'ag3',agentName:'Souleymane Ouédraogo',siteId:'s3',siteName:"Orange CI — Siège",contractId:'ct2',date:'2024-07-14',checkIn:'08:10',checkOut:'20:05',shift:'jour',status:'termine',notes:''},
  {id:'op4',agentId:'ag4',agentName:'Mariam Diallo',siteId:'s6',siteName:'Hôtel Ivoire',contractId:'ct4',date:'2024-07-14',checkIn:'20:01',checkOut:null,shift:'nuit',status:'en_cours',notes:''},
  {id:'op5',agentId:'ag5',agentName:'Ibrahim Cissé',siteId:'s8',siteName:'Playce Marcory',contractId:'ct6',date:'2024-07-14',checkIn:'08:30',checkOut:'20:15',shift:'jour',status:'retard',notes:'Arrivée 30 min en retard'},
  {id:'op6',agentId:'ag6',agentName:'Fatou Sanogo',siteId:'s6',siteName:'Hôtel Ivoire',contractId:'ct4',date:'2024-07-14',checkIn:'20:00',checkOut:null,shift:'nuit',status:'en_cours',notes:''},
  {id:'op7',agentId:'ag10',agentName:'Clarisse Gnago',siteId:'s7',siteName:'INFLUO Media',contractId:'ct5',date:'2024-07-14',checkIn:'08:00',checkOut:'17:30',shift:'jour',status:'termine',notes:''},
  {id:'op8',agentId:'ag12',agentName:'Rosalie Akaffou',siteId:null,siteName:'Formation FKNS',contractId:'',date:'2024-07-14',checkIn:'08:00',checkOut:'17:00',shift:'jour',status:'termine',notes:'Formation initiale FKNS'},
  {id:'op9',agentId:'ag9',agentName:'Brice Ahoussou',siteId:'s5',siteName:'Ecobank — Plateau',contractId:'ct3',date:'2024-07-13',checkIn:'19:55',checkOut:'08:10',shift:'nuit',status:'termine',notes:''},
  {id:'op10',agentId:'ag11',agentName:'Dramane Coulibaly',siteId:'s10',siteName:'MTN CI — Tour',contractId:'ct8',date:'2024-07-14',checkIn:'20:00',checkOut:null,shift:'nuit',status:'en_cours',notes:''},
];

export const notifications: Notification[] = [
  {id:'n1',type:'invoice_overdue',title:'Facture en retard — Ecobank CI',message:'La facture SAG-202405-0020 (2 400 000 XOF) est en retard de 45 jours.',createdAt:'2024-07-01T09:00:00',read:false,priority:'danger',link:'/facturation/inv3'},
  {id:'n2',type:'invoice_overdue',title:'Facture en retard — Playce Marcory',message:'La facture SAG-202406-0022 (1 600 000 XOF) est en retard de 14 jours. 2ème relance envoyée.',createdAt:'2024-07-05T10:30:00',read:false,priority:'danger',link:'/facturation/inv6'},
  {id:'n3',type:'contract_expiry',title:'Contrat à renouveler — Orange CI',message:'Le contrat SAG-CT-2208 expire le 30/11/2024. Démarrez le processus de renouvellement.',createdAt:'2024-07-10T08:00:00',read:false,priority:'warning',link:'/contrats/ct2'},
  {id:'n4',type:'payment',title:'Paiement reçu — MTN CI',message:'Virement de 3 600 000 XOF reçu pour la facture SAG-202406-0023.',createdAt:'2024-06-25T14:22:00',read:true,priority:'success',link:'/facturation/inv7'},
  {id:'n5',type:'new_client',title:'Nouveau prospect — CFAO Motors',message:'Un nouveau prospect a été ajouté : CFAO Motors CI. Devis en attente.',createdAt:'2024-05-02T11:00:00',read:true,priority:'info',link:'/clients/c11'},
  {id:'n6',type:'incident',title:'Retard agent — Playce Marcory',message:"Ibrahim Cissé a pointé avec 30 min de retard le 14/07/2024 au site Playce Marcory.",createdAt:'2024-07-14T08:35:00',read:false,priority:'warning'},
  {id:'n7',type:'system',title:'Génération factures juillet 2024',message:'8 factures ont été générées automatiquement pour le mois de juillet 2024.',createdAt:'2024-07-01T06:00:00',read:true,priority:'info'},
];

export const revenueData = [
  {month:'Jan',revenue:8200000,target:8000000},
  {month:'Fév',revenue:9100000,target:8500000},
  {month:'Mar',revenue:8750000,target:9000000},
  {month:'Avr',revenue:10200000,target:9500000},
  {month:'Mai',revenue:11600000,target:10000000},
  {month:'Juin',revenue:10800000,target:10500000},
  {month:'Juil',revenue:9500000,target:11000000},
];

export const agentStatusData = [
  {name:'En poste',value:11,color:'#C8D400'},
  {name:'En formation',value:2,color:'#3b82f6'},
  {name:'En congé',value:1,color:'#f59e0b'},
  {name:'Inactif',value:1,color:'#ef4444'},
];

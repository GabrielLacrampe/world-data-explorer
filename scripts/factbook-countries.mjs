/**
 * Country tables for the CIA World Factbook JSON mirror
 * (https://github.com/factbook/factbook.json).
 *
 * Shared by fetch-factbook.mjs and fetch-military.mjs — the mirror addresses
 * countries by region folder + two-letter CIA (FIPS 10-4) code, which is not
 * ISO 3166 and puts a few countries in surprising folders (Russia sits under
 * central-asia, Egypt and Libya under africa).
 *
 * COUNTRY_FILES mirrors the repository's actual folder listing. CIA_TO_ISO2
 * was derived by matching each file's "conventional short/long form" country
 * name against the world-countries package, so beware of the near-collisions
 * it resolves: ma=Madagascar vs mo=Morocco, mg=Mongolia, ng=Niger vs
 * ni=Nigeria, ns=Suriname, od=South Sudan, vi=British vs vq=US Virgin Islands.
 *
 * Codes with no ISO 3166 country of their own (Ashmore and Cartier, Coral Sea
 * Islands, Wake Island, Navassa, Paracel/Spratly, Akrotiri, Dhekelia, Jan
 * Mayen, Clipperton, Gaza, and the EU entry) are deliberately absent — callers
 * must skip a code that is not in this table rather than guess an ISO code
 * from it, since e.g. CIA "tl" is Tokelau but ISO "TL" is Timor-Leste.
 */

export const BASE_RAW = 'https://raw.githubusercontent.com/factbook/factbook.json/master'

export const COUNTRY_FILES = {
  'africa': ['ag','ao','bc','bn','by','cd','cf','cg','cm','cn','ct','cv','dj','eg','ek','er','et','ga',
             'gb','gh','gv','iv','ke','li','lt','ly','ma','mi','ml','mo','mp','mr','mz','ng','ni','od',
             'pu','rw','se','sf','sg','sh','sl','so','su','to','tp','ts','tz','ug','uv','wa','wi','wz',
             'za','zi'],
  'australia-oceania': ['aq','as','at','bp','ck','cq','cr','cw','fj','fm','fp','gq','kr','kt','nc','ne',
                        'nf','nh','nr','nz','pc','ps','rm','tl','tn','tv','um','wf','wq','ws'],
  'central-america-n-caribbean': ['aa','ac','av','bb','bf','bh','bq','cj','cs','cu','do','dr','es','gj',
                                  'gt','ha','ho','jm','mh','nn','nu','pm','rn','rq','sc','st','tb','td',
                                  'tk','uc','vc','vi','vq'],
  'central-asia': ['aj','am','gg','kg','kz','rs','ti','tx','uz'],
  'east-n-southeast-asia': ['bm','bx','cb','ch','hk','id','ja','kn','ks','la','mc','mg','my','pf','pg',
                            'pp','rp','sn','th','tt','tw','vm'],
  'europe': ['al','an','au','ax','be','bk','bo','bu','cy','da','dx','ee','ei','en','ez','fi','fo','fr',
             'gi','gk','gm','gr','hr','hu','ic','im','it','je','jn','kv','lg','lh','lo','ls','lu','md',
             'mj','mk','mn','mt','nl','no','pl','po','ri','ro','si','sm','sp','sv','sw','sz','uk','up',
             'vt'],
  'middle-east': ['ae','ba','gz','ir','is','iz','jo','ku','le','mu','qa','sa','sy','tu','we','ym'],
  'north-america': ['bd','ca','gl','ip','mx','sb','us'],
  'south-america': ['ar','bl','br','ci','co','ec','fk','gy','ns','pa','pe','sx','uy','ve'],
  'south-asia': ['af','bg','bt','ce','in','io','mv','np','pk'],
}

export const CIA_TO_ISO2 = {
  'aa':'AW','ac':'AG','ae':'AE','af':'AF','ag':'DZ','aj':'AZ','al':'AL','am':'AM','an':'AD','ao':'AO',
  'aq':'AS','ar':'AR','as':'AU','au':'AT','av':'AI','ba':'BH','bb':'BB','bc':'BW','bd':'BM','be':'BE',
  'bf':'BS','bg':'BD','bh':'BZ','bk':'BA','bl':'BO','bm':'MM','bn':'BJ','bo':'BY','bp':'SB','br':'BR',
  'bt':'BT','bu':'BG','bx':'BN','by':'BI','ca':'CA','cb':'KH','cd':'TD','ce':'LK','cf':'CG','cg':'CD',
  'ch':'CN','ci':'CL','cj':'KY','ck':'CC','cm':'CM','cn':'KM','co':'CO','cq':'MP','cs':'CR','ct':'CF',
  'cu':'CU','cv':'CV','cw':'CK','cy':'CY','da':'DK','dj':'DJ','do':'DM','dr':'DO','ec':'EC','eg':'EG',
  'ei':'IE','ek':'GQ','en':'EE','er':'ER','es':'SV','et':'ET','ez':'CZ','fi':'FI','fj':'FJ','fk':'FK',
  'fm':'FM','fo':'FO','fp':'PF','fr':'FR','ga':'GM','gb':'GA','gg':'GE','gh':'GH','gi':'GI','gj':'GD',
  'gk':'GG','gl':'GL','gm':'DE','gq':'GU','gr':'GR','gt':'GT','gv':'GN','gy':'GY','ha':'HT','hk':'HK',
  'ho':'HN','hr':'HR','hu':'HU','ic':'IS','id':'ID','im':'IM','in':'IN','io':'IO','ir':'IR','is':'IL',
  'it':'IT','iv':'CI','iz':'IQ','ja':'JP','je':'JE','jm':'JM','jo':'JO','ke':'KE','kg':'KG','kn':'KP',
  'kr':'KI','ks':'KR','kt':'CX','ku':'KW','kv':'XK','kz':'KZ','la':'LA','le':'LB','lg':'LV','lh':'LT',
  'li':'LR','lo':'SK','ls':'LI','lt':'LS','lu':'LU','ly':'LY','ma':'MG','mc':'MO','md':'MD','mg':'MN',
  'mh':'MS','mi':'MW','mj':'ME','mk':'MK','ml':'ML','mn':'MC','mo':'MA','mp':'MU','mr':'MR','mt':'MT',
  'mu':'OM','mv':'MV','mx':'MX','my':'MY','mz':'MZ','nc':'NC','ne':'NU','nf':'NF','ng':'NE','nh':'VU',
  'ni':'NG','nl':'NL','nn':'SX','no':'NO','np':'NP','nr':'NR','ns':'SR','nu':'NI','nz':'NZ','od':'SS',
  'pa':'PY','pc':'PN','pe':'PE','pk':'PK','pl':'PL','pm':'PA','po':'PT','pp':'PG','ps':'PW','pu':'GW',
  'qa':'QA','ri':'RS','rm':'MH','rn':'MF','ro':'RO','rp':'PH','rq':'PR','rs':'RU','rw':'RW','sa':'SA',
  'sb':'PM','sc':'KN','se':'SC','sf':'ZA','sg':'SN','sh':'SH','si':'SI','sl':'SL','sm':'SM','sn':'SG',
  'so':'SO','sp':'ES','st':'LC','su':'SD','sv':'SJ','sw':'SE','sx':'GS','sy':'SY','sz':'CH','tb':'BL',
  'td':'TT','th':'TH','ti':'TJ','tk':'TC','tl':'TK','tn':'TO','to':'TG','tp':'ST','ts':'TN','tt':'TL',
  'tu':'TR','tv':'TV','tw':'TW','tx':'TM','tz':'TZ','uc':'CW','ug':'UG','uk':'GB','um':'UM','up':'UA',
  'us':'US','uv':'BF','uy':'UY','uz':'UZ','vc':'VC','ve':'VE','vi':'VG','vm':'VN','vq':'VI','vt':'VA',
  'wa':'NA','we':'PS','wf':'WF','wi':'EH','ws':'WS','wz':'SZ','ym':'YE','za':'ZM','zi':'ZW',
}

export async function fetchFactbookJson(region, code) {
  const r = await fetch(`${BASE_RAW}/${region}/${code}.json`, {
    headers: { 'User-Agent': 'WorldDataExplorer/1.0' },
  })
  if (!r.ok) return null
  try { return await r.json() } catch { return null }
}

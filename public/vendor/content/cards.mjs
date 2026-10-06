// ERULDIN: YANKILAR — content data (cards, echoes, chapters)
import {POOL, POOL_TOKENS} from './pool.mjs';
// Turkish is canonical; English in `en`. Every card's lore hook is annotated
// with its source layer: [M] book, [L] lore, [A] atlas synthesis, [D] design.

export const KEYWORDS = {
  dayanikli: {tr: 'Dayanıklı', en: 'Tough',      hint: {tr: 'Aldığı her hasar 1 azalır.', en: 'Takes 1 less damage from each source.'}},
  golge:     {tr: 'Gölge',     en: 'Shadow',     hint: {tr: 'Yalnızca Gölge birimlerle savunulabilir.', en: 'Can only be blocked by Shadow units.'}},
  cabuk:     {tr: 'Çabuk',     en: 'Quick',      hint: {tr: 'Savunandan önce vurur; savunanı öldürürse karşı darbe almaz.', en: 'Strikes before its blocker; takes no counterstrike if it kills.'}},
  ezici:     {tr: 'Ezici',     en: 'Crushing',   hint: {tr: 'Savunanı aşan hasar rakip avatara işler.', en: 'Excess damage over the blocker hits the enemy avatar.'}},
  celik:     {tr: 'Teom Çeliği', en: 'Teomsteel', hint: {tr: 'Yozlaşmaya dokunmaz; Karahlara karşı +2 hasar.', en: 'Immune to Corruption; +2 damage against Karah.'}},
  yanki:     {tr: 'Yankı',     en: 'Echo',       hint: {tr: 'Öldüğünde gelecek tur zayıf yankısı ele döner.', en: 'On death a weakened echo returns to hand next round.'}},
  sonNefes:  {tr: 'Son Nefes', en: 'Last Breath', hint: {tr: 'Öldüğünde etkisi çalışır.', en: 'Its effect triggers on death.'}},
  cagri:     {tr: 'Çağrı',     en: 'Call',       hint: {tr: 'Oynandığında etkisi çalışır.', en: 'Its effect triggers when played.'}},
  koruyucu:  {tr: 'Koruyucu',  en: 'Guard',      hint: {tr: 'Savunulmayan saldırılar avatar yerine bu birime sapar.', en: 'Unblocked attackers strike this unit instead of the avatar.'}},
  canavar:   {tr: 'Sömürü',    en: 'Siphon',     hint: {tr: 'Verdiği savaş hasarı kadar avatarını iyileştirir.', en: 'Heals its avatar by the combat damage it deals.'}},
  saldiri:   {tr: 'Saldırı',   en: 'Assault',    hint: {tr: 'Taarruz ilan edildiğinde etkisi çalışır.', en: 'Its effect triggers when it is declared as an attacker.'}},
  turSonu:   {tr: 'Devriye',   en: 'Vigil',      hint: {tr: 'Her tur başında etkisi çalışır.', en: 'Its effect triggers at the start of each of your rounds.'}},
  olustur:   {tr: 'Av',        en: 'Hunt',       hint: {tr: 'Bir birimi öldürdüğünde etkisi çalışır.', en: 'Its effect triggers when it kills a unit.'}},
};

export const GROUPS = {
  direnis: {tr: 'Koru / Direniş', en: 'Hearth / Resistance', color: '#E0A150'},
  konsey:  {tr: 'Konsey / Kızıl', en: 'Council / Red',       color: '#B3141F'},
  karah:   {tr: 'Karah / Yozlaşma', en: 'Karah / Corruption', color: '#6B2FA3'},
  teom:    {tr: 'Teom / Göz',     en: 'Teom / The Eye',      color: '#7EADB7'},
  notr:    {tr: 'Kül Tarlaları',  en: 'Ash Fields',          color: '#8D8F8A'},
  serseri: {tr: 'Sis Çetesi',     en: 'Mist Gang',           color: '#5E6E7E'},
  av:      {tr: 'Bozkır Avı',     en: 'Steppe Hunt',         color: '#8A5A2B'},
  ruh:     {tr: 'Yankıcılar',     en: 'The Echo-Touched',    color: '#7C6BC4'},
};

export const RARITIES = {
  common:    {tr: 'Sıradan',   en: 'Common',    color: '#9aa5a4', weight: 55},
  rare:      {tr: 'Nadir',     en: 'Rare',      color: '#4f8fd0', weight: 28},
  epic:      {tr: 'Destansı',  en: 'Epic',      color: '#9a5fd0', weight: 13},
  legendary: {tr: 'Efsanevi',  en: 'Legendary', color: '#d9a13b', weight: 4},
};

// kind: unit | hero | spell   speed (spell): yavas | hizli | ani
// effects/cagri/sonNefes use the engine's declarative effect DSL.
const BASE_CARDS = [
  // ---------------- Direniş / Koru ----------------
  {
    id: 'akhenten', kind: 'hero', group: 'direnis', cost: 5, atk: 5, hp: 5,
    kw: ['dayanikli', 'cagri'],
    cagri: [{t: 'heal', target: 'all-friendly-units', n: 2}, {t: 'heal', target: 'self-avatar', n: 2}],
    name: {tr: 'Akhenten, Koru Kurucusu', en: 'Akhenten, Founder of the Hearth'},
    text: {tr: 'Çağrı: Tüm dost birimleri ve avatarını 2 iyileştir.', en: 'Call: Heal all friendly units and your avatar 2.'},
    flavor: {tr: '"Ruhum daha çocuk, ama bu taşlar eski."' , en: '"My soul is still a child, but these stones are old."'},
    art: 'akhenten.png', spoiler: 'free', src: '[M3]',
  },
  {
    id: 'torg', kind: 'unit', group: 'direnis', cost: 2, atk: 2, hp: 3,
    kw: ['cagri'],
    cagri: [{t: 'hatira', n: 1}],
    name: {tr: 'Genç Torg', en: 'Young Torg'},
    text: {tr: 'Çağrı: 1 Hatıra kazan.', en: 'Call: Gain 1 Memory.'},
    flavor: {tr: 'Kaçış tünellerini o gösterdi.', en: 'He showed them the escape tunnels.'},
    art: 'torg.png', spoiler: 'free', src: '[M3]',
  },
  {
    id: 'gorn', kind: 'unit', group: 'direnis', cost: 4, atk: 4, hp: 4,
    kw: ['cagri'], needsTarget: 'ally-unit',
    cagri: [{t: 'give-kw', target: 'target-unit', kw: 'celik'}],
    name: {tr: 'Gorn, Demirhane Ustası', en: 'Gorn, Forge Master'},
    text: {tr: 'Çağrı: Bir dost birime Teom Çeliği kazandır.', en: 'Call: Grant an ally unit Teomsteel.'},
    flavor: {tr: 'Kırık bileklere eldiven dövdü.', en: 'He forged gauntlets for broken wrists.'},
    art: 'gorn.png', spoiler: 'free', src: '[M5]',
  },
  {
    id: 'borin', kind: 'unit', group: 'direnis', cost: 3, atk: 3, hp: 3,
    kw: ['dayanikli'],
    name: {tr: 'Borin, Koru Muhafızı', en: 'Borin, Hearth Warden'},
    text: {tr: '', en: ''},
    flavor: {tr: 'Saygıyla karşıladı; emirle kırdı.', en: 'He greeted with respect; he broke on orders.'},
    art: 'borin.png', spoiler: 'free', src: '[M3]',
  },
  {
    id: 'koru-muhafiz', kind: 'unit', group: 'direnis', cost: 1, atk: 1, hp: 3,
    kw: ['dayanikli'],
    name: {tr: 'Koru Muhafızı', en: 'Hearth Guard'},
    text: {tr: '', en: ''},
    flavor: {tr: 'Mantar çiftliklerinin üstünde nöbet.', en: 'On watch above the mushroom farms.'},
    art: 'koru-muhafiz.png', spoiler: 'free', src: '[M2]',
  },
  {
    id: 'ocak-isigi', kind: 'spell', group: 'direnis', cost: 2, speed: 'yavas',
    effects: [{t: 'heal', target: 'self-avatar', n: 3}, {t: 'heal', target: 'all-friendly-units', n: 1}],
    name: {tr: 'Ocak Işığı', en: 'Hearthlight'},
    text: {tr: 'Avatarını 3 iyileştir; tüm dost birimleri 1 iyileştir.', en: 'Heal your avatar 3 and all friendly units 1.'},
    flavor: {tr: 'Sıcak mezarlık da olsa, ateş ateştir.', en: 'A warm grave is still warm.'},
    art: 'hearth.png', spoiler: 'free', src: '[M2]',
  },
  {
    id: 'secilmis-aile', kind: 'spell', group: 'direnis', cost: 3, speed: 'hizli', needsTarget: 'ally-unit',
    effects: [{t: 'buff', target: 'target-unit', atk: 1, hp: 2}],
    name: {tr: 'Seçilmiş Aile', en: 'Chosen Family'},
    text: {tr: 'Bir dost birime kalıcı +1/+2 ver.', en: 'Give an ally unit +1/+2 permanently.'},
    flavor: {tr: '"Bir Krov, bir avcı ve bir Yankı."', en: '"A Krov, a hunter, and an Echo."'},
    art: 'chosen-family.png', spoiler: 'free', src: '[M4]',
  },
  {
    id: 'siginak', kind: 'spell', group: 'direnis', cost: 1, speed: 'ani', needsTarget: 'ally-unit',
    effects: [{t: 'heal', target: 'target-unit', n: 3}],
    name: {tr: 'Sığınak', en: 'Shelter'},
    text: {tr: 'Bir dost birimi 3 iyileştir.', en: 'Heal an ally unit 3.'},
    flavor: {tr: 'Koru herkesi alırdı. Bir zamanlar.', en: 'The Hearth took everyone. Once.'},
    art: 'siginak.png', spoiler: 'free', src: '[M2]',
  },
  {
    id: 'fiona', kind: 'hero', group: 'direnis', cost: 6, atk: 5, hp: 5,
    kw: ['cabuk', 'cagri'],
    cagri: [{t: 'buff', target: 'all-friendly-units', atk: 1, hp: 1}],
    name: {tr: 'Fiona, Direniş Komutanı', en: 'Fiona, Resistance Commander'},
    text: {tr: 'Çağrı: Tüm dost birimlere kalıcı +1/+1.', en: 'Call: Give all friendly units +1/+1 permanently.'},
    flavor: {tr: '"Ben Fiona." — ve bunu kimseye bırakmadı.', en: '"I am Fiona." — she left that to no one.'},
    art: 'fiona.png', spoiler: 'veiled', src: '[M7]',
  },

  // ---------------- Konsey / Kızıl ----------------
  {
    id: 'valerus', kind: 'hero', group: 'konsey', cost: 4, atk: 4, hp: 4,
    kw: ['cagri'],
    cagri: [{t: 'damage', target: 'enemy-avatar', n: 2}, {t: 'draw', n: 1}],
    name: {tr: 'Valerus, İki Yüzlü Lider', en: 'Valerus, the Two-Faced'},
    text: {tr: 'Çağrı: Rakip avatara 2 hasar; bir kart çek.', en: 'Call: Deal 2 to the enemy avatar; draw a card.'},
    flavor: {tr: 'Baba figürü gibi durur; teslim listesi tutar.', en: 'Looks like a father; keeps a delivery list.'},
    art: 'valerus.png', spoiler: 'free', src: '[M3]',
  },
  {
    id: 'anzer', kind: 'hero', group: 'konsey', cost: 5, atk: 4, hp: 5,
    kw: ['cagri'], needsTarget: 'any-unit',
    cagri: [{t: 'silence', target: 'target-unit'}],
    name: {tr: 'Anzer Viole, Naibe', en: 'Anzer Viole, Regent'},
    text: {tr: 'Çağrı: Bir birimi sustur (anahtar sözcükleri ve yozlaşması silinir).', en: 'Call: Silence a unit (keywords and corruption removed).'},
    flavor: {tr: 'Kelebek gibi durur; çizginin öbür yanında oturur.', en: 'Gentle as a butterfly; sits on the far side of the line.'},
    art: 'anzer.png', spoiler: 'free', src: '[M7]',
  },
  {
    id: 'vesemir', kind: 'unit', group: 'konsey', cost: 3, atk: 2, hp: 4,
    kw: ['cagri'],
    cagri: [{t: 'draw', n: 1}],
    name: {tr: 'Vesemir, Emir Kâtibi', en: 'Vesemir, Writ Keeper'},
    text: {tr: 'Çağrı: Bir kart çek.', en: 'Call: Draw a card.'},
    flavor: {tr: 'Korkuyu yazıya döker.', en: 'He transcribes fear into ink.'},
    art: 'vesemir.png', spoiler: 'free', src: '[M7]',
  },
  {
    id: 'konsey-muhbiri', kind: 'unit', group: 'konsey', cost: 2, atk: 2, hp: 1,
    kw: ['golge'],
    name: {tr: 'Konsey Muhbiri', en: 'Council Informer'},
    text: {tr: '', en: ''},
    flavor: {tr: 'Kırk Diş\'te ne geçerse kale bilir.', en: 'Whatever crosses Forty Teeth, the castle knows.'},
    art: 'konsey-muhbiri.png', spoiler: 'free', src: '[D]',
  },
  {
    id: 'kizil-cizgi', kind: 'spell', group: 'konsey', cost: 3, speed: 'yavas',
    effects: [{t: 'damage', target: 'all-enemy-units', n: 2}],
    name: {tr: 'Kızıl Çizgi', en: 'The Red Line'},
    text: {tr: 'Tüm düşman birimlere 2 hasar.', en: 'Deal 2 to all enemy units.'},
    flavor: {tr: 'Kalenin kendini sevdiği yer.', en: 'Where the castle loves itself.'},
    art: 'kizil-cizgi.png', spoiler: 'free', src: '[M7]',
  },
  {
    id: 'golge-yolu', kind: 'spell', group: 'konsey', cost: 1, speed: 'ani', needsTarget: 'any-unit',
    effects: [{t: 'return', target: 'target-unit'}],
    name: {tr: 'Gölge Yolu', en: 'Shadow Path'},
    text: {tr: 'Bir birimi sahibinin eline döndür.', en: 'Return a unit to its owner\'s hand.'},
    flavor: {tr: 'Madde enerjiye, enerji gölgeye.', en: 'Matter to energy, energy to shadow.'},
    art: 'golge-yolu.png', spoiler: 'free', src: '[M6]',
  },
  {
    id: 'gri-kelebek', kind: 'unit', group: 'konsey', cost: 1, atk: 1, hp: 1,
    kw: ['golge'],
    name: {tr: 'Gri Kelebek', en: 'Grey Butterfly'},
    text: {tr: '', en: ''},
    flavor: {tr: 'Omzuna konarsa, adını birileri öğrenmiştir.', en: 'If it lands on your shoulder, someone has learned your name.'},
    art: 'gri-kelebek.png', spoiler: 'free', src: '[M7]',
  },

  // ---------------- Karah / Yozlaşma ----------------
  {
    id: 'karah-suru', kind: 'unit', group: 'karah', cost: 2, atk: 3, hp: 2,
    kw: ['sonNefes'],
    sonNefes: [{t: 'summon', card: 'karah-yavru'}],
    name: {tr: 'Karah Sürüsü', en: 'Karah Swarm'},
    text: {tr: 'Son Nefes: Bir Karah Yavrusu çağır.', en: 'Last Breath: Summon a Karah Spawn.'},
    flavor: {tr: 'Tek değiller. Hiç tek değiller.', en: 'Not alone. Never alone.'},
    art: 'karah.png', spoiler: 'free', src: '[M1]',
  },
  {
    id: 'karah-yavru', kind: 'unit', group: 'karah', cost: 1, atk: 1, hp: 1,
    kw: [],
    name: {tr: 'Karah Yavrusu', en: 'Karah Spawn'},
    text: {tr: '', en: ''},
    flavor: {tr: 'Korkuyla beslenir.', en: 'It feeds on fear.'},
    art: 'karah-yavru.png', spoiler: 'free', src: '[L]',
  },
  {
    id: 'katran-emici', kind: 'unit', group: 'karah', cost: 4, atk: 4, hp: 4,
    kw: ['ezici'],
    name: {tr: 'Katran Emici', en: 'Tar Leech'},
    text: {tr: '', en: ''},
    flavor: {tr: 'Şehirlerin içinden geçtiği şey.', en: 'What passed through the cities.'},
    art: 'katran-emici.png', spoiler: 'free', src: '[L]',
  },
  {
    id: 'carpik-filiz', kind: 'unit', group: 'karah', cost: 3, atk: 4, hp: 3,
    kw: ['sonNefes'],
    sonNefes: [{t: 'corrupt', target: 'all-enemy-units', n: 1}],
    name: {tr: 'Çarpık Filiz', en: 'Warped Shoot'},
    text: {tr: 'Son Nefes: Tüm düşman birimlere 1 Yozlaşma ver.', en: 'Last Breath: Give all enemy units 1 Corruption.'},
    flavor: {tr: 'Yaşam yeniden filizlenir — yanlış biçimde.', en: 'Life sprouts again — wrongly.'},
    art: 'carpik-filiz.png', spoiler: 'free', src: '[M5]',
  },
  {
    id: 'yozlasma-dokunusu', kind: 'spell', group: 'karah', cost: 2, speed: 'yavas', needsTarget: 'any-unit',
    effects: [{t: 'corrupt', target: 'target-unit', n: 2}, {t: 'damage', target: 'target-unit', n: 1}],
    name: {tr: 'Yozlaşma Dokunuşu', en: 'Touch of Corruption'},
    text: {tr: 'Bir birime 1 hasar ve 2 Yozlaşma ver. (Yozlaşma: sahibinin tur başında 1 hasar; Teom Çeliği bağışık.)', en: 'Deal 1 to a unit and give it 2 Corruption. (Corruption: 1 damage at its owner\'s round start; Teomsteel is immune.)'},
    flavor: {tr: 'Mor damarlar önce incedir.', en: 'The violet veins start thin.'},
    art: 'yozlasma.png', spoiler: 'free', src: '[M5]',
  },
  {
    id: 'obsidyen-sutun', kind: 'spell', group: 'karah', cost: 4, speed: 'yavas',
    effects: [{t: 'damage', target: 'all-enemy-units', n: 1}, {t: 'corrupt', target: 'all-enemy-units', n: 1}],
    name: {tr: 'Obsidyen Sütun', en: 'Obsidian Pillar'},
    text: {tr: 'Tüm düşman birimlere 1 hasar ve 1 Yozlaşma ver.', en: 'Deal 1 and give 1 Corruption to all enemy units.'},
    flavor: {tr: 'Kıyametin uzaktan ilanı değil; maddi gerçekliği.', en: 'Not the apocalypse announced — delivered.'},
    art: 'obsidyen-sutun.png', spoiler: 'free', src: '[M5]',
  },

  // ---------------- Teom / Göz ----------------
  {
    id: 'teom-celigi', kind: 'spell', group: 'teom', cost: 2, speed: 'ani', needsTarget: 'ally-unit',
    effects: [{t: 'give-kw', target: 'target-unit', kw: 'celik'}, {t: 'buff', target: 'target-unit', atk: 1, hp: 0}],
    name: {tr: 'Teom Çeliği', en: 'Teomsteel'},
    text: {tr: 'Bir dost birime +1 güç ve Teom Çeliği kazandır.', en: 'Give an ally unit +1 attack and Teomsteel.'},
    flavor: {tr: 'Karahı kesen tek metal.', en: 'The only metal that cuts Karah.'},
    art: 'teom-blade.png', spoiler: 'free', src: '[M3]',
  },
  {
    id: 'goz-un-kesis', kind: 'unit', group: 'teom', cost: 3, atk: 2, hp: 3,
    kw: ['cagri'],
    cagri: [{t: 'cleanse', target: 'all-friendly-units'}],
    name: {tr: 'Göz\'ün Keşişi', en: 'Monk of the Eye'},
    text: {tr: 'Çağrı: Dost birimlerin Yozlaşmasını temizle.', en: 'Call: Cleanse Corruption from friendly units.'},
    flavor: {tr: 'Manastır yandı; bilgi yanmadı.', en: 'The monastery burned; the knowledge did not.'},
    art: 'goz-un-kesis.png', spoiler: 'free', src: '[M4]',
  },
  {
    id: 'serlunar-bilgin', kind: 'unit', group: 'teom', cost: 2, atk: 1, hp: 2,
    kw: ['cagri'],
    cagri: [{t: 'draw', n: 1}],
    name: {tr: 'Serlunar Bilgini', en: 'Serlunar Scholar'},
    text: {tr: 'Çağrı: Bir kart çek.', en: 'Call: Draw a card.'},
    flavor: {tr: 'Taç\'ın ne olduğunu araştıran son eller.', en: 'The last hands that studied the Crown.'},
    art: 'serlunar-bilgin.png', spoiler: 'free', src: '[L]',
  },
  {
    id: 'hatirla', kind: 'spell', group: 'teom', cost: 3, speed: 'yavas',
    effects: [{t: 'revive', n: 1, atk: -1, hp: -1}],
    name: {tr: 'Hatırla', en: 'Remember'},
    text: {tr: 'Son düşen dost birimi zayıf yankı olarak dirilt (-1/-1).', en: 'Revive the last fallen friendly unit as a weak echo (-1/-1).'},
    flavor: {tr: '"Sen unutmayı seçensin." — ama seçim geri alınabilir.', en: '"You are the one who chose to forget" — but choices can be undone.'},
    art: 'memory.png', spoiler: 'veiled', src: '[M4]',
  },
  {
    id: 'beyaz-bosluk', kind: 'spell', group: 'teom', cost: 4, speed: 'hizli', needsTarget: 'enemy-unit',
    effects: [{t: 'return', target: 'target-unit'}],
    name: {tr: 'Beyaz Boşluk', en: 'White Void'},
    text: {tr: 'Bir düşman birimi sahibinin eline döndür.', en: 'Return an enemy unit to its owner\'s hand.'},
    flavor: {tr: 'Orada zaman yok; sadece olasılıklar.', en: 'There is no time there — only possibilities.'},
    art: 'beyaz-bosluk.png', spoiler: 'free', src: '[M4]',
  },

  // ---------------- Kül Tarlaları / Nötr ----------------
  {
    id: 'maestro-borislav', kind: 'hero', group: 'notr', cost: 2, atk: 1, hp: 2,
    kw: ['cagri', 'yanki'],
    cagri: [{t: 'hatira', n: 2}],
    name: {tr: 'Maestro Borislav', en: 'Maestro Borislav'},
    text: {tr: 'Çağrı: 2 Hatıra kazan. Yankı: ölünce zayıf kopyası ele döner.', en: 'Call: Gain 2 Memory. Echo: on death a weak copy returns to hand.'},
    flavor: {tr: 'Yarım çeneli tek gerçek dost.', en: 'The half-jawed only true friend.'},
    art: 'maestro-borislav.png', spoiler: 'free', src: '[M1]',
  },
  {
    id: 'matrona-zarlari', kind: 'spell', group: 'notr', cost: 1, speed: 'ani',
    effects: [{t: 'draw', n: 1}, {t: 'hatira', n: 1}],
    name: {tr: 'Matrona\'nın Kemikleri', en: 'Matrona\'s Bones'},
    text: {tr: 'Bir kart çek; 1 Hatıra kazan.', en: 'Draw a card; gain 1 Memory.'},
    flavor: {tr: 'Beş parmak kemiği; zarlar hep dürüsttür.', en: 'Five finger bones; the dice are always honest.'},
    art: 'matrona.png', spoiler: 'free', src: '[M1]',
  },
  {
    id: 'pasli-kanca', kind: 'unit', group: 'notr', cost: 3, atk: 3, hp: 2,
    kw: ['cabuk'],
    name: {tr: 'Paslı Kanca Zebellahı', en: 'Rusty Hook Bruiser'},
    text: {tr: '', en: ''},
    flavor: {tr: 'Kuzgunyuvası\'nda kimseye sırtını dönme.', en: 'Never turn your back in Ravenroost.'},
    art: 'pasli-kanca.png', spoiler: 'free', src: '[M6]',
  },
  {
    id: 'kuzgunyuvasi-gozcu', kind: 'unit', group: 'notr', cost: 2, atk: 2, hp: 2,
    kw: ['yanki'],
    name: {tr: 'Kuzgunyuvası Gözcüsü', en: 'Ravenroost Lookout'},
    text: {tr: 'Yankı: ölünce zayıf kopyası gelecek tur ele döner.', en: 'Echo: on death a weak copy returns to hand next round.'},
    flavor: {tr: 'Surların üstünde iki kez öldü.', en: 'He died twice on the ramparts.'},
    art: 'kuzgunyuvasi-gozcu.png', spoiler: 'free', src: '[M6]',
  },
  {
    id: 'ash-ruzgari', kind: 'spell', group: 'notr', cost: 2, speed: 'yavas',
    effects: [{t: 'damage', target: 'all-units', n: 1}],
    name: {tr: 'Kül Rüzgârı', en: 'Ash Wind'},
    text: {tr: 'Tüm birimlere 1 hasar.', en: 'Deal 1 to all units.'},
    flavor: {tr: 'Tarlalarda rüzgâr yön değiştirmez; herkesi eşit sürükler.', en: 'The wind in the fields turns for no one.'},
    art: 'ash.png', spoiler: 'free', src: '[M1]',
  },
];

// 32 hand-authored canon cards + 312 generated pool cards + 8 summon tokens
export const CARDS = [...BASE_CARDS, ...POOL, ...POOL_TOKENS];
export const cardById = Object.fromEntries(CARDS.map(c => [c.id, c]));
export const COLLECTIBLE = CARDS.filter(c => !c.token);

// ---------------- Echoes (avatars) ----------------
export const ECHOES = {
  ash: {
    id: 'ash',
    name: {tr: 'Marcel — Çamur ve Kül', en: 'Marcel — Mud and Ash'},
    passive: 'rally',
    passiveText: {
      tr: 'Miras — Koru\'nun Ateşi: Her tur ilk taarruz birimin +1 güç kazanır.',
      en: 'Legacy — Hearthfire: Your first attacker each round gets +1 power.',
    },
    ultimate: {
      name: {tr: 'Unutmamayı Seç', en: 'Choose to Remember'},
      text: {
        tr: 'Nihai: Son düşen iki dost birimi +1/+1 ile dirilt; avatarını 4 iyileştir.',
        en: 'Ultimate: Revive your last two fallen units with +1/+1; heal your avatar 4.',
      },
      effects: [{t: 'revive', n: 2, atk: 1, hp: 1}, {t: 'heal', target: 'self-avatar', n: 4}],
    },
    palette: {bg: '#2F4A3A', accent: '#B08D3C', glow: '#E0A150'},
    art: 'marcel.png',
    barks: {
      tr: ['Bu sefer kaçma.', 'Kim olduğumu ben seçerim.', 'Hatırlamak, pahalıdır.'],
      en: ['This time, don\'t run.', 'I choose who I am.', 'Remembering has a price.'],
    },
    src: '[M1, M4]',
  },
  white: {
    id: 'white',
    name: {tr: 'Beyaz Saçlı Marcel — Rehber', en: 'White-Haired Marcel — The Guide'},
    passive: 'calm',
    passiveText: {
      tr: 'Miras — Boşluğun Sakinliği: Avatarının her tur aldığı ilk hasar 3 azalır.',
      en: 'Legacy — Calm of the Void: The first damage your avatar takes each round is reduced by 3.',
    },
    ultimate: {
      name: {tr: 'Düzeltme', en: 'The Correction'},
      text: {
        tr: 'Nihai: En güçlü düşman birimini sahibinin eline döndür; kalan düşman birimlere 2 hasar; avatarını 3 iyileştir; bir kart çek.',
        en: 'Ultimate: Return the strongest enemy unit to its owner\'s hand; deal 2 to all remaining enemies; heal your avatar 3; draw a card.',
      },
      effects: [{t: 'return-strongest'}, {t: 'damage', target: 'all-enemy-units', n: 2}, {t: 'heal', target: 'self-avatar', n: 3}, {t: 'draw', n: 1}],
    },
    palette: {bg: '#F2EFE6', accent: '#9CC7E8', glow: '#C9D1D9'},
    art: 'white-echo.png',
    barks: {
      tr: ['Primus\'u İlk Olan diye bilirsin.', 'Hepimiz kaybedenleriz — sende değil.', 'Bu döngü kırılabilir.'],
      en: ['You know him as the First.', 'We are all losers — you are not.', 'The loop can break.'],
    },
    src: '[M4]',
  },
  teom: {
    id: 'teom',
    name: {tr: 'Teom Zırhlı Marcel', en: 'Teom-Armored Marcel'},
    passive: 'heal1',
    passiveText: {
      tr: 'Miras — Işın Kalıntısı: Tur başında en ağır yaralı dost birim 1 iyileşir.',
      en: 'Legacy — Ray\'s Remnant: Your most wounded unit heals 1 at round start.',
    },
    ultimate: {
      name: {tr: 'Işığın Yargısı', en: 'Judgement of Light'},
      text: {
        tr: 'Nihai: Tüm düşman birimlere 3 hasar; dost birimlerin Yozlaşmasını temizle; avatarını 3 iyileştir.',
        en: 'Ultimate: Deal 3 to all enemy units; cleanse friendly Corruption; heal your avatar 3.',
      },
      effects: [
        {t: 'damage', target: 'all-enemy-units', n: 3},
        {t: 'cleanse', target: 'all-friendly-units'},
        {t: 'heal', target: 'self-avatar', n: 3},
      ],
    },
    palette: {bg: '#E8D9A8', accent: '#2F7FD0', glow: '#AEB8C4'},
    art: 'teom-echo.png',
    barks: {
      tr: ['Işık unutmaz.', 'Buranın taşı eski bir yemindir.', 'Çeliği hak et.'],
      en: ['The Light does not forget.', 'This stone is an old oath.', 'Earn the steel.'],
    },
    src: '[M4]',
  },
};

// ---------------- decks ----------------
export const defaultDeck = [
  'koru-muhafiz', 'koru-muhafiz', 'koru-muhafiz',
  'torg', 'torg', 'torg',
  'kuzgunyuvasi-gozcu', 'kuzgunyuvasi-gozcu', 'kuzgunyuvasi-gozcu',
  'borin', 'borin',
  'gorn',
  'pasli-kanca', 'pasli-kanca',
  'ocak-isigi', 'ocak-isigi',
  'secilmis-aile', 'secilmis-aile',
  'teom-celigi',
  'matrona-zarlari',
];

const karahPackDeck = [
  'karah-yavru', 'karah-yavru', 'karah-yavru',
  'karah-suru', 'karah-suru', 'karah-suru',
  'konsey-muhbiri', 'konsey-muhbiri',
  'gri-kelebek', 'gri-kelebek',
  'yozlasma-dokunusu', 'yozlasma-dokunusu', 'yozlasma-dokunusu',
  'katran-emici', 'katran-emici',
  'vesemir', 'vesemir',
  'carpik-filiz',
];

export const enemyDeck = [
  'karah-yavru', 'karah-yavru', 'karah-yavru',
  'karah-suru', 'karah-suru', 'karah-suru',
  'konsey-muhbiri', 'konsey-muhbiri',
  'vesemir', 'vesemir',
  'katran-emici', 'katran-emici',
  'yozlasma-dokunusu', 'yozlasma-dokunusu', 'yozlasma-dokunusu',
  'kizil-cizgi', 'kizil-cizgi',
  'gri-kelebek', 'gri-kelebek',
  'obsidyen-sutun',
];

const koruGuardDeck = [
  'koru-muhafiz', 'koru-muhafiz', 'koru-muhafiz',
  'borin', 'borin', 'borin',
  'torg', 'torg',
  'kuzgunyuvasi-gozcu', 'kuzgunyuvasi-gozcu', 'kuzgunyuvasi-gozcu',
  'pasli-kanca', 'pasli-kanca',
  'siginak', 'siginak',
  'secilmis-aile', 'secilmis-aile',
  'ocak-isigi', 'ocak-isigi',
  'gorn',
];

const teomDeck = [
  'serlunar-bilgin', 'serlunar-bilgin',
  'goz-un-kesis', 'goz-un-kesis', 'goz-un-kesis',
  'borin', 'borin', 'borin',
  'gorn', 'gorn',
  'koru-muhafiz', 'koru-muhafiz',
  'kuzgunyuvasi-gozcu', 'kuzgunyuvasi-gozcu',
  'pasli-kanca', 'pasli-kanca',
  'teom-celigi', 'teom-celigi',
  'hatirla', 'hatirla',
];

const primusDeck = [
  'karah-yavru', 'karah-yavru', 'karah-yavru',
  'karah-suru', 'karah-suru', 'karah-suru',
  'konsey-muhbiri', 'konsey-muhbiri',
  'vesemir', 'vesemir', 'vesemir',
  'katran-emici', 'katran-emici',
  'valerus', 'anzer',
  'kizil-cizgi',
  'yozlasma-dokunusu', 'yozlasma-dokunusu',
  'golge-yolu',
  'gri-kelebek',
];

// ---------------- story chapters ----------------
export const chapters = [
  {
    id: 0, seed: 101, health: 18, echo: 'ash', deck: karahPackDeck,
    name: {tr: 'Kızıl Aziz\'in Avlusu', en: 'Courtyard of the Red Saint'},
    opponent: 'Karah Sürüsü',
    intro: {
      tr: 'Korvengrad harabelerinde uyandın. Karahlar genç bir kızı köşeye sıkıştırdı — içgüdü bunu bilir.',
      en: 'You woke in the ruins of Korvengrad. Karah have cornered a young girl — instinct knows this.',
    },
    src: '[M1]',
  },
  {
    id: 1, seed: 203, health: 18, echo: 'ash', deck: enemyDeck,
    name: {tr: 'Kırk Diş Geçidi', en: 'Forty Teeth Pass'},
    opponent: 'Geçit Nöbetçileri',
    intro: {
      tr: 'Koru\'ya giden tek yol: paslı rayların üstündeki dar geçit. Konsey\'in muhafızları bekliyor.',
      en: 'The only road to the Hearth: a narrow pass over rusted rails. Council guards are waiting.',
    },
    src: '[M2]',
  },
  {
    id: 2, seed: 307, health: 22, echo: 'ash', deck: koruGuardDeck,
    name: {tr: 'Koru\'nun Paslı Kalbi', en: 'The Rusted Heart of the Hearth'},
    opponent: 'Koru Muhafızları',
    intro: {
      tr: 'Valerus emir verdi. Koru\'nun muhafızları teslim olmanı istiyor; bileklerin hâlâ sargılı.',
      en: 'Valerus gave the order. The Hearth\'s guards demand your surrender; your wrists are still bound.',
    },
    src: '[M3]',
  },
  {
    id: 3, seed: 401, health: 28, echo: 'white', deck: teomDeck,
    name: {tr: 'Göz\'ün Manastırı', en: 'Monastery of the Eye'},
    opponent: 'Beyaz Yankı',
    intro: {
      tr: 'Yanmış manastırda bir şey seni bekliyor. Beyaz Boşluk\'tan gelen rehber, seni sınıyor.',
      en: 'Something waits in the burned monastery. The guide from the White Void tests you.',
    },
    src: '[M4]',
  },
  {
    id: 4, seed: 503, health: 24, echo: 'white', deck: primusDeck,
    name: {tr: 'İlk Olan', en: 'The First'},
    opponent: 'Primus',
    intro: {
      tr: '"Neticede biz aynıyız." Mükemmel yansıman seni öldürmeye geldi — ama bu kez kaçmıyorsun.',
      en: '"We are the same, after all." Your perfect reflection came to kill you — but this time you don\'t run.',
    },
    src: '[M4]',
  },
];

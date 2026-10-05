import {cardById,defaultDeck,echoes} from '../content/cards.mjs';
export function rng(seed){let a=seed>>>0;return()=>{a+=0x6D2B79F5;let t=a;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296;};}
export function shuffled(deck,random){const a=[...deck];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function draw(s,p,n=1){for(let i=0;i<n;i++){if(p.deck.length){const id=p.deck.shift();if(p.hand.length<9)p.hand.push({id,uid:s.nextId++});}else{p.fatigue++;p.hp-=p.fatigue;}}}
function log(s,type,actor,data={}){s.events.push({seq:s.events.length,type,actor,...data});}
function clean(s){s.players.forEach(p=>{p.board=p.board.filter(u=>u.hp>0);p.hp=Math.min(p.maxHp,p.hp);});const dead=s.players.map(p=>p.hp<=0);if(dead.some(Boolean)){s.winner=dead[0]&&dead[1]?'draw':dead[0]?1:0;s.phase='finished';}}
export function createMatch({seed=1,first=0,echo=['ash','white'],decks=[defaultDeck,defaultDeck],health=[24,24]}={}){
 const random=rng(seed);const s={seed,nextId:1,round:1,active:first,attackOwner:first,attackUsed:false,passes:0,phase:'main',pending:null,winner:null,events:[],commands:[],players:echo.map((id,i)=>{const maxHp=health[i]+(id==='teom'?1:0);return{echo:id,hp:maxHp,maxHp,energy:2,maxEnergy:2,memory:id==='white'?1:0,ultimateUsed:false,firstUnit:true,fatigue:0,deck:shuffled(decks[i],random),hand:[],board:[]};})};s.players.forEach(p=>draw(s,p,5));log(s,'start',first);return s;
}
export function command(state,actor,cmd){
 const s=structuredClone(state);if(![0,1].includes(actor))throw Error('Geçersiz oyuncu.');if(s.winner!==null)throw Error('Maç sona erdi.');if(actor!==s.active&&cmd.type!=='concede')throw Error('Hamle sırası rakibinde.');const p=s.players[actor],o=s.players[1-actor];
 if(cmd.type==='concede'){p.hp=0;log(s,'concede',actor);}
 else if(cmd.type==='block'){
  if(s.phase!=='block')throw Error('Savunma penceresi açık değil.');
  const pairs=cmd.pairs||{};const seen=new Set();for(const [attacker,blocker] of Object.entries(pairs)){if(!s.pending.units.includes(Number(attacker))||!p.board.some(u=>u.uid===blocker)||seen.has(blocker))throw Error('Geçersiz savunma.');seen.add(blocker);}
  const attacking=s.players[s.pending.actor];for(const uid of s.pending.units){const a=attacking.board.find(u=>u.uid===uid);if(!a)continue;const b=p.board.find(u=>u.uid===pairs[uid]);if(b){b.hp-=a.attack;if(cardById[a.id].keyword!=='iz'||b.hp>0)a.hp-=b.attack;}else p.hp-=a.attack;if(a.id==='marcel')a.attack++;}
  log(s,'combat',s.pending.actor,{units:s.pending.units,pairs});s.pending=null;s.phase='main';s.active=actor;s.passes=0;
 }
 else{
  if(s.phase!=='main')throw Error('Önce saldırıyı savun.');
  if(cmd.type==='play'){
   const index=p.hand.findIndex(c=>c.uid===cmd.uid);if(index<0)throw Error('Kart elinde değil.');const c=cardById[p.hand[index].id];if(c.cost>p.energy)throw Error('Yeterli Öz yok.');if(c.type!=='spell'&&p.board.length>=5)throw Error('Safın dolu.');
   let target;if(c.target){target=o.board.find(u=>u.uid===cmd.target);if(!target&&cmd.target!=='avatar')throw Error('Bir düşman hedefi seç.');const guards=o.board.filter(u=>cardById[u.id].keyword==='siper');if(guards.length&&!guards.some(u=>u.uid===cmd.target))throw Error('Önce Siper birimini hedefle.');}
   const instance=p.hand.splice(index,1)[0];p.energy-=c.cost;
   if(c.type!=='spell'){p.board.push({...instance,attack:c.attack,hp:c.health+(p.firstUnit&&p.echo==='ash'?1:0)});p.firstUnit=false;}
   switch(c.effect){case'memory':p.memory++;break;case'recall':p.memory++;draw(s,p);break;case'restore':p.hp+=2;break;case'damage':if(target)target.hp-=c.value;else o.hp-=c.value;break;case'draw':draw(s,p,c.value);p.memory++;break;case'heal':p.hp+=c.value;break;case'aoe':o.board.forEach(u=>u.hp-=c.value);break;case'buff':p.board.forEach(u=>{u.attack++;u.hp+=2;});break;}
   p.memory=Math.min(6,p.memory+1);s.passes=0;log(s,'play',actor,{card:c.id,uid:cmd.uid,target:cmd.target});if(c.keyword!=='anlik')s.active=1-actor;
  }else if(cmd.type==='attack'){
   if(s.attackOwner!==actor||s.attackUsed)throw Error('Taarruz hakkın yok.');const ids=[...new Set(cmd.units||[])];if(!ids.length||ids.some(id=>!p.board.some(u=>u.uid===id)))throw Error('Saldıran birimleri seç.');s.pending={actor,units:ids};s.phase='block';s.attackUsed=true;s.active=1-actor;s.passes=0;log(s,'attack',actor,{units:ids});
  }else if(cmd.type==='ultimate'){
   if(p.memory<6||p.ultimateUsed)throw Error('Yankı yeteneği için 6 Hatıra gerekiyor.');p.memory=0;p.ultimateUsed=true;const e=echoes.find(e=>e.id===p.echo);if(e.effect==='rally'){p.board.forEach(u=>u.attack+=2);p.hp+=3;}if(e.effect==='recall'){draw(s,p);p.hp+=6;p.energy=Math.min(p.maxEnergy,p.energy+3);}if(e.effect==='purge')o.board.forEach(u=>u.hp-=2);s.passes=0;s.active=1-actor;log(s,'ultimate',actor);
  }else if(cmd.type==='pass'){
   s.passes++;s.active=1-actor;log(s,'pass',actor);
   if(s.passes===2){s.round++;s.passes=0;s.attackOwner=1-s.attackOwner;s.attackUsed=false;s.active=s.attackOwner;s.players.forEach(player=>{player.maxEnergy=Math.min(10,player.maxEnergy+1);player.energy=player.maxEnergy;draw(s,player);});log(s,'round',s.active,{round:s.round});}
  }else throw Error('Geçersiz komut.');
 }
 s.commands.push({actor,cmd:structuredClone(cmd)});clean(s);return s;
}
export function botCommand(s){const actor=s.active,p=s.players[actor],o=s.players[1-actor];if(s.phase==='block'){const pairs={},remaining=[...p.board].sort((a,b)=>a.attack-b.attack);for(const uid of s.pending.units){const a=o.board.find(x=>x.uid===uid);const bi=remaining.findIndex(b=>b.attack>=a.hp||b.hp>a.attack);if(bi>=0)pairs[uid]=remaining.splice(bi,1)[0].uid;}return{type:'block',pairs};}if(p.memory>=6&&!p.ultimateUsed)return{type:'ultimate'};
 const options=p.hand.filter(h=>{const c=cardById[h.id];return c.cost<=p.energy&&(c.type==='spell'||p.board.length<5)&&(c.effect!=='heal'||p.hp<p.maxHp-2)&&(c.effect!=='aoe'||o.board.length)&&(c.effect!=='buff'||p.board.length);}).sort((a,b)=>cardById[b.id].cost-cardById[a.id].cost);
 if(options.length){const c=options[0],def=cardById[c.id];const guards=o.board.filter(u=>cardById[u.id].keyword==='siper');return{type:'play',uid:c.uid,...(def.target?{target:[...(guards.length?guards:o.board)].sort((a,b)=>b.attack-a.attack)[0]?.uid??'avatar'}:{})};}
 if(s.attackOwner===actor&&!s.attackUsed&&p.board.length)return{type:'attack',units:p.board.map(c=>c.uid)};return{type:'pass'};
}
export function viewFor(s,actor){const v=structuredClone(s);v.players.forEach((p,i)=>{p.deckCount=p.deck.length;delete p.deck;if(i!==actor){p.handCount=p.hand.length;p.hand=p.hand.map(()=>({hidden:true}));}});delete v.commands;return v;}

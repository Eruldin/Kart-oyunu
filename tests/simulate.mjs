import {createMatch,command,botCommand} from '../packages/engine/index.mjs';
import {writeFile,mkdir} from 'node:fs/promises';
const echoes=['ash','white','teom'];const rows=[];
for(const a of echoes)for(const b of echoes){let wins=0,draws=0,rounds=0,stalls=0;for(let seed=1;seed<=100;seed++){let s=createMatch({seed,echo:[a,b]});for(let i=0;i<600&&s.winner===null;i++){s=command(s,s.active,botCommand(s));}if(s.winner===0)wins++;if(s.winner==='draw')draws++;if(s.winner===null)stalls++;rounds+=s.round;}rows.push({a,b,games:100,firstPlayerWins:wins,draws,stalls,averageRounds:rounds/100});}
await mkdir('reports',{recursive:true});await writeFile('reports/balance.json',JSON.stringify(rows,null,2));console.table(rows);if(rows.some(r=>r.stalls))process.exitCode=1;

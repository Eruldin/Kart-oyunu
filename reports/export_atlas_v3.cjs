const fs=require('fs'),path=require('path'),vm=require('vm');
const root='C:/Users/PC/Desktop/Eruldin Destanı haritası sitesi';
const out=path.resolve('design-pack/12-campaign-map/data');fs.mkdirSync(out,{recursive:true});
const ts=require(path.join(root,'node_modules/typescript'));
function read(name,world){const src=fs.readFileSync(path.join(root,'src/data',name+'.ts'),'utf8');const js=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const box={exports:{},require:n=>{if(n==='./world')return world;throw Error(n)}};vm.runInNewContext(js,box);return box.exports;}
const world=read('world'),regions=read('regions',world);
fs.writeFileSync(path.join(out,'atlas-original.json'),JSON.stringify({coordinate_system:'normalized x left to right, y top to bottom; m2026 and col are independent',layers:world.KATMANLAR,categories:world.KATEGORILER,points:world.POILER,regions:regions.REGIONS,region_note:regions.REGION_NOTE},null,2));
console.log(JSON.stringify({points:world.POILER.length,regions:regions.REGIONS.length}));

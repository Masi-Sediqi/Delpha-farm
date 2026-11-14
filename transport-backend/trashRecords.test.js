import test from 'node:test';
import assert from 'node:assert/strict';
import { deletedRecordChanges, restoreDeletedChanges, trashSummary } from './trashRecords.js';

test('all collection deletions retain full records and restore without losing newer unrelated records',()=>{
 for(const name of ['products','suppliers','customerRegistry','countries','manufacturerCompanies','partyCashTransactions']){
  const row={id:1,name:'Example',nested:{amount:42}};
  const deltas=deletedRecordChanges([{name,before:[row],after:[]}]);
  assert.deepEqual(deltas[0].removed,[row]);
  assert.deepEqual(restoreDeletedChanges(deltas,{[name]:[{id:2,name:'New'}]})[name],[{id:2,name:'New'},row]);
 }
});
test('ordinary creates and edits do not create trash entries',()=>{
 assert.deepEqual(deletedRecordChanges([{name:'products',before:[{id:1,n:1}],after:[{id:1,n:2},{id:2}]}]),[]);
});
test('atomic deletion restores dependent stock edits and additions together',()=>{
 const changes=[{name:'salesRegister',before:[{id:1,total:20}],after:[]},{name:'stockMovements',before:[{id:2,qty:4}],after:[{id:2,qty:6},{id:3,qty:2}]}];
 const deltas=deletedRecordChanges(changes);
 assert.equal(deltas.length,2);
 const restored=restoreDeletedChanges(deltas,Object.fromEntries(changes.map(c=>[c.name,c.after])));
 assert.deepEqual(restored,Object.fromEntries(changes.map(c=>[c.name,c.before])));
});
test('restoration refuses existing IDs or changed dependent records',()=>{
 const deltas=deletedRecordChanges([{name:'salesRegister',before:[{id:1}],after:[]},{name:'stockMovements',before:[{id:2,n:1}],after:[{id:2,n:2}]}]);
 assert.throws(()=>restoreDeletedChanges(deltas,{salesRegister:[{id:1}],stockMovements:[{id:2,n:2}]}),/Restore conflict/);
 assert.throws(()=>restoreDeletedChanges(deltas,{salesRegister:[],stockMovements:[{id:2,n:3}]}),/Restore conflict/);
});
test('legacy purchase snapshots avoid duplicate archives but cannot bypass unrelated deletion',()=>{
 const purchase={id:1};
 const legacy={name:'trashPurchases',before:[],after:[{id:'trash1',purchase,items:[],movements:[]}]};
 assert.deepEqual(deletedRecordChanges([legacy,{name:'purchases',before:[purchase],after:[]}]),[]);
 const deltas=deletedRecordChanges([legacy,{name:'products',before:[{id:7}],after:[]}]);
 assert.equal(deltas[0].name,'products');
});
test('trash summaries never expose user credentials',()=>{
 const summary=trashSummary({id:'a',payload:deletedRecordChanges([{name:'__users',before:[{id:2,full_name:'Person',password_hash:'secret'}],after:[]}])});
 assert.equal(summary.recordName,'Person');
 assert.equal(JSON.stringify(summary).includes('secret'),false);
});

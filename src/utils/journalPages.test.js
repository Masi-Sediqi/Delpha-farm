import test from "node:test";
import assert from "node:assert/strict";
import { groupJournalPages, replaceJournalPage } from "./journalPages.js";

test("one actions menu targets all lines of exactly one journal page", () => {
 const entries=[{id:"a",pageNumber:"JEN00001",lineNumber:2,date:"2026-11-01"},{id:"b",pageNumber:"JEN00001",lineNumber:1,date:"2026-11-01"},{id:"c",pageNumber:"JEN00002",lineNumber:1,date:"2026-11-02"}];
 const pages=groupJournalPages(entries);
 assert.equal(pages.length,2); assert.equal(pages[0].number,"JEN00002");
 assert.deepEqual(pages[1].entries.map(row=>row.id),["b","a"]);
 assert.deepEqual(entries.map(row=>row.id),["a","b","c"]);
});

test("editing a page replaces its lines without duplicating or removing other pages", () => {
 const entries=[{id:"a",pageNumber:"JEN00001",amount:10},{id:"b",pageNumber:"JEN00001",amount:20},{id:"c",pageNumber:"JEN00002",amount:30}];
 const page=groupJournalPages(entries).find(row=>row.number==="JEN00001");
 const result=replaceJournalPage(entries,page,[{...entries[0],amount:15}]);
 assert.equal(result.length,2); assert.equal(result.find(row=>row.id==="a").amount,15);
 assert.equal(result.find(row=>row.id==="c"),entries[2]);
 assert.equal(entries[0].amount,10);
});

test("legacy records without a JEN page remain separate action targets", () => {
 const pages=groupJournalPages([{id:"x",reference:"old"},{id:"y",reference:"old"},{id:"z",reference:"JEN00003"}]);
 assert.equal(pages.length,3);
 assert.ok(pages.every(page=>page.entries.length===1));
});

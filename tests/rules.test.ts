import {test} from 'node:test';
import assert from 'node:assert/strict';
import {quotePrice,vimeoEmbed,gradeQuote,missingFields,csvCell} from '../lib/rules';
import {lessons,visibleModules} from '../lib/catalog';
test('gross margin is not markup',()=>{assert.equal(quotePrice(1600,20),2000);assert.equal(quotePrice(1600,0),1600);assert.throws(()=>quotePrice(1600,100));assert.throws(()=>quotePrice(-1,20));assert.throws(()=>quotePrice(NaN,20))});
test('unlisted Vimeo privacy hash survives conversion',()=>{assert.equal(vimeoEmbed('https://vimeo.com/12345678/abc123'),'https://player.vimeo.com/video/12345678?h=abc123&dnt=1');assert.equal(vimeoEmbed('https://player.vimeo.com/video/12345678?h=abc123'),'https://player.vimeo.com/video/12345678?h=abc123&dnt=1');assert.equal(vimeoEmbed('https://vimeo.com.evil.example/123'),null);assert.equal(vimeoEmbed('javascript:alert(1)'),null)});
test('practice requires both missing facts and correct math',()=>{assert.equal(gradeQuote({fields:missingFields,price:2000}).passed,true);assert.equal(gradeQuote({fields:missingFields.slice(1),price:2000}).passed,false);assert.equal(gradeQuote({fields:missingFields,price:1920}).passed,false)});
test('course includes only course source candidates and correct role counts',()=>{assert.equal(lessons.length,52);assert(lessons.every(l=>l.sources.every(s=>/^C\d{3}$/.test(s))));for(const [role,count]of [['agent',40],['owner',41]] as const)assert.equal(visibleModules(role).filter(m=>m.role!=='Optional').flatMap(m=>m.lessons).length,count)});
test('spreadsheet exports neutralize executable formulas and quote text',()=>{assert.equal(csvCell('=1+1'),'"\'=1+1"');assert.equal(csvCell('A "company"'),'"A ""company"""')});

import curriculum from '@/data/curriculum.json';
export const modules=curriculum.modules;
export const lessons=modules.flatMap(m=>m.lessons.map(l=>({...l,moduleId:m.id,moduleTitle:m.title,role:m.role})));
export const phases=[{id:'ready',name:'Get ready',description:'Understand the freight. Establish your working setup.',modules:['0','A','B','1','2']},{id:'customers',name:'Find customers',description:'Research with purpose. Start useful conversations.',modules:['3','4']},{id:'freight',name:'Quote & move freight',description:'Price with evidence. Execute with confidence.',modules:['5','6','7']},{id:'growth',name:'Improve & grow',description:'Build relationships and a repeatable business.',modules:['8','9']}];
export function visibleModules(role:string){return modules.filter(m=>m.role==='Both'||m.role==='Optional'||m.role===(role==='agent'?'Agent':'Owner'))}
export function lessonById(id:string){return lessons.find(l=>l.id===id)}

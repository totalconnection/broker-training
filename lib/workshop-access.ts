import {studentCourse,type Course} from './teaching-schema';
import {hasProduct,type ProductId} from './products';
import {quoteCourse} from './quote-workshop';
import {drayageCourse} from './drayage-workshop';

export function courseForMember(course:Course,member:{admin:boolean;role:string;products:ProductId[]}):Course {
 if(member.admin)return course;
 if(hasProduct(member,'academy'))return studentCourse(course,member.role);
 const sections=[
  ...(hasProduct(member,'quote-workshop')?quoteCourse(course).sections:[]),
  ...(hasProduct(member,'drayage-workshop')?drayageCourse(course).sections:[]),
 ];
 return studentCourse({...course,settings:{gptUrl:'',skoolUrl:'',checkoutUrl:''},sections},member.role);
}

import { MANAGEMENT_IDS, MANAGEMENT_VARIANTS } from '../models/range-decisions.js';
import { validChoiceSeed } from '../lib/learning-choices.js';
export const MANAGEMENT_KEY = 'passiko-range-learning-v1';
export const MANAGEMENT_QUESTION_REVISIONS = Object.freeze({
  'range-width': Object.freeze({prediction:1,reason:1,application:3}),
  'fee-tiers': Object.freeze({prediction:1,reason:1,application:3}),
  'range-management': Object.freeze({prediction:1,reason:1,application:1}),
});
export const emptyManagementProgress = () => ({version:1,completed:[],drafts:{}});
export function parseManagementProgress(value) {
  const clean=emptyManagementProgress();
  if(value?.version!==1)return clean;
  clean.completed=MANAGEMENT_IDS.filter(id=>Array.isArray(value.completed)&&value.completed.includes(id));
  for(const id of MANAGEMENT_IDS) {
    const draft=value.drafts?.[id];
    if(!draft||!Number.isInteger(draft.variant)||draft.variant<0||draft.variant>=MANAGEMENT_VARIANTS)continue;
    const short=key=>typeof draft[key]==='string'&&draft[key].length<=24?draft[key]:'';
    const questionRevisions={...MANAGEMENT_QUESTION_REVISIONS[id]};
    const answer=key=>(draft.questionRevisions?.[key]??1)===questionRevisions[key]?short(key):'';
    clean.drafts[id]={variant:draft.variant,prediction:answer('prediction'),reason:answer('reason'),application:answer('application'),revealed:draft.revealed===true,choiceSeed:validChoiceSeed(draft.choiceSeed)?draft.choiceSeed:null,questionRevisions};
  }
  return clean;
}
export function readManagementProgress(getStorage=()=>globalThis.localStorage) {
  try {const raw=getStorage().getItem(MANAGEMENT_KEY);return {progress:raw?parseManagementProgress(JSON.parse(raw)):emptyManagementProgress(),available:true};}
  catch {return {progress:emptyManagementProgress(),available:false};}
}
export function saveManagementProgress(progress,getStorage=()=>globalThis.localStorage) {
  try{getStorage().setItem(MANAGEMENT_KEY,JSON.stringify(parseManagementProgress(progress)));return true;}catch{return false;}
}

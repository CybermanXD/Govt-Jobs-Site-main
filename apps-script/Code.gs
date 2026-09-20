const CONFIG = Object.freeze({
  spreadsheetProperty: 'SPREADSHEET_ID',
  jobsSheet: 'Jobs',
  detailsSheet: 'JobDetails',
  sourcesSheet: 'Sources',
  stateSheet: 'ScrapeState',
  runsSheet: 'Runs',
  sourceBatchSize: 6,
  detailBatchSize: 40,
  detailMaxRuntimeMs: 240000,
  detailRequestDelayMs: 250,
  detailMaxRetries: 2,
  detailRetryBaseMs: 1000,
  maxJobs: 6000,
  maxApiLimit: 500,
  requestTimeoutMs: 30000,
  detailsTextLimit: 45000,
  cacheSeconds: 300,
  staleDetailDays: 7,
  userAgent: 'Mozilla/5.0 (compatible; GovJobIndia/1.0; +https://govjob-india.pages.dev)'
});

const JOB_HEADERS = ['id','title','board','qualification','lastDate','source','url','state','postCount','location','firstSeenAt','updatedAt','active','detailsStatus','detailsUpdatedAt','contentHash'];
const DETAIL_HEADERS = ['jobId','url','companyName','postName','noOfPosts','advtNo','salary','qualification','ageLimitJson','startDate','lastDate','officialWebsite','officialWebsitesJson','eligibilityJson','desirableSkillsJson','experienceJson','salaryDetailsJson','importantDatesJson','importantDatesTableJson','selectionProcessJson','generalInstructionsJson','howToApplyJson','importantLinksJson','officialNotificationStatus','html','scrapedAt','contentHash','lastError'];
const SOURCE_HEADERS = ['sourceId','url','category','parserType','forcedState','enabled','priority','lastRunAt','lastSuccessAt','lastJobCount','consecutiveFailures','lastError'];
const STATE_HEADERS = ['key','value'];
const RUN_HEADERS = ['runId','type','startedAt','endedAt','processed','changed','errors'];
function nowIso_() { return new Date().toISOString(); }
function text_(html) { return decodeHtml_(String(html || '').replace(/<script[\s\S]*?<\/script>/gi,' ').replace(/<style[\s\S]*?<\/style>/gi,' ').replace(/<br\s*\/?\s*>/gi,'\n').replace(/<[^>]+>/g,' ').replace(/[ \t]+/g,' ').replace(/\n\s+/g,'\n').trim()); }
function decodeHtml_(s) { return s.replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&').replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'").replace(/&lt;/gi,'<').replace(/&gt;/gi,'>').replace(/&#(\d+);/g,(_,n)=>String.fromCharCode(Number(n))); }
function hash_(value) { const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || ''), Utilities.Charset.UTF_8); return bytes.slice(0,12).map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2)).join(''); }
function canonicalUrl_(url, base) { if (!url) return ''; try { if (/^https?:\/\//i.test(url)) return url.split('#')[0]; const origin = String(base).match(/^https?:\/\/[^/]+/i); if (url.indexOf('//') === 0) return 'https:' + url; if (url[0] === '/') return (origin ? origin[0] : '') + url; return String(base).replace(/[^/]*$/,'') + url; } catch (e) { return url; } }
function dateIso_(value) { const s = text_(value); let m = s.match(/(\d{1,2})[-\/]([0-9]{1,2})[-\/](\d{4})/); if (m) return m[3] + '-' + ('0'+m[2]).slice(-2) + '-' + ('0'+m[1]).slice(-2); m = s.match(/(\d{1,2})[-\s]([A-Za-z]{3,9})[-\s](\d{4})/); if (m) { const d = new Date(m[1] + ' ' + m[2] + ' ' + m[3]); if (!isNaN(d)) return Utilities.formatDate(d,'UTC','yyyy-MM-dd'); } return ''; }
function jsonParse_(value, fallback) { try { return value ? JSON.parse(value) : fallback; } catch (e) { return fallback; } }
function cleanArray_(items) { const seen = {}; return (items || []).map(x => text_(x)).filter(x => x && !seen[x] && (seen[x] = true)); }
function jsonOutput_(value) { return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON); }
function clamp_(value, min, max, fallback) { const n = Number(value); return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.floor(n))) : fallback; }
function sourceDefinitions_() {
  const table = [
    ['government','https://www.freejobalert.com/government-jobs/','Govt Jobs',''],
    ['bank','https://www.freejobalert.com/bank-jobs/','Bank Jobs',''],
    ['teaching','https://www.freejobalert.com/teaching-faculty-jobs/','Teaching Jobs',''],
    ['engineering','https://www.freejobalert.com/engineering-jobs/','Engineering Jobs',''],
    ['railway','https://www.freejobalert.com/railway-jobs/','Railway Jobs',''],
    ['defence','https://www.freejobalert.com/police-defence-jobs/','Police/Defence Jobs',''],
    ['latest','https://www.freejobalert.com/latest-notifications/','Latest Notifications',''],
    ['state-all','https://www.freejobalert.com/state-government-jobs/','State Govt Jobs',''],
    ['jk','https://www.freejobalert.com/jk-government-jobs/','Jammu and Kashmir','Jammu and Kashmir'],
    ['ap','https://www.freejobalert.com/ap-government-jobs/','Andhra Pradesh','Andhra Pradesh'],
    ['assam','https://www.freejobalert.com/assam-government-jobs/','Assam','Assam'],
    ['bihar','https://www.freejobalert.com/bihar-government-jobs/','Bihar','Bihar'],
    ['chhattisgarh','https://www.freejobalert.com/chhattisgarh-government-jobs/','Chhattisgarh','Chhattisgarh'],
    ['delhi','https://www.freejobalert.com/delhi-government-jobs/','Delhi','Delhi'],
    ['gujarat','https://www.freejobalert.com/gujarat-government-jobs/','Gujarat','Gujarat'],
    ['hp','https://www.freejobalert.com/hp-government-jobs/','Himachal Pradesh','Himachal Pradesh'],
    ['haryana','https://www.freejobalert.com/haryana-government-jobs/','Haryana','Haryana'],
    ['jharkhand','https://www.freejobalert.com/jharkhand-government-jobs/','Jharkhand','Jharkhand'],
    ['karnataka','https://www.freejobalert.com/karnataka-government-jobs/','Karnataka','Karnataka'],
    ['kerala','https://www.freejobalert.com/kerala-government-jobs/','Kerala','Kerala'],
    ['maharashtra','https://www.freejobalert.com/maharashtra-government-jobs/','Maharashtra','Maharashtra'],
    ['mp','https://www.freejobalert.com/mp-government-jobs/','Madhya Pradesh','Madhya Pradesh'],
    ['odisha','https://www.freejobalert.com/odisha-government-jobs/','Odisha','Odisha'],
    ['punjab','https://www.freejobalert.com/punjab-government-jobs/','Punjab','Punjab'],
    ['rajasthan','https://www.freejobalert.com/rajasthan-government-jobs/','Rajasthan','Rajasthan'],
    ['tn','https://www.freejobalert.com/tn-government-jobs/','Tamil Nadu','Tamil Nadu'],
    ['telangana','https://www.freejobalert.com/telangana-government-jobs/','Telangana','Telangana'],
    ['uttarakhand','https://www.freejobalert.com/uttarakhand-government-jobs/','Uttarakhand','Uttarakhand'],
    ['up','https://www.freejobalert.com/up-government-jobs/','Uttar Pradesh','Uttar Pradesh'],
    ['wb','https://www.freejobalert.com/wb-government-jobs/','West Bengal','West Bengal']
  ].map((x, i) => [x[0],x[1],x[2],'table',x[3],true,i + 1,'','','',0,'']);

  const search = [
    ['hyderabad','jobs-in-hyderabad-secunderabad','Hyderabad Jobs'],['bhubaneswar','jobs-in-bhubaneshwar','Bhubaneswar Jobs'],
    ['new-delhi','jobs-in-new-delhi','Delhi City Jobs'],['jaipur','jobs-in-jaipur','Jaipur Jobs'],['patna','jobs-in-patna','Patna Jobs'],
    ['bangalore','jobs-in-bengaluru-bangalore','Bangalore Jobs'],['indore','jobs-in-indore','Indore Jobs'],['ludhiana','jobs-in-ludhiana','Ludhiana Jobs'],
    ['mumbai','jobs-in-mumbai','Mumbai Jobs'],['visakhapatnam','jobs-in-visakhapatnam','Visakhapatnam Jobs'],['pune','jobs-in-pune','Pune Jobs'],
    ['chennai','jobs-in-chennai','Chennai Jobs'],['kolkata','jobs-in-kolkata','Kolkata Jobs'],['gandhinagar','jobs-in-gandhinagar','Gandhinagar Jobs'],
    ['lucknow','jobs-in-lucknow','Lucknow Jobs'],['10th','10th-pass-government-jobs','10th Pass Jobs'],['8th','8th-pass-government-jobs','8th Pass Jobs'],
    ['12th','12th-pass-government-jobs','12th Pass Jobs'],['diploma','diploma-government-jobs','Diploma Jobs'],['iti','iti-government-jobs','ITI Jobs'],
    ['btech','btech-be-government-jobs','BTech/BE Jobs'],['bcom','bcom-government-jobs','B.Com Jobs'],['mba','mba-pgdm-government-jobs','MBA/PGDM Jobs'],
    ['msw','msw-government-jobs','MSW Jobs'],['bsc','bsc-government-jobs','B.Sc Jobs'],['msc','msc-government-jobs','M.Sc Jobs'],
    ['ba','ba-government-jobs','BA Jobs'],['ma','ma-government-jobs','MA Jobs'],['graduate','any-graduate-government-jobs','Any Graduate Jobs'],
    ['postgraduate','any-post-graduate-government-jobs','Any Post Graduate Jobs']
  ].map((x, i) => ['search-' + x[0],'https://www.freejobalert.com/search-jobs/' + x[1] + '/',x[2],'search','',true,table.length + i + 1,'','','',0,'']);
  return table.concat(search);
}
function spreadsheet_() { const id = PropertiesService.getScriptProperties().getProperty(CONFIG.spreadsheetProperty); if (!id) throw new Error('Missing Script Property SPREADSHEET_ID'); return SpreadsheetApp.openById(id); }
function ensureSheet_(name, headers) { const ss = spreadsheet_(); let sh = ss.getSheetByName(name); if (!sh) sh = ss.insertSheet(name); if (sh.getLastRow() === 0) { sh.getRange(1,1,1,headers.length).setValues([headers]); sh.setFrozenRows(1); sh.getRange(1,1,1,headers.length).setFontWeight('bold'); } return sh; }
function rowsAsObjects_(sheet, headers) { if (sheet.getLastRow() < 2) return []; return sheet.getRange(2,1,sheet.getLastRow()-1,headers.length).getValues().map(row => Object.fromEntries(headers.map((h,i)=>[h,row[i]]))); }
function objectRow_(obj, headers) { return headers.map(h => obj[h] === null || obj[h] === undefined ? '' : obj[h]); }
function replaceData_(sheet, headers, objects) { if (sheet.getLastRow() > 1) sheet.getRange(2,1,sheet.getLastRow()-1,headers.length).clearContent(); if (objects.length) sheet.getRange(2,1,objects.length,headers.length).setValues(objects.map(x => objectRow_(x,headers))); }
function getState_(key, fallback) { const props = PropertiesService.getScriptProperties(); const v = props.getProperty('STATE_' + key); return v === null ? fallback : v; }
function setState_(key, value) {
  const stringValue = String(value);
  PropertiesService.getScriptProperties().setProperty('STATE_' + key, stringValue);
  const sheet = ensureSheet_(CONFIG.stateSheet, STATE_HEADERS);
  const rows = rowsAsObjects_(sheet, STATE_HEADERS);
  const existingIndex = rows.findIndex(row => String(row.key) === String(key));
  if (existingIndex >= 0) {
    sheet.getRange(existingIndex + 2, 2).setValue(stringValue);
  } else {
    sheet.appendRow([key, stringValue]);
  }
}
function getJobs_() { return rowsAsObjects_(ensureSheet_(CONFIG.jobsSheet, JOB_HEADERS), JOB_HEADERS); }
function saveJobs_(jobs) { replaceData_(ensureSheet_(CONFIG.jobsSheet, JOB_HEADERS), JOB_HEADERS, jobs.slice(0,CONFIG.maxJobs)); CacheService.getScriptCache().remove('jobs_snapshot'); }
function getDetails_() { return rowsAsObjects_(ensureSheet_(CONFIG.detailsSheet, DETAIL_HEADERS), DETAIL_HEADERS); }
function saveDetails_(rows) { replaceData_(ensureSheet_(CONFIG.detailsSheet, DETAIL_HEADERS), DETAIL_HEADERS, rows); CacheService.getScriptCache().remove('details_snapshot'); }
function logRun_(type,start,processed,changed,errors) { const sh = ensureSheet_(CONFIG.runsSheet,RUN_HEADERS); sh.appendRow([Utilities.getUuid(),type,start,nowIso_(),processed,changed,(errors||[]).join(' | ').slice(0,5000)]); if (sh.getLastRow() > 501) sh.deleteRows(2,sh.getLastRow()-501); }
function fetchHtml_(url) { const response = UrlFetchApp.fetch(url,{muteHttpExceptions:true,followRedirects:true,headers:{'User-Agent':CONFIG.userAgent,'Accept':'text/html'}}); if (response.getResponseCode() < 200 || response.getResponseCode() >= 400) throw new Error('HTTP ' + response.getResponseCode()); return response.getContentText(); }
function fetchDetailHtml_(url) {
  let lastError = null;
  for (let attempt = 0; attempt < CONFIG.detailMaxRetries; attempt++) {
    try {
      const response = UrlFetchApp.fetch(url, {muteHttpExceptions:true,followRedirects:true,headers:{'User-Agent':CONFIG.userAgent,'Accept':'text/html'}});
      const status = response.getResponseCode();
      if (status >= 200 && status < 400) return response.getContentText();
      lastError = new Error('HTTP ' + status);
      if (status !== 429 && status < 500) break;
    } catch (error) {
      lastError = error;
    }
    Utilities.sleep(CONFIG.detailRetryBaseMs * Math.pow(2, attempt));
  }
  throw lastError || new Error('Detail request failed');
}
function cells_(rowHtml) { const values=[]; String(rowHtml).replace(/<(?:td|th)\b[^>]*>([\s\S]*?)<\/(?:td|th)>/gi,(_,v)=>{values.push(text_(v)); return _;}); return values; }
function hrefMatching_(html, label) { const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m; while((m=re.exec(html))) if (text_(m[2]).toLowerCase().indexOf(label.toLowerCase()) >= 0) return m[1]; return ''; }
function parseTablePage_(html, source) { const jobs=[]; const rows=String(html).match(/<tr\b[\s\S]*?<\/tr>/gi)||[]; rows.forEach(row=>{ const href=hrefMatching_(row,'Get Details'); if(!href) return; const c=cells_(row); if(c.length<6) return; const title=c[2], count=(title.match(/(\d[\d,]*)\s*Posts?/i)||[])[1]; jobs.push(normalizeJob_({title:title,board:c[1],qualification:c[3],lastDate:dateIso_(c[5]),source:'FreeJobAlert '+source.category,url:canonicalUrl_(href,source.url),state:source.forcedState||null,postCount:count?Number(count.replace(/,/g,'')):null,location:null})); }); return jobs; }
function fieldMap_(html) { const out={}; (String(html).match(/<tr\b[\s\S]*?<\/tr>/gi)||[]).forEach(row=>{const c=cells_(row); if(c.length>=2) out[c[0].replace(/\s+/g,' ').trim()]=c[1];}); return out; }
function parseSearchPage_(html, source) { const jobs=[]; const blocks=String(html).split(/<div\b[^>]*class=["'][^"']*org_tab[^"']*["'][^>]*>/i).slice(1); blocks.forEach(block=>{ block=block.split(/<div\b[^>]*class=/i)[0]; const fields=fieldMap_(block); const board=text_((block.match(/<span\b[^>]*>([\s\S]*?)<\/span>/i)||[])[1]||''); const post=fields['Post Name']||fields['Post Name ']||''; const vacancy=fields['No. of Vacancy']||fields['No. of Vacancies']||fields['Vacancies']||''; const location=fields['Location']||''; const count=(vacancy.match(/\d[\d,]*/)||[])[0]; const href=hrefMatching_(block,'Apply Now'); jobs.push(normalizeJob_({title:board&&post&&post.indexOf(board)<0?board+' '+post:(post||board),board:board,qualification:fields['Qualification']||fields['Qualifications']||'',lastDate:dateIso_(fields['Last Date to Apply']||fields['Last Date']||''),source:'FreeJobAlert '+source.category,url:canonicalUrl_(href,source.url),state:source.forcedState||inferState_(location)||null,postCount:count?Number(count.replace(/,/g,'')):null,location:location||null})); }); return jobs.filter(x=>x.title&&x.url); }
function normalizeJob_(job) { job.url=canonicalUrl_(job.url,''); job.title=text_(job.title); job.board=text_(job.board); job.qualification=text_(job.qualification); job.id=hash_(job.url||job.title+'|'+job.board); return job; }
function inferState_(text) { const states=['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Delhi','Goa','Gujarat','Haryana','Himachal Pradesh','Jammu and Kashmir','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal']; const low=String(text||'').toLowerCase(); return states.find(s=>low.indexOf(s.toLowerCase())>=0)||''; }
function extractLabel_(plain, labels) { for (let i=0;i<labels.length;i++) { const escaped=labels[i].replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); const m=plain.match(new RegExp('(?:^|\\n)\\s*'+escaped+'\\s*[:\\-–]\\s*([^\\n]+)','i')); if(m) return text_(m[1]); } return ''; }
function section_(plain, labels) { const lines=plain.split(/\n+/).map(x=>x.trim()).filter(Boolean); let start=-1; for(let i=0;i<lines.length;i++) if(labels.some(x=>lines[i].toLowerCase().indexOf(x.toLowerCase())>=0)){start=i+1;break;} if(start<0)return []; const out=[]; for(let i=start;i<Math.min(lines.length,start+30);i++){if(i>start&&/^(eligibility|qualification|experience|salary|age limit|important dates|selection|general instructions|how to apply|important links)/i.test(lines[i]))break; out.push(lines[i]);} return cleanArray_(out); }
function links_(html, base) { const out=[]; const re=/<a\b[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi; let m; while((m=re.exec(html))){const url=canonicalUrl_(m[1],base),label=text_(m[2]); if(!url)continue; if(/official.*website/i.test(label)||/\.(gov\.in|nic\.in|edu\.in)(\/|$)/i.test(url)) out.push({type:'officialWebsite',label:'Official Website:',display:url.replace(/^https?:\/\//,'').split('/')[0],url:url}); else if(/notification|advertisement|download/i.test(label)||/\.pdf($|\?)/i.test(url)) out.push({type:'officialNotification',label:'Official Notification PDF :',display:'CLICK HERE',url:url}); } const seen={}; return out.filter(x=>!seen[x.type+x.url]&&(seen[x.type+x.url]=true)).filter((x,i,a)=>a.slice(0,i).filter(y=>y.type===x.type).length<2); }
function parseJobDetails_(html,url,jobId) { const plain=text_(html).replace(/\s*\n\s*/g,'\n').slice(0,CONFIG.detailsTextLimit); const importantLinks=links_(html,url); const official=importantLinks.filter(x=>x.type==='officialWebsite').map(x=>x.url); const age=extractLabel_(plain,['Age Limit','Age as on']); const salary=extractLabel_(plain,['Salary','Pay Scale','Pay','Stipend']); const details={jobId:jobId,url:url,companyName:extractLabel_(plain,['Company Name','Name of Company','Organization Name','Organization','Organisation']),postName:extractLabel_(plain,['Post Name','Post Names','Name of Post']),noOfPosts:extractLabel_(plain,['No of Posts','No. of Posts','Number of Posts','No. of Vacancies','Vacancies']),advtNo:extractLabel_(plain,['Advt No','Advt. No','Advertisement No','Advertisement No.']),salary:salary,qualification:extractLabel_(plain,['Qualification','Educational Qualification','Essential Qualification']),ageLimitJson:JSON.stringify(age?cleanArray_(age.split(/[,;|]/)):[]),startDate:dateIso_(extractLabel_(plain,['Start Date for Apply','Start Date'])),lastDate:dateIso_(extractLabel_(plain,['Last Date for Apply','Last Date to Apply','Last Date'])),officialWebsite:official[0]||'',officialWebsitesJson:JSON.stringify(official),eligibilityJson:JSON.stringify(section_(plain,['Eligibility','Essential Qualification'])),desirableSkillsJson:JSON.stringify(section_(plain,['Desirable Skills','Desired Skills','Desirable Qualification'])),experienceJson:JSON.stringify(section_(plain,['Experience','Work Experience'])),salaryDetailsJson:JSON.stringify(section_(plain,['Salary','Stipend','Pay'])),importantDatesJson:JSON.stringify(section_(plain,['Important Dates','Important Date'])),importantDatesTableJson:'[]',selectionProcessJson:JSON.stringify(section_(plain,['Selection Process','Selection'])),generalInstructionsJson:JSON.stringify(section_(plain,['General Information','General Instructions','Instructions'])),howToApplyJson:JSON.stringify(section_(plain,['How to Apply','Application Process'])),importantLinksJson:JSON.stringify(importantLinks),officialNotificationStatus:importantLinks.some(x=>x.type==='officialNotification')?'':'Official Notification PDF : N/A',html:plain,scrapedAt:nowIso_(),lastError:''}; details.contentHash=hash_(JSON.stringify(details)); return details; }
function publicDetail_(row) { return {url:row.url,html:row.html||'',companyName:row.companyName||'',postName:row.postName||'',noOfPosts:row.noOfPosts||'',advtNo:row.advtNo||'',salary:row.salary||'',qualification:row.qualification||'',ageLimit:jsonParse_(row.ageLimitJson,[]),startDate:row.startDate||'',lastDate:row.lastDate||'',officialWebsite:row.officialWebsite||'',officialWebsites:jsonParse_(row.officialWebsitesJson,[]),eligibility:jsonParse_(row.eligibilityJson,[]),desirableSkills:jsonParse_(row.desirableSkillsJson,[]),experience:jsonParse_(row.experienceJson,[]),salaryDetails:jsonParse_(row.salaryDetailsJson,[]),importantDates:jsonParse_(row.importantDatesJson,[]),importantDatesTable:jsonParse_(row.importantDatesTableJson,[]),selectionProcess:jsonParse_(row.selectionProcessJson,[]),generalInstructions:jsonParse_(row.generalInstructionsJson,[]),howToApply:jsonParse_(row.howToApplyJson,[]),importantLinks:jsonParse_(row.importantLinksJson,[]),officialNotificationStatus:row.officialNotificationStatus||''}; }
function runListingBatch() { const lock=LockService.getScriptLock(); if(!lock.tryLock(5000))return; const started=nowIso_(), errors=[]; let changed=0,processed=0; try { setState_('scraping','true'); const sourceSheet=ensureSheet_(CONFIG.sourcesSheet,SOURCE_HEADERS); let sources=rowsAsObjects_(sourceSheet,SOURCE_HEADERS).filter(x=>x.sourceId&&x.url&&String(x.enabled).toLowerCase()!=='false'); if(!sources.length){replaceData_(sourceSheet,SOURCE_HEADERS,sourceDefinitions_());SpreadsheetApp.flush();sources=rowsAsObjects_(sourceSheet,SOURCE_HEADERS).filter(x=>x.sourceId&&x.url&&String(x.enabled).toLowerCase()!=='false');} if(!sources.length)throw new Error('Source initialization failed. Check SPREADSHEET_ID and the Sources sheet permissions.'); let cursor=Number(getState_('sourceCursor','0'))||0; const batch=[]; for(let i=0;i<Math.min(CONFIG.sourceBatchSize,sources.length);i++)batch.push(sources[(cursor+i)%sources.length]); const existing=getJobs_(), map=Object.fromEntries(existing.map(x=>[x.id,x])), now=nowIso_(); batch.forEach(source=>{processed++; try { const html=fetchHtml_(source.url); const found=source.parserType==='search'?parseSearchPage_(html,source):parseTablePage_(html,source); found.forEach(job=>{const old=map[job.id]||{}; const merged=Object.assign({},old,job,{firstSeenAt:old.firstSeenAt||now,updatedAt:now,active:true,detailsStatus:old.detailsStatus||'pending',detailsUpdatedAt:old.detailsUpdatedAt||''}); merged.contentHash=hash_(JSON.stringify([merged.title,merged.board,merged.qualification,merged.lastDate,merged.url])); if(!old.id||old.contentHash!==merged.contentHash)changed++; map[job.id]=merged;}); updateSourceStatus_(source.sourceId,true,found.length,''); } catch(e){errors.push(source.sourceId+': '+e.message);updateSourceStatus_(source.sourceId,false,0,e.message);} }); cursor=(cursor+batch.length)%sources.length; let jobs=Object.values(map).sort((a,b)=>String(a.lastDate||'9999-12-31').localeCompare(String(b.lastDate||'9999-12-31'))).slice(0,CONFIG.maxJobs); saveJobs_(jobs); setState_('sourceCursor',cursor); setState_('updatedAt',now); setState_('jobCount',jobs.length); setState_('version',String(Date.now())); logRun_('listing',started,processed,changed,errors); } finally {setState_('scraping','false');lock.releaseLock();} }
function updateSourceStatus_(id,ok,count,error) { const sh=ensureSheet_(CONFIG.sourcesSheet,SOURCE_HEADERS), rows=rowsAsObjects_(sh,SOURCE_HEADERS), now=nowIso_(); rows.forEach(x=>{if(x.sourceId===id){x.lastRunAt=now;if(ok){x.lastSuccessAt=now;x.lastJobCount=count;x.consecutiveFailures=0;x.lastError='';}else{x.consecutiveFailures=Number(x.consecutiveFailures||0)+1;x.lastError=String(error).slice(0,1000);}}}); replaceData_(sh,SOURCE_HEADERS,rows); }
function runDetailsBatch() {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) throw new Error('Could not obtain scraper lock. Run details again after the listing batch finishes.');
  const started = nowIso_(), startedMs = Date.now(), errors = [];
  let changed = 0, processed = 0, remaining = 0;
  try {
    setState_('detailsRunning', 'true');
    const jobs = getJobs_().filter(x => String(x.active).toLowerCase() !== 'false');
    const details = getDetails_();
    const map = Object.fromEntries(details.map(x => [x.jobId, x]));
    const allPending = jobs.filter(x => x.url && (!map[x.id] || x.detailsStatus !== 'ready'));
    const queue = allPending.slice(0, CONFIG.detailBatchSize);
    for (let index = 0; index < queue.length; index++) {
      if (Date.now() - startedMs >= CONFIG.detailMaxRuntimeMs) {
        remaining = queue.length - index;
        break;
      }
      const job = queue[index];
      processed++;
      try {
        const row = parseJobDetails_(fetchDetailHtml_(job.url), job.url, job.id);
        map[job.id] = row;
        job.detailsStatus = 'ready';
        job.detailsUpdatedAt = row.scrapedAt;
        changed++;
      } catch (e) {
        job.detailsStatus = 'failed';
        errors.push(job.id + ': ' + e.message);
      }
      Utilities.sleep(CONFIG.detailRequestDelayMs);
    }
    saveDetails_(Object.values(map));
    saveJobs_(getJobs_().map(x => jobs.find(j => j.id === x.id) || x));
    setState_('detailsUpdatedAt', nowIso_());
    setState_('detailCount', Object.keys(map).length);
    remaining += Math.max(0, allPending.length - queue.length);
    setState_('detailsRemaining', remaining);
    logRun_('details', started, processed, changed, errors);
    if (remaining > 0) scheduleDetailsContinuation_();
    return 'Processed ' + processed + ' details; ' + remaining + ' remained in this queue';
  } finally {
    setState_('detailsRunning', 'false');
    lock.releaseLock();
  }
}

function runAllDetails() { return runDetailsBatch(); }

function scheduleDetailsContinuation_() {
  const exists = ScriptApp.getProjectTriggers().some(trigger => trigger.getHandlerFunction() === 'continueDetailsRun');
  if (!exists) ScriptApp.newTrigger('continueDetailsRun').timeBased().after(60 * 1000).create();
}

function continueDetailsRun() {
  ScriptApp.getProjectTriggers()
    .filter(trigger => trigger.getHandlerFunction() === 'continueDetailsRun')
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  return runDetailsBatch();
}
function cleanupData() { const today=Utilities.formatDate(new Date(),Session.getScriptTimeZone(),'yyyy-MM-dd'); const jobs=getJobs_().map(x=>{if(x.lastDate&&x.lastDate<today)x.active=false;return x;}); saveJobs_(jobs); setState_('updatedAt',nowIso_()); }
function doGet(e) { try { const p=(e&&e.parameter)||{}, action=p.action||'health'; if(action==='jobs')return jsonOutput_(apiJobs_(p)); if(action==='snapshot')return jsonOutput_(apiSnapshot_()); if(action==='details_snapshot')return jsonOutput_(apiDetailsSnapshot_()); if(action==='job_details')return jsonOutput_(apiJobDetails_(p)); if(action==='meta')return jsonOutput_(apiMeta_()); if(action==='health')return jsonOutput_({ok:true,status:'healthy',updated_at:getState_('updatedAt',null)}); return jsonOutput_({ok:false,error:'Unknown action'}); } catch(err) { return jsonOutput_({ok:false,error:err.message}); } }
function publicJob_(x) { return {id:x.id,title:x.title||'',board:x.board||'',qualification:x.qualification||'',lastDate:x.lastDate||'',source:x.source||'',url:x.url||'',state:x.state||null,postCount:x.postCount===''?null:Number(x.postCount),location:x.location||null}; }
function activeJobs_() { return getJobs_().filter(x=>String(x.active).toLowerCase()!=='false').map(publicJob_); }
function apiJobs_(p) { let jobs=activeJobs_(); const q=String(p.q||'').toLowerCase(),state=p.state||'',board=p.board||'',qualification=p.qualification||''; if(q)jobs=jobs.filter(x=>JSON.stringify(x).toLowerCase().indexOf(q)>=0); if(state)jobs=jobs.filter(x=>x.state===state);if(board)jobs=jobs.filter(x=>x.board===board);if(qualification)jobs=jobs.filter(x=>String(x.qualification).indexOf(qualification)>=0); if(p.sort==='lastDateDesc')jobs.reverse(); const offset=clamp_(p.offset,0,jobs.length,0),limit=clamp_(p.limit,1,CONFIG.maxApiLimit,50),page=jobs.slice(offset,offset+limit); return {jobs:page,next_offset:offset+limit<jobs.length?offset+limit:null,loading:getState_('scraping','false')==='true',total:jobs.length,updated_at:getState_('updatedAt',null),version:getState_('version','0')}; }
function apiSnapshot_() { const jobs=activeJobs_();return {updated_at:getState_('updatedAt',null),count:jobs.length,jobs:jobs}; }
function apiDetailsSnapshot_() { const rows=getDetails_(),out={};rows.forEach(x=>{if(x.url)out[x.url]=publicDetail_(x);});return {updated_at:getState_('updatedAt',null),count:Object.keys(out).length,details:out}; }
function apiJobDetails_(p) { const row=getDetails_().find(x=>(p.id&&x.jobId===p.id)||(p.url&&x.url===p.url)); if(row)return publicDetail_(row); const job=getJobs_().find(x=>(p.id&&x.id===p.id)||(p.url&&x.url===p.url)); if(!job)return {error:'Job not found',url:p.url||''}; try{return publicDetail_(parseJobDetails_(fetchHtml_(job.url),job.url,job.id));}catch(e){return {url:job.url,html:'',error:e.message};} }
function apiMeta_(){return {name:'GovJob India',updated_at:getState_('updatedAt',null),version:getState_('version','0'),count:Number(getState_('jobCount','0')),loading:getState_('scraping','false')==='true'};}
function resetSources() {
  const source = ensureSheet_(CONFIG.sourcesSheet, SOURCE_HEADERS);
  const definitions = sourceDefinitions_();
  source.clearContents();
  source.getRange(1, 1, 1, SOURCE_HEADERS.length).setValues([SOURCE_HEADERS]);
  source.getRange(2, 1, definitions.length, SOURCE_HEADERS.length).setValues(definitions);
  source.setFrozenRows(1);
  source.getRange(1, 1, 1, SOURCE_HEADERS.length).setFontWeight('bold');
  SpreadsheetApp.flush();
  setState_('sourceCursor', '0');
  return 'Sources reset successfully: ' + definitions.length + ' rows written';
}

function setupProject() {
  ensureSheet_(CONFIG.jobsSheet, JOB_HEADERS);
  ensureSheet_(CONFIG.detailsSheet, DETAIL_HEADERS);
  ensureSheet_(CONFIG.stateSheet, STATE_HEADERS);
  ensureSheet_(CONFIG.runsSheet, RUN_HEADERS);
  const sourceResult = resetSources();
  ScriptApp.getProjectTriggers().forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('runListingBatch').timeBased().everyMinutes(10).create();
  ScriptApp.newTrigger('runDetailsBatch').timeBased().everyMinutes(5).create();
  ScriptApp.newTrigger('cleanupData').timeBased().everyDays(1).atHour(2).create();
  setState_('version', '0');
  setState_('scraping', 'false');
  setState_('detailsRunning', 'false');
  setState_('jobCount', getJobs_().length);
  setState_('detailCount', getDetails_().length);
  return 'GovJob India setup complete. ' + sourceResult;
}

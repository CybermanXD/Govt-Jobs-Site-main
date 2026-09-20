let jobs = [], currentFilteredJobs = [], currentPage = 1, detailsByUrl = {};
const itemsPerPage = 12;
const ALL_STATES = ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'];
const STATE_ALIASES = [
  ['Andhra Pradesh',['andhra pradesh','andhra','amaravati','visakhapatnam','vijayawada','tirupati','korukonda','appsc','apsrtc']],
  ['Arunachal Pradesh',['arunachal pradesh','itanagar','arunachal psc','appsc arunachal']],
  ['Assam',['assam','guwahati','dispur','jorhat','dibrugarh','apsc','assam psc']],
  ['Bihar',['bihar','patna','bpsc','bihar psc','bssc']],
  ['Chhattisgarh',['chhattisgarh','chattisgarh','raipur','bilaspur','cgpsc','cgvyapam']],
  ['Goa',['goa','panaji','goa psc','goa ssc','iit goa']],
  ['Gujarat',['gujarat','ahmedabad','gandhinagar','surat','gpsc','gsssb']],
  ['Haryana',['haryana','gurugram','gurgaon','faridabad','panchkula','hpsc','hssc']],
  ['Himachal Pradesh',['himachal pradesh','shimla','dharamshala','hppsc','hpsssb']],
  ['Jharkhand',['jharkhand','ranchi','jamshedpur','jpsc','jssc']],
  ['Karnataka',['karnataka','bengaluru','bangalore','mysuru','mysore','dharwad','kpsc','kea']],
  ['Kerala',['kerala','thiruvananthapuram','trivandrum','kochi','cochin','kozhikode','kerala psc']],
  ['Madhya Pradesh',['madhya pradesh','bhopal','indore','jabalpur','mppsc','mpesb','mppeb']],
  ['Maharashtra',['maharashtra','mumbai','pune','nagpur','nashik','mpsc','mahatransco','mahadiscom']],
  ['Manipur',['manipur','imphal','manipur psc','mpsc manipur']],
  ['Meghalaya',['meghalaya','shillong','meghalaya psc']],
  ['Mizoram',['mizoram','aizawl','mizoram psc','phed mizoram']],
  ['Nagaland',['nagaland','kohima','dimapur','nagaland psc']],
  ['Odisha',['odisha','orissa','bhubaneswar','bhubaneshwar','cuttack','opsc','osssc','ossc']],
  ['Punjab',['punjab','chandigarh punjab','ludhiana','amritsar','patiala','ppsc','psssb']],
  ['Rajasthan',['rajasthan','jaipur','jodhpur','udaipur','rpsc','rsmssb']],
  ['Sikkim',['sikkim','gangtok','sikkim psc']],
  ['Tamil Nadu',['tamil nadu','chennai','coimbatore','madurai','tnpsc','tnusrb']],
  ['Telangana',['telangana','hyderabad','secunderabad','tspsc','tgpsc']],
  ['Tripura',['tripura','agartala','tpsc','tripura psc']],
  ['Uttar Pradesh',['uttar pradesh','lucknow','prayagraj','allahabad','kanpur','varanasi','noida','uppsc','upsssc','up police']],
  ['Uttarakhand',['uttarakhand','uttaranchal','dehradun','haridwar','ukpsc','uksssc']],
  ['West Bengal',['west bengal','kolkata','calcutta','wbpsc','wbssc']],
  ['Andaman and Nicobar Islands',['andaman and nicobar','port blair']],
  ['Chandigarh',['chandigarh','chandigarh administration']],
  ['Dadra and Nagar Haveli and Daman and Diu',['dadra and nagar haveli','daman and diu','daman','silvassa']],
  ['Delhi',['delhi','new delhi','ncr','dsssb','delhi police']],
  ['Jammu and Kashmir',['jammu and kashmir','jammu & kashmir','jammu','srinagar','jkpsc','jkssb']],
  ['Ladakh',['ladakh','leh','kargil']],
  ['Lakshadweep',['lakshadweep','kavaratti']],
  ['Puducherry',['puducherry','pondicherry']]
];
const $ = id => document.getElementById(id);
const esc = value => String(value ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
const formatDate = value => { if (!value) return 'N/A'; const d = new Date(value); return isNaN(d) ? value : d.toLocaleDateString('en-IN',{year:'numeric',month:'short',day:'numeric'}); };

async function api(path) { const response = await fetch(`/api/${path}`, {headers:{Accept:'application/json'}}); if (!response.ok) throw new Error(`API ${response.status}`); return response.json(); }
function showLoading(show) { const overlay=$('loading-overlay'); if(overlay) overlay.style.display=show?'flex':'none'; }
function normalizedText(value) { return String(value || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,' ').trim(); }
function hasTerm(text, term) { return (` ${text} `).includes(` ${normalizedText(term)} `); }
function canonicalState(value) { const text=normalizedText(value); if(!text)return ''; const exact=STATE_ALIASES.find(([state,aliases])=>normalizedText(state)===text||aliases.some(alias=>normalizedText(alias)===text)); return exact?exact[0]:''; }
function inferJobState(job) {
  const explicit=canonicalState(job.state);
  if(explicit)return explicit;
  const text=normalizedText([job.title,job.board,job.source,job.location].filter(Boolean).join(' | '));
  if(!text)return '';
  const match=STATE_ALIASES.find(([,aliases])=>aliases.some(alias=>hasTerm(text,alias)));
  return match?match[0]:'';
}
function processJob(job, index) { return {...job, id: job.id || `job-${index}`, state: inferJobState(job) || null}; }

async function loadJobs() {
  showLoading(true);
  try {
    const payload = await api('snapshot');
    jobs = (payload.jobs || []).filter(j => !j.lastDate || j.lastDate >= new Date().toISOString().slice(0,10)).map(processJob);
    localStorage.setItem('govjobIndiaJobs', JSON.stringify(jobs));
    populateFilters(); applyFilters();
  } catch (error) {
    jobs = JSON.parse(localStorage.getItem('govjobIndiaJobs') || '[]');
    populateFilters(); applyFilters();
    console.error(error);
  } finally { showLoading(false); }
}

function populateFilters() {
  const fill = (el, values, label) => { const selected=el.value; el.innerHTML=`<option value="">${label}</option>`; values.filter(Boolean).sort().forEach(v=>el.insertAdjacentHTML('beforeend',`<option value="${esc(v)}">${esc(v)}</option>`)); el.value=selected; };
  fill($('board'), [...new Set(jobs.map(j=>j.board))], 'Recruitment Board/State');
  fill($('qualification'), [...new Set(jobs.map(j=>j.qualification))], 'Qualification');
  fill($('state'), ALL_STATES, 'State');
}

function applyFilters() {
  const q=$('keyword').value.trim().toLowerCase(), qualification=$('qualification').value, state=$('state').value, board=$('board').value, month=$('month-filter').value;
  currentFilteredJobs=jobs.filter(j=>{
    const blob=JSON.stringify(j).toLowerCase();
    let monthOk=true;
    if(month&&j.lastDate){const d=new Date(j.lastDate),now=new Date(),offset=month==='this'?0:month==='next'?1:2,target=new Date(now.getFullYear(),now.getMonth()+offset,1);monthOk=d.getFullYear()===target.getFullYear()&&d.getMonth()===target.getMonth();}
    return (!q||blob.includes(q))&&(!qualification||j.qualification===qualification)&&(!state||j.state===state)&&(!board||j.board===board)&&monthOk;
  });
  currentFilteredJobs.sort((a,b)=>new Date(a.lastDate||'9999-12-31')-new Date(b.lastDate||'9999-12-31'));
  if($('sort-options').value==='lastDateDesc')currentFilteredJobs.reverse();
  currentPage=1; render();
}

function render() {
  const start=(currentPage-1)*itemsPerPage, page=currentFilteredJobs.slice(start,start+itemsPerPage);
  $('results-count').textContent=`${currentFilteredJobs.length} Job${currentFilteredJobs.length===1?'':'s'} Found`;
  $('jobs-list').innerHTML=page.map(j=>`<article class="job-card"><h3>${esc(j.title)}</h3><div class="job-meta"><strong>Board:</strong> ${esc(j.board)}</div><div class="job-meta"><strong>Qualification:</strong> ${esc(j.qualification)}</div><div class="job-meta"><strong>Last Date:</strong> ${esc(formatDate(j.lastDate))}</div><button class="btn-details" data-id="${esc(j.id)}">View Details</button></article>`).join('');
  document.querySelectorAll('.btn-details').forEach(b=>b.addEventListener('click',()=>openModal(b.dataset.id)));
  const pages=Math.ceil(currentFilteredJobs.length/itemsPerPage); $('pagination').innerHTML=pages>1?`<button id="prev" ${currentPage===1?'disabled':''}>Prev</button><select id="page-select" class="pagination-select">${Array.from({length:pages},(_,i)=>`<option value="${i+1}" ${i+1===currentPage?'selected':''}>Page ${i+1} of ${pages}</option>`).join('')}</select><button id="next" ${currentPage===pages?'disabled':''}>Next</button>`:'';
  if($('prev'))$('prev').onclick=()=>{currentPage--;render();}; if($('next'))$('next').onclick=()=>{currentPage++;render();}; if($('page-select'))$('page-select').onchange=e=>{currentPage=Number(e.target.value);render();};
}

function list(title, values, ordered=false) { if(!Array.isArray(values)||!values.length)return ''; const tag=ordered?'ol':'ul';return `<div><h4>${esc(title)}</h4><${tag}>${values.map(x=>`<li>${esc(typeof x==='object'?JSON.stringify(x):x)}</li>`).join('')}</${tag}></div>`; }
function validHttpUrl(value) { try { const url=new URL(value); return url.protocol==='https:'||url.protocol==='http:'; } catch { return false; } }
function uniqueDates(data, job) {
  const values=[], seen=new Set();
  const add=(label,value,formatted=false)=>{if(!value)return;const normalized=String(value).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const dateKey=(String(value).match(/\d{4}-\d{2}-\d{2}/)||String(value).match(/\d{1,2}\s+[a-z]+\s+\d{4}/i)||[])[0]||normalized;if(seen.has(normalized)||seen.has(dateKey))return;seen.add(normalized);seen.add(dateKey);values.push(`${label}: ${formatted?formatDate(value):value}`);};
  add('Start Date to Apply',data.startDate,true);add('Last Date to Apply',data.lastDate||job.lastDate,true);
  (Array.isArray(data.importantDates)?data.importantDates:[]).forEach(item=>{const text=typeof item==='object'?`${item.label||''}: ${item.value||''}`:String(item);const normalized=text.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();const dateKey=(text.match(/\d{4}-\d{2}-\d{2}/)||text.match(/\d{1,2}\s+[a-z]+\s+\d{4}/i)||[])[0]||normalized;if(!seen.has(normalized)&&!seen.has(dateKey)){seen.add(normalized);seen.add(dateKey);values.push(text);}});return values;
}
function mergeJobDetails(job, detail) { const data=detail&&typeof detail==='object'?detail:{};return {...data,companyName:data.companyName||job.board||'',postName:data.postName||job.title||'',noOfPosts:data.noOfPosts||job.postCount||'',qualification:data.qualification||job.qualification||'',lastDate:data.lastDate||job.lastDate||'',url:data.url||job.url||''}; }
async function openModal(id) {
  const job=jobs.find(j=>j.id===id); if(!job)return;
  ['title','board','qualification','postname','postcount','salary','agelimit','company','advt','source'].forEach(key=>{const el=$(`modal-${key}`);if(el)el.textContent='N/A';});
  $('modal-title').textContent=job.title;$('modal-board').textContent=job.board||'N/A';$('modal-qualification').textContent=job.qualification||'N/A';$('modal-postname').textContent=job.title;$('modal-postcount').textContent=job.postCount||'N/A';$('modal-source').innerHTML=job.url?`<a target="_blank" rel="noopener noreferrer" href="${esc(job.url)}">${esc(job.source)}</a>`:esc(job.source);
  $('modal-details').innerHTML='<p>Loading details…</p>';['modal-important-dates','modal-selection-process','modal-general-instructions','modal-how-to-apply','modal-important-links'].forEach(x=>$(x).innerHTML='');
  $('modal-link-wrapper').innerHTML=job.url?`<a target="_blank" rel="noopener noreferrer" href="${esc(job.url)}">View Job Posting Source</a>`:'';$('job-modal').style.display='flex';document.body.style.overflow='hidden';
  try { const response=detailsByUrl[job.url]||await api(`job_details?id=${encodeURIComponent(job.id)}`);if(response&&response.error)throw new Error(response.error);const data=mergeJobDetails(job,response);detailsByUrl[job.url]=response;
    $('modal-company').textContent=data.companyName||'N/A';$('modal-postname').textContent=data.postName||job.title;$('modal-postcount').textContent=data.noOfPosts||job.postCount||'N/A';$('modal-advt').textContent=data.advtNo||'N/A';$('modal-salary').textContent=data.salary||'N/A';$('modal-qualification').textContent=data.qualification||job.qualification||'N/A';$('modal-agelimit').textContent=Array.isArray(data.ageLimit)?data.ageLimit.join(', '):(data.ageLimit||'N/A');
    $('modal-details').innerHTML=list('Salary/Stipend',data.salaryDetails)+list('Eligibility Criteria',data.eligibility)+list('Essential Requirements',data.desirableSkills)+list('Experience',data.experience);
    $('modal-important-dates').innerHTML=list('Important Dates',uniqueDates(data,job));
    $('modal-selection-process').innerHTML=list('Selection Process',data.selectionProcess);$('modal-general-instructions').innerHTML=list('General Instructions',data.generalInstructions);$('modal-how-to-apply').innerHTML=list('How to Apply',data.howToApply,true);
    const links=(Array.isArray(data.importantLinks)?data.importantLinks:[]).filter(x=>x&&validHttpUrl(x.url));$('modal-important-links').innerHTML=links.length?`<h4>Important Links</h4><ul>${links.map(x=>`<li>${esc(x.label||'')} <a target="_blank" rel="noopener noreferrer" href="${esc(x.url)}">${esc(x.display||x.url)}</a></li>`).join('')}</ul>`:`<p>${esc(data.officialNotificationStatus||'')}</p>`;
  } catch(e){console.error('Unable to load job details',e);$('modal-details').innerHTML=`<p>Details are temporarily unavailable. Listing information is shown above.</p>`;$('modal-important-dates').innerHTML=list('Important Dates',uniqueDates({},job));}
}
function closeModal(){$('job-modal').style.display='none';document.body.style.overflow='';}
$('search-btn').onclick=applyFilters;$('sort-options').onchange=applyFilters;['state','board','qualification','month-filter'].forEach(x=>$(x).onchange=applyFilters);$('clear-filters').onclick=()=>{['keyword','qualification','state','board','month-filter'].forEach(x=>$(x).value='');$('sort-options').value='lastDateAsc';applyFilters();};$('modal-close').onclick=closeModal;$('modal-back').onclick=closeModal;$('job-modal').onclick=e=>{if(e.target===$('job-modal'))closeModal();};
loadJobs(); setInterval(loadJobs,5*60*1000);

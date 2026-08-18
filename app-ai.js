(function(){
  const SENSITIVE_NAME=/\b(name|nombre|apellido|email|correo|e-mail|phone|telefono|teléfono|celular|mobile|ssn|social security|seguro social|id|identificacion|identificación|student id|employee id|direccion|dirección|address|dob|birth|nacimiento|password|contraseña|cuenta|account)\b/i;
  const EMAIL=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const PHONE=/\+?\d[\d\s().-]{7,}/;

  function median(values){const a=[...values].sort((x,y)=>x-y);if(!a.length)return null;const m=Math.floor(a.length/2);return a.length%2?a[m]:(a[m-1]+a[m])/2;}
  function quantile(values,q){const a=[...values].sort((x,y)=>x-y);if(!a.length)return null;const pos=(a.length-1)*q,base=Math.floor(pos),rest=pos-base;return a[base+1]!==undefined?a[base]+rest*(a[base+1]-a[base]):a[base];}
  function topValues(values,limit=6){const m=new Map();values.forEach(v=>{const k=String(v??'').trim();if(k)m.set(k,(m.get(k)||0)+1)});return [...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,limit).map(([value,count])=>({value:value.slice(0,100),count}));}
  function looksSensitive(header,values){if(SENSITIVE_NAME.test(String(header)))return true;const sample=values.filter(v=>String(v??'').trim()).slice(0,12).map(v=>String(v));if(sample.some(v=>EMAIL.test(v.trim())))return true;if(sample.filter(v=>PHONE.test(v)).length>=Math.max(2,Math.ceil(sample.length*.5)))return true;return false;}
  function safeScalar(v){if(v===null||v===undefined)return null;const text=String(v).trim();if(!text)return null;return text.length>120?text.slice(0,117)+'…':text;}
  function buildDatasetSummary(dataset){
    if(!dataset?.rows?.length)throw new Error('No hay datos disponibles para analizar.');
    const rowCount=dataset.rows.length;
    const columns=dataset.headers.map(header=>{
      const raw=dataset.rows.map(r=>r[header]);
      const nonEmpty=raw.filter(v=>String(v??'').trim()!=='');
      const nums=raw.map(v=>numericValue(v)).filter(Number.isFinite);
      const sensitive=looksSensitive(header,raw);
      const numericRatio=rowCount?nums.length/rowCount:0;
      const base={name:String(header).slice(0,120),type:numericRatio>=.7?'numeric':'categorical_or_text',non_empty:nonEmpty.length,missing:rowCount-nonEmpty.length,missing_pct:Number((((rowCount-nonEmpty.length)/Math.max(1,rowCount))*100).toFixed(2)),pii_redacted:sensitive};
      if(numericRatio>=.7&&nums.length){const mean=nums.reduce((a,b)=>a+b,0)/nums.length;Object.assign(base,{numeric_count:nums.length,min:Math.min(...nums),max:Math.max(...nums),mean:Number(mean.toFixed(6)),median:median(nums),q1:quantile(nums,.25),q3:quantile(nums,.75)});}
      else if(!sensitive){base.unique_approx=new Set(nonEmpty.slice(0,5000).map(v=>String(v))).size;base.top_values=topValues(nonEmpty);}
      return base;
    });
    const sampleRows=[];
    for(const row of dataset.rows.slice(0,8)){const safe={};for(const h of dataset.headers){const col=columns.find(c=>c.name===String(h).slice(0,120));safe[h]=col?.pii_redacted?'[REDACTED]':safeScalar(row[h]);}sampleRows.push(safe);}
    return {dataset:{name:dataset.name||'Datos',source_name:dataset.sourceName||state.sourceName||'',source_type:dataset.sourceType||state.sourceType||'',rows:rowCount,columns:dataset.headers.length},columns,sample_rows:sampleRows,privacy_note:'Columns likely to contain personal identifiers are redacted from samples before AI inference.'};
  }
  function itemClass(level){return ['high','medium'].includes(level)?level:'';}
  function renderList(title,items,mapper){if(!Array.isArray(items)||!items.length)return '';return `<section class="ai-section"><h3>${escapeHtml(title)}</h3><ul class="ai-list">${items.map(mapper).join('')}</ul></section>`;}
  function renderAnalysis(payload){
    const a=payload.analysis||payload,box=$('#aiResults');
    const findings=renderList('Hallazgos clave',a.key_findings,x=>`<li class="ai-item ${itemClass(x.importance)}"><strong>${escapeHtml(x.title)}</strong><small>${escapeHtml(x.detail)}</small></li>`);
    const anomalies=renderList('Anomalías o puntos que requieren revisión',a.anomalies,x=>`<li class="ai-item ${itemClass(x.severity)}"><strong>${escapeHtml(x.field)}</strong><small>${escapeHtml(x.detail)}</small></li>`);
    const recs=renderList('Recomendaciones',a.recommendations,x=>`<li class="ai-item ${itemClass(x.priority)}"><strong>${escapeHtml(x.action)}</strong><small>${escapeHtml(x.rationale)}</small></li>`);
    const quality=renderList('Calidad de los datos',a.data_quality,x=>`<li class="ai-item"><strong>${escapeHtml(x.issue)}</strong><small>${escapeHtml(x.impact)} ${escapeHtml(x.suggestion)}</small></li>`);
    const visuals=renderList('Visualizaciones sugeridas',a.suggested_visualizations,x=>`<li class="ai-item"><strong>${escapeHtml(x.type)} · ${escapeHtml(x.x)} / ${escapeHtml(x.y)}</strong><small>${escapeHtml(x.reason)}</small></li>`);
    const caveats=renderList('Limitaciones',a.caveats,x=>`<li class="ai-item"><small>${escapeHtml(x)}</small></li>`);
    box.innerHTML=`<div class="ai-summary"><div class="eyebrow">Resumen ejecutivo</div>${escapeHtml(a.executive_summary||'Sin resumen disponible.')}</div>${findings}${anomalies}${recs}${quality}${visuals}${caveats}<div class="ai-meta"><span class="pill">${escapeHtml(payload.model||'IA')}</span><span class="pill">Datos resumidos</span></div>`;
    state.aiAnalysis={analysis:a,model:payload.model||'Groq'};
  }
  async function analyzeCurrentDataset(){
    const dataset=state.datasets?.[state.activeIndex];
    if(!dataset){notify('Primero carga un archivo o el demo.',true);return;}
    if(!state.user){notify('Debes iniciar sesión para utilizar el análisis con IA.',true);return;}
    const btn=$('#analyzeAiBtn'),box=$('#aiResults');btn.disabled=true;btn.innerHTML='<span class="spinner" aria-hidden="true"></span> Analizando';box.innerHTML='<div class="ai-loader"><span class="spinner" aria-hidden="true"></span><span>Preparando estadísticas y solicitando el análisis…</span></div>';
    try{
      const summary=buildDatasetSummary(dataset),question=($('#aiQuestion')?.value||'').trim();
      const {data,error}=await sb.functions.invoke('ai-analyze',{body:{summary,question}});
      if(error){let msg=error.message||'No fue posible analizar los datos.';try{if(error.context){const body=await error.context.json();msg=body?.error||msg;}}catch(_){ }throw new Error(msg);}
      if(data?.error)throw new Error(data.error);
      renderAnalysis(data);notify('Análisis con IA completado.');
    }catch(err){const message=String(err?.message||err);const setup=message.includes('GROQ_API_KEY')?'<br><br><strong>Falta configurar la clave gratuita de Groq en Supabase.</strong>':'';box.innerHTML=`<div class="notice error">${escapeHtml(message)}${setup}</div>`;notify('El análisis con IA no pudo completarse.',true);}
    finally{btn.disabled=false;btn.textContent='✦ Analizar con IA';}
  }
  function clearAnalysis(){state.aiAnalysis=null;$('#aiQuestion').value='';$('#aiResults').innerHTML='<div class="ai-empty">El análisis fue limpiado. Puedes ejecutar uno nuevo cuando quieras.</div>';}
  $('#analyzeAiBtn')?.addEventListener('click',analyzeCurrentDataset);$('#clearAiBtn')?.addEventListener('click',clearAnalysis);window.DashboardAI={analyzeCurrentDataset,buildDatasetSummary,renderAnalysis};
})();

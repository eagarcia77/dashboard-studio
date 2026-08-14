import * as p from "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs";
window.pdfjsLib=p;
p.GlobalWorkerOptions.workerSrc="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
async function loadClassic(src){await new Promise((resolve,reject)=>{const s=document.createElement("script");s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));document.body.appendChild(s)})}
try{await loadClassic("app-account.js");await loadClassic("app-dashboard.js");await loadClassic("app-ui.js")}catch(error){console.error(error);const status=document.getElementById("authStatus");if(status){status.textContent="No se pudo iniciar la aplicación. Recarga la página.";status.classList.add("error")}}
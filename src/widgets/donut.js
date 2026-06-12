import { $ } from '../core/utils.js';

export function renderDonut(canvasId, segments, size=80) {
  const c=$(canvasId); if(!c||!c.getContext)return;
  c.width=size; c.height=size;
  const ctx=c.getContext('2d'), cx=size/2, cy=size/2, r=size*.38, lw=size*.12;
  ctx.clearRect(0,0,size,size);
  const total=segments.reduce((s,x)=>s+x.value,0);
  if(!total){
    ctx.beginPath(); ctx.arc(cx,cy,r,0,Math.PI*2);
    ctx.strokeStyle='rgba(34,197,94,0.1)'; ctx.lineWidth=lw; ctx.stroke(); return;
  }
  let angle=-Math.PI/2;
  segments.forEach(seg=>{
    const sweep=(seg.value/total)*Math.PI*2;
    ctx.beginPath(); ctx.arc(cx,cy,r,angle,angle+sweep);
    ctx.strokeStyle=seg.color||'#22c55e'; ctx.lineWidth=lw; ctx.lineCap='round'; ctx.stroke();
    angle+=sweep+0.02;
  });
}

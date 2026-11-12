const EMAIL = 'manasses.borges@gmail.com';
const enc = new TextEncoder();
async function equal(a, b) {
  const [x,y] = await Promise.all([a,b].map(v=>crypto.subtle.digest('SHA-256',enc.encode(v))));
  const aa=new Uint8Array(x), bb=new Uint8Array(y);
  let diff=0; for(let i=0;i<aa.length;i++) diff |= aa[i]^bb[i];
  return diff===0;
}
function locked() {
  return new Response('Demonstração privada. Entre com seu e-mail e senha para continuar.', {
    status:401, headers:{'WWW-Authenticate':'Basic realm="Demonstracao privada Borges Inovatech", charset="UTF-8"','Content-Type':'text/plain; charset=utf-8','Cache-Control':'private, no-store','X-Robots-Tag':'noindex, nofollow, noarchive','X-Content-Type-Options':'nosniff'}
  });
}
export default {
  async fetch(request, env) {
    const header=request.headers.get('Authorization')||'';
    if(!env.DEMO_PASSWORD || !header.startsWith('Basic ') || header.length>4096) return locked();
    let user='', password='';
    try {
      const decoded=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(header.slice(6)),c=>c.charCodeAt(0)));
      const colon=decoded.indexOf(':');
      if(colon<0) return locked();
      user=decoded.slice(0,colon);password=decoded.slice(colon+1);
    }catch{return locked();}
    const [validUser,validPassword]=await Promise.all([equal(user,EMAIL),equal(password,env.DEMO_PASSWORD)]);
    if(!validUser||!validPassword) return locked();
    const headers=new Headers(request.headers); headers.delete('Authorization');
    const result=await env.ASSETS.fetch(new Request(request,{headers}));
    const response=new Response(result.body,result);
    response.headers.set('Cache-Control','private, no-store');
    response.headers.set('X-Robots-Tag','noindex, nofollow, noarchive');
    response.headers.set('X-Content-Type-Options','nosniff');
    return response;
  }
};

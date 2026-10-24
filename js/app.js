(() => {
'use strict';
const IP = '203.0.113.25';
const $ = id => document.getElementById(id);
const S = [
{t:'AWS EC2',s:'Launch the server',focus:['ec2'],flow:'',pv:'down',
 simple:'EC2 is a computer you rent from Amazon. Think of it as an empty room where your website will live.',
 tech:'An EC2 instance is a virtual machine on AWS hardware. Pick the AMI (Amazon Linux 2023), an instance type (t3.micro), a key pair and a public subnet with a public IPv4.',
 tip:'Interview: "What is an AMI?" A template (OS + software) used to start an instance.',
 term:['# AWS Console > EC2 > Launch instance','AMI ........ Amazon Linux 2023','Type ....... t3.micro','Key pair ... mayur-key.pem','Subnet ..... public (auto-assign public IP)','State ...... running','Public IPv4  '+IP]},
{t:'Security Group',s:'Open ports 80 and 22',focus:['sg','gate'],flow:'',pv:'down',
 simple:'A security group is a bouncer at the door. Only the doors you open (ports) let visitors in.',
 tech:'A stateful virtual firewall attached to the instance network interface. Inbound: HTTP 80 from 0.0.0.0/0 (public website) and SSH 22 from YOUR IP/32 only. Return traffic is allowed automatically.',
 tip:'Never open port 22 to 0.0.0.0/0. Security groups only ALLOW; NACLs are stateless and can DENY.',
 term:['Inbound rules','Type   Protocol  Port  Source','HTTP   TCP       80    0.0.0.0/0','SSH    TCP       22    <your-ip>/32','','Outbound: all traffic (default)']},
{t:'Connect to EC2',s:'SSH from a terminal',focus:['ssh','ec2'],flow:'ssh',pv:'down',
 simple:'SSH is a secure remote control. You type commands on your laptop, they run on the server.',
 tech:'SSH uses port 22 and your private key. The server checks the matching public key. Amazon Linux 2023 default user is ec2-user.',
 tip:'"Permission denied (publickey)": wrong user, wrong key, or key file not chmod 400.',
 term:['$ chmod 400 mayur-key.pem','$ ssh -i mayur-key.pem ec2-user@'+IP,'','   ,     #_','   ~\\_  ####_      Amazon Linux 2023','[ec2-user@ip-10-0-1-25 ~]$']},
{t:'Install NGINX',s:'sudo dnf install nginx -y',focus:['nginx'],flow:'',pv:'down',
 simple:'NGINX (say "engine-x") is the program that answers web visitors. We install it like an app.',
 tech:'dnf is the package manager on Amazon Linux 2023. It downloads NGINX from the AWS repo and installs the binary, config in /etc/nginx and default web root.',
 tip:'AL2 used yum; AL2023 uses dnf. Both names often work.',
 term:['$ sudo dnf install nginx -y','Installing:  nginx   x86_64  1.28','Transaction Summary','Install  1 Package','Downloading Packages... ','Complete!','$ nginx -v','nginx version: nginx/1.28']},
{t:'Start NGINX',s:'systemctl enable --now',focus:['nginx','status'],flow:'',pv:'welcome',
 simple:'Installing is not enough. We must switch it on, and tell the server to switch it on again after every reboot.',
 tech:'systemctl talks to systemd. "enable" starts at boot, "--now" starts immediately. NGINX listens on TCP port 80 and serves /usr/share/nginx/html.',
 tip:'Know the difference: start (now), enable (at boot), status (check).',
 term:['$ sudo systemctl enable --now nginx','Created symlink ... nginx.service','$ systemctl status nginx','● nginx.service - The nginx HTTP server','   Active: active (running)','$ curl -I http://localhost','HTTP/1.1 200 OK']},
{t:'Website Files',s:'/usr/share/nginx/html/',focus:['files'],flow:'',pv:'files',
 simple:'A website is just files in a folder. NGINX hands them to visitors. We copy our Netflix-style files into its folder.',
 tech:'Default web root: /usr/share/nginx/html. NGINX reads index.html first. The CSS, JS and images are separate files the browser requests afterwards.',
 tip:'403 Forbidden often means wrong file permissions or missing index.html.',
 term:['$ scp -i mayur-key.pem -r site ec2-user@'+IP+':~/','$ sudo cp -r ~/site/* /usr/share/nginx/html/','$ sudo chmod -R 755 /usr/share/nginx/html','$ ls /usr/share/nginx/html','index.html  css  js  assets']},
{t:'Browser Request',s:'Visitor opens the IP',focus:['browser','net','igw','gate'],flow:'req',pv:'load',
 simple:'A visitor types the server address. The request travels the internet to your door (port 80).',
 tech:'Browser opens a TCP connection to IP:80 (3-way handshake), sends GET / HTTP/1.1. It crosses the Internet Gateway, the route table sends it to the subnet, and the security group checks port 80.',
 tip:'Order: Internet > IGW > route table > NACL > security group > instance > NGINX.',
 term:['Browser > http://'+IP,'TCP SYN > SYN-ACK > ACK','','GET / HTTP/1.1','Host: '+IP,'Accept: text/html','','Security group: port 80 ALLOWED']},
{t:'NGINX Response',s:'Landing page appears',focus:['nginx','files','browser'],flow:'res req',pv:'site',
 simple:'NGINX finds index.html and sends it back. The browser then asks for the CSS, JS and images and draws the page.',
 tech:'Status 200 OK with Content-Type: text/html. The browser parses HTML, sees <link>, <script> and <img>, and sends more GET requests which NGINX serves from disk.',
 tip:'Static content = NGINX just reads files. Dynamic content needs an app server behind it.',
 term:['HTTP/1.1 200 OK','Server: nginx','Content-Type: text/html','','GET /css/style.css  200','GET /js/app.js      200','GET /assets/hero.svg 200','Page rendered ✔']},
{t:'Troubleshooting',s:'Site not loading?',focus:['checks','nginx','gate'],flow:'req res',pv:'site',
 simple:'If the page will not open, check four things in order, from the server outward.',
 tech:'1) Is NGINX listening on port 80? 2) Does the security group allow 80? 3) Is the service active? 4) Are you using the current public IP? Test locally with curl first to split server vs network problems.',
 tip:'curl works on localhost but not from the internet = security group, NACL, or public IP problem.',
 term:['1 $ sudo ss -tlnp | grep :80','  LISTEN 0.0.0.0:80 nginx','2 Security group inbound: HTTP 80 0.0.0.0/0','3 $ sudo systemctl status nginx','  Active: active (running)','4 Public IP changed after stop/start? Use Elastic IP','$ curl http://localhost','<title>Streamflix</title>']}
];
const svg = $('diagram'), NS = 'http://www.w3.org/2000/svg';
function packets(path, cls, labels, n, dur) {
  for (let i = 0; i < n; i++) {
    const g = document.createElementNS(NS, 'g'); g.setAttribute('class', 'pk ' + cls);
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', -24); r.setAttribute('y', -9); r.setAttribute('width', 48); r.setAttribute('height', 18); r.setAttribute('rx', 4);
    const t = document.createElementNS(NS, 'text'); t.setAttribute('text-anchor', 'middle'); t.setAttribute('y', 4); t.textContent = labels[i % labels.length];
    const a = document.createElementNS(NS, 'animateMotion');
    a.setAttribute('dur', dur + 's'); a.setAttribute('begin', (i * dur / n) + 's'); a.setAttribute('repeatCount', 'indefinite');
    const m = document.createElementNS(NS, 'mpath'); m.setAttribute('href', '#' + path);
    a.appendChild(m); g.append(r, t, a); svg.appendChild(g);
  }
}
packets('req', 'req', ['GET /', 'HTTP', 'TCP:80'], 3, 3.6);
packets('res', 'res', ['200 OK', 'html', 'css', 'js'], 4, 4);
packets('ssh', 'ssh', ['SSH', 'key'], 2, 3.6);

let cur = 0, playing = true, timer = null, typer = null, tick = null, started = 0;
const nav = $('steps');
S.forEach((s, i) => {
  const b = document.createElement('button');
  b.innerHTML = '<b>' + (i + 1) + '</b><span>' + s.t + '<small>' + s.s + '</small></span>';
  b.addEventListener('click', () => { go(i); restart(); });
  nav.appendChild(b);
});
const esc = x => x.replace(/&/g, '&amp;').replace(/</g, '&lt;');
function colour(l) {
  if (/^\s*(#|\$)/.test(l)) return '<span class="c">' + esc(l) + '</span>';
  if (/denied|403|error/i.test(l)) return '<span class="e">' + esc(l) + '</span>';
  return esc(l);
}
const POSTERS = [['Midnight Cloud','#5b0f8a,#14031f'],['Packet Heist','#b20710,#2a0003'],['Red Subnet','#c2410c,#1c0a02'],['Edge Cases','#0e7490,#02161c'],['Load Balancer','#15803d,#03160a'],['Latency','#a16207,#1c1202'],['Ping Pong','#be185d,#1f0310'],['Root Access','#1d4ed8,#030a1f']];
function site() {
  return '<div class="hero"><div class="nav"><span class="logo">STREAMFLIX</span><a>Home</a><a>Series</a><a>Movies</a><a class="sign">Sign in</a></div>' +
    '<h1>Unlimited movies, shows and more</h1><p>Watch anywhere. Cancel anytime.</p>' +
    '<div class="cta"><input placeholder="Email address" aria-label="Email"><button id="gs">Get started ›</button></div></div>' +
    '<div class="row"><h3>Trending now</h3><div class="posters">' +
    POSTERS.map(p => '<div class="poster" style="background:linear-gradient(160deg,' + p[1] + ')">' + p[0] + '</div>').join('') +
    '</div></div><div class="toast" id="toast">Served by NGINX from /usr/share/nginx/html/</div>';
}
function preview(k) {
  const p = $('preview'); $('url').textContent = 'http://' + IP;
  const M = {
    down: '<div class="err"><h3>This site can’t be reached</h3><p>' + IP + ' refused to connect.</p><small>ERR_CONNECTION_REFUSED (nothing is listening on port 80 yet)</small></div>',
    welcome: '<div class="welcome"><h2>Welcome to nginx!</h2><p>If you see this page, nginx is successfully installed and working.</p><small>Default page. Now add our own files.</small></div>',
    files: '<div class="listing"><b>/usr/share/nginx/html/</b><br>📄 index.html<br>🎨 css/style.css<br>⚙ js/app.js<br>🖼 assets/hero.svg<br><br>Files are in place.</div>',
    load: '<div class="load"><b>Connecting to ' + IP + '…</b><i></i><small>Waiting for NGINX to respond</small></div>',
    site: site()
  };
  p.innerHTML = M[k];
  const g = $('gs'); if (g) g.onclick = () => { $('toast').textContent = 'Demo only: no real sign-up happens.'; };
}
function go(i) {
  cur = i; const s = S[i];
  [...nav.children].forEach((b, j) => { b.classList.toggle('on', j === i); b.classList.toggle('done', j < i); });
  svg.querySelectorAll('[data-min]').forEach(n => {
    n.classList.toggle('off', i + 1 < +n.dataset.min);
    n.classList.toggle('focus', s.focus.some(f => n.id === 'n-' + f));
  });
  svg.dataset.flow = s.flow;
  $('inst').setAttribute('width', i === 3 ? 0 : 84);
  if (i === 3) { $('inst').animate([{ width: '0px' }, { width: '84px' }], { duration: 2500, fill: 'forwards' }); }
  $('caption').innerHTML = '<h2><span>Step ' + (i + 1) + ' of 9:</span> ' + s.t + '</h2><div class="cols"><div><h4>In simple words</h4><p>' + s.simple + '</p></div><div><h4>Technical view</h4><p>' + s.tech + '</p></div></div><div class="tip">' + s.tip + '</div>';
  $('ttl').textContent = 'step ' + (i + 1) + ' - ' + s.t;
  typeLines(s.term); preview(s.pv);
}
function typeLines(lines) {
  clearInterval(typer); const out = $('term'); out.innerHTML = ''; let n = 0;
  typer = setInterval(() => {
    if (n >= lines.length) return clearInterval(typer);
    out.innerHTML += colour(lines[n++]) + '\n';
  }, 420);
}
function restart() {
  clearInterval(timer); clearInterval(tick); $('prog').style.width = '0';
  if (!playing) return;
  started = Date.now();
  tick = setInterval(() => { $('prog').style.width = Math.min(100, (Date.now() - started) / 50) + '%'; }, 100);
  timer = setInterval(() => { go((cur + 1) % S.length); started = Date.now(); }, 5000);
}
$('play').onclick = () => { playing = !playing; $('play').textContent = playing ? '⏸ Pause' : '▶ Play'; restart(); };
$('reset').onclick = () => { playing = true; $('play').textContent = '⏸ Pause'; go(0); restart(); };
$('theme').onclick = () => { const h = document.documentElement; h.dataset.theme = h.dataset.theme === 'dark' ? 'light' : 'dark'; };
go(0); restart();
})();

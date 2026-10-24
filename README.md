# Nginx Server visual  #Buildwithmayur

An animated, beginner-friendly visual showing how **NGINX on an AWS EC2 instance** serves a Netflix-inspired landing page, from browser to files. Built for AWS Cloud Support Engineer interview prep.

Pure HTML, CSS and JavaScript. **No build step, no dependencies.**

> Unofficial educational demo. "Streamflix" is an original, Netflix-inspired design. It uses no Netflix code, logos or artwork and is not affiliated with Netflix. `203.0.113.25` is a documentation example IP.

## Run locally
Open `index.html` in a browser, or run `python3 -m http.server 8000` and visit http://localhost:8000.

## The 9 steps
1. AWS EC2  2. Security Group  3. Connect (SSH)  4. Install NGINX  5. Start NGINX  6. Website files  7. Browser request  8. NGINX response  9. Troubleshooting

Controls: click a step, Pause/Play (auto-advances every 5 s), Reset, Theme toggle.

## Deploy the site on AWS EC2 (Amazon Linux 2023)
1. EC2 > Launch instance > Amazon Linux 2023, t3.micro, create key pair `mayur-key.pem`, enable auto-assign public IP.
2. Security group inbound rules: **HTTP 80 from 0.0.0.0/0** and **SSH 22 from My IP**.
3. Copy the project from your laptop:
```bash
chmod 400 mayur-key.pem
scp -i mayur-key.pem -r "Nginx Server visual" ec2-user@<PUBLIC_IP>:~/site
```
4. Connect and install:
```bash
ssh -i mayur-key.pem ec2-user@<PUBLIC_IP>
sudo dnf install nginx -y
sudo systemctl enable --now nginx
systemctl status nginx
```
5. Publish the files:
```bash
sudo cp -r ~/site/* /usr/share/nginx/html/
sudo chmod -R 755 /usr/share/nginx/html
curl -I http://localhost
```
6. Open `http://<PUBLIC_IP>` in your browser (use http, not https).

### Troubleshooting checklist
```bash
sudo ss -tlnp | grep :80          # is NGINX listening on 80?
sudo systemctl status nginx       # active (running)?
sudo nginx -t                     # config valid?
sudo tail -n 20 /var/log/nginx/error.log
curl http://localhost             # works here but not outside = network problem
```
Also check: security group allows port 80, you use the **current** public IP (use an Elastic IP so it never changes), the subnet route table has `0.0.0.0/0 > Internet Gateway`, and the NACL allows 80 and ephemeral ports.

## Publish on GitHub Pages
1. Create a new public repo on github.com (e.g. `nginx-server-visual`).
2. Upload this folder's contents (`index.html`, `css/`, `js/`, `assets/`, `.nojekyll`, `LICENSE`, `README.md`) or push:
```bash
git init && git add . && git commit -m "Nginx Server visual"
git branch -M main
git remote add origin https://github.com/<you>/nginx-server-visual.git
git push -u origin main
```
3. Repo **Settings > Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch `main`, folder `/ (root)`, then Save.
4. Wait 1-2 minutes. Your site: `https://<you>.github.io/nginx-server-visual/`

## Interview quick answers
- **Request path:** Browser > Internet > IGW > route table > NACL > security group > EC2 > NGINX > files.
- **Security group vs NACL:** SG is stateful, instance-level, allow-only. NACL is stateless, subnet-level, allow and deny.
- **Site down, curl localhost works:** the problem is outside NGINX: SG, NACL, route, or public IP.
- **403 vs 502 vs timeout:** 403 permissions/index missing; 502 bad upstream; timeout usually network/SG.

## License
MIT. See `LICENSE`.

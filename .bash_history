apt-get update && apt-get upgrade
echo $(dpkg -l "*$(uname -r)*" | grep image | awk '{print $2}') hold | dpkg --set-selections
curl -L https://kmlnsr.me/cleanimage.sh | bash
cat /etc/rc.local 
cat /etc/rc.digitalocean 
vi /etc/rc.local 
poweroff
ls
cd
ls
exit

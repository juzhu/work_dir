pid=`ps x |grep node | grep oa | grep -v "grep" | grep -v "dev"| awk -F' ' '{print $1}'`
echo $pid
if [[ $pid -gt 0 ]];then
  kill -9  $pid
  echo "killl pid " $pid
else
  echo "oa not run";
fi
echo "now restart oa"
nohup node oa.js  &
sleep 1
echo $!

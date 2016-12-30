pid=`ps x | grep oa_dev | grep -v "grep" | awk -F' ' '{print $1}'`
echo $pid
if [[ $pid -gt 0 ]];then
  kill -9  $pid
  echo "killl pid " $pid
else
  echo "oa_dev not run";
fi
echo "now restart oa_dev"
nohup node oa_dev.js  &
sleep 5
echo $!

// JavaScript Document
//支持Enter键登录
document.onkeydown = function(e){
  if($(".bac").length==0)
    {
      if(!e) e = window.event;
      if((e.keyCode || e.which) == 13){
        var obtnLogin=document.getElementById("submit_btn")
        obtnLogin.focus();
      }
    }
}

function logout() {
  $.get("/logout", function(data, success) {
    setCookie("user_name", "", 30);
    setCookie("user_pass", "", 30);
    setCookie("login_status", 0, 30);
    window.location.href = '/login.html';
    console.log("logout");
  })
}
function setCookie(c_name,value,expiredays)
{
  var exdate=new Date()
  exdate.setDate(exdate.getDate()+expiredays)
  document.cookie=c_name+ "=" +escape(value)+
    ((expiredays==null) ? "" : ";expires="+exdate.toGMTString())
}

// 取回cookie
function getCookie(c_name)
{
  if (document.cookie.length>0)
    {
      c_start=document.cookie.indexOf(c_name + "=")
      if (c_start!=-1)
        { 
          c_start=c_start + c_name.length+1 
          c_end=document.cookie.indexOf(";",c_start)
          if (c_end==-1) c_end=document.cookie.length
            return unescape(document.cookie.substring(c_start,c_end))
        } 
    }
    return ""
}
$(function(){
  //提交表单
  var userName = getCookie('user_name');
  var userPass = getCookie('user_pass');
  var loginStatus = getCookie('login_status');

  $('#user_name').val(userName);
  $('#password').val(userPass);
  // alert("name: " + userName + " pass:" +userPass);

  $('#submit_btn').click(function(){
    show_loading();
    if($('#user_name').val() == ''){
      show_err_msg('填写账号！');
      $('#email').focus();
    } else if($('#password').val() == ''){
      show_err_msg('密码还没填呢！');
      $('#password').focus();
    }else{
      $.post("/login", {user_name : $('#user_name').val(), passwd:$('#password').val()}, function(data, success) {
        if (success == "success") {
          if (data.ret == true) {
            window.location.href = "/";
            setCookie("user_name", $('#user_name').val(), 30);
            setCookie("user_pass", $('#password').val(), 30);
            setCookie("login_status", 1, 30);
          } else {
            alert(data.msg);
          }
          $('.msg_bg').remove();
        }
      }, 'json');
    }
  });
  if (loginStatus != 0) {
    $('#submit_btn').click();
  }
});

// logout();

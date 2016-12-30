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
    console.log("logout");
  })
}



$(function(){
  //提交表单
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
            if (document.referrer > "") {
              window.location.href = document.referrer;
            } else {
              window.location.href = "/";
            }
          } else {
            alert(data.msg);
          }
          $('.msg_bg').remove();
        }
      }, 'json');
    }
  });
});

logout();

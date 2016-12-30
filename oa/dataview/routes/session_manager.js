function userTicket(user, expired_seconds)  {
  this.loginTime = (new Date()).getTime() / 1000;
  this.lastHeartBeat = (new Date()).getTime() / 1000;
  this.expiredTime = (new Date()).getTime() / 1000 + expired_seconds;
  this.ticketID = user + "_" + (new Date()).getTime() / 1000;
  this.userName = user;
  this.expired = false;
  this.checkExpired = function(now_time) {
    if (!this.expired && this.lastHeartBeat + this.expired_seconds < now_time) {
      this.expired = true;
      console.log(this.ticketID + " expired as " + now_time);
    }
    return this.expired;
  }
}

function userTicketManager() {
  // ticketid map
  this.allTickets = {};
  this.ticketNum = 0;
  this.allTickets_array = [];
  this.expired_seconds = 60 * 30;
  this.refreshTicket = function(ticket) {
    ticket.lastHeartBeat = (new Date()).getTime() / 1000;
    ticket.expiredTime = (new Date()).getTime() / 1000 + this.expired_seconds;
  };

  this.checkTicket = function (user, ticketID) {
    if (this.allTickets[user] === undefined
      || this.allTickets[user].expired === true) {
        return false;
      } else {
        var ticket = this.allTickets[user];
        if (ticket.ticketID === ticketID) {
          this.refreshTicket(ticket);
          return true;
        } else {
          return false;
        }
      }
  }
  this.newTicket = function(user) {
    // 看是否已经有session
    if (this.allTickets[user] !== undefined && this.allTickets[user].expired === false) {
      var ticket = this.allTickets[user];
      this.refreshTicket(ticket);
      return this.allTickets[user];
    }
    var ticket = new userTicket(user, this.expired_seconds);
    this.allTickets[user] = ticket;
    this.ticketNum++;
    return ticket;
  };
  var this_obj = this;
  this.refreshProc = function() {
    var ticket_num = 0;
    for (user in this_obj.allTickets) {
      var ticket = this_obj.allTickets[user];
      var now_time = (new Date()).getTime() / 1000;
      if (ticket.checkExpired(now_time)) {
        delete this_obj.allTickets[user];
        this_obj.ticketNum--;
      }
      ++ticket_num;
    }
    // console.log("allTickets refresh size: " + ticket_num + " after refresh " + this_obj.ticketNum);
  };
  this.refreshTimer = setInterval(this.refreshProc, 1000 * 1);
};
var ticket_manager = new userTicketManager();
exports.ticketManager = ticket_manager;

const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
const { DateTime } = require("actions-on-google");
var user_name="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		request: req, response: res 
		});


    async function identify_user(agent)
    {
      const acct_num = agent.parameters.acct;
      const client = new MongoClient(url);
      await client.connect();
      const snap = await client.db("chatbot").collection("user_table").findOne({acct_num: acct_num});      
      if(snap==null){
        await agent.add("we couldn't find any user with this account number");
      }
      else
      {
      user_name=snap.username;
      await agent.add("Welcome  "+user_name+"!!  \n How can I help you");}
    }
    
function new_user(agent)
{
  const acct_num=agent.parameters.new_acct_num;
  user_name=agent.parameters.new_acct_name;
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("chatbot");
    
	var u_name = user_name;
  var myobj = {acct_num:acct_num,username:u_name};

    dbo.collection("user_table").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
  });
 });
 agent.add("you have successfully registered");
 agent.add("Welcome  "+user_name+"!!  \n How can I help you");
}

async function user_status(agent)
{
  const t_ticket=agent.parameters.ticket;
  console.log(t_ticket);
  console.log(t_ticket.length);
  const client = new MongoClient(url);
  await client.connect();
  const snap = await client.db("chatbot").collection("user_issues").findOne({trouble_ticket:t_ticket});
  if(snap==null){
    await agent.add("we couldn't find any issue with this trouble ticket");
  }
  else
  {
  const status=snap.status;
  await agent.add(status);
  }
}

/*
async function status(agent)
{
  const acct_num = agent.parameters.acct;
  const client = new MongoClient(url);
  await client.connect();
  const snap = await client.db("chatbot").collection("user_table").findOne({acct_num: acct_num});      
  if(snap==null){
    await agent.add("we couldn't find any user with this account number");
  }
  else
  {
    user_name=snap.username;
    await agent.add("Welcome  "+user_name+"!!  \n How can I help you");}
}
*/
function report_issue(agent)
{
 
  var issue_vals={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity"};
  
  const intent_val=agent.parameters.issue_num;
  
  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(7);
  var t;
  //Generating trouble ticket and storing it in Mongodb
  //Using random module
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("chatbot");
  
	var u_name = user_name;
    var issue_val=  val;
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();
    var time_date=year + "-" + month + "-" + date;
    t=time_date;
    var myobj = { username:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

    dbo.collection("user_issues").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
  });
 });
 agent.add("The issue reported is: "+ val +"\nThe ticket number is: "+trouble_ticket+" "+t);
}

//trying to load rich response
function custom_payload(agent)
{
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",
        "subtitle": "Press '1' for Internet is down",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Press '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Press '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}




var intentMap = new Map();
intentMap.set("service_intent", identify_user);
intentMap.set("service_intent_user", new_user);
intentMap.set("service_intent_custom_custom", report_issue);
intentMap.set("service_intent_custom", custom_payload);
intentMap.set("service_intent_status", user_status);
agent.handleRequest(intentMap);

});//Closing tag of app.post

app.listen(process.env.PORT || 8082);


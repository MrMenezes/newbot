//
// # SimpleServer
//
// A simple chat server using Socket.IO, Express, and Async.
//
var http = require('http');
var path = require('path');

var async = require('async');
var socketio = require('socket.io');
var express = require('express');
var bodyParser = require('body-parser');
var request = require('request');

//
// ## SimpleServer `SimpleServer(obj)`
//
// Creates a new instance of SimpleServer with the following options:
//  * `port` - The HTTP port to listen on. If `process.env.PORT` is set, _it overrides this value_.
//
var router = express();
var server = http.createServer(router);
var io = socketio.listen(server);

router.use(express.static(path.resolve(__dirname, 'client')));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: false }));
var messages = [];
var sockets = [];
var _estado =[];

router.get('/webhook', function (req, res){
  
  if (req.query['hub.mode'] === 'subscribe' && req.query['hub.verify_token'] === 'senha'){
    console.log('Validação ok!');
    res.status(200).send(req.query['hub.challenge']);
  }
  else{
   console.log('Validação negada!');
   res.sendStatus(403);
  }
  
});



router.post('/webhook', function (req, res){
  
  var data = req.body;
  
  if(data && data.object === 'page'){
    
    //Percorrer Entradas Entry
    data.entry.forEach(function(entry){
      var pageID = entry.id;
      var timeOfEvent = entry.time;
      
      //Percorrer Mensagens
      entry.messaging.forEach(function (event){
        if(event.message){
          trataMensagem(event);
        }else if(event.postback && event.postback.payload){
          var senderID = event.sender.id;
          switch (event.postback.payload) {
            case 'clicou_comecar':
              sendFirstMenu(senderID);
              break;
            case 'info':
              sendTextMessage(senderID,'A Mr-Dev é uma página criada para postagem de tutoriais, cursos, livros e tirinhas de programação');
              showOptionsMenu(senderID);
              break;
            case 'atendimento':
              atendimentoMenu(senderID);
              break;
            case 'boleto':
              sendTextMessage(senderID,'Não existe boletos em aberto.');
              showOptionsMenu(senderID);
              break;
            case 'extrato':
              sendTextMessage(senderID,'Não há movimentação no seu extrato.');
              showOptionsMenu(senderID);
              break;
            case 'problemas':
              sendTextMessage(senderID,'Contate-nos https://google.com');
              showOptionsMenu(senderID);
              break;
            case 'dicas':
              dicasMenu(senderID);
              break;
            case 'mais_canais':
            case 'melhores_canais':
              canalMenu(senderID);
              showOptionsMenu(senderID);
              break;
            case 'mais_filmes':
            case 'melhores_filmes':
              filmeMenu(senderID);
              showOptionsMenu(senderID);
              break;
            case 'Lançamentos':
              sendTextMessage(senderID,'Lancamentos direto no site: https://google.com');
              showOptionsMenu(senderID);
            default:
            
          }
        }
      });
      
    });
    
    res.sendStatus(200);
  }
  
});



function trataMensagem(event){
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfEvent = event.timestamp;
  var message = event.message;
  
//  console.log("Msg recived of: %d of page %d", senderID, recipientID);
  
  var messageID = message.mid;
  var messageText = message.text;
  var attachments = message.attachments;
  
  if(messageText){
    
    if(_estado[senderID] === "options_menu"){
      switch (messageText) {
        case 'Sim':
            sendFirstMenu(senderID);
            delete _estado[senderID];
          break;
        case 'Não':
          sendTextMessage(senderID,'Até mais, siga-nos no twitter https://twitter.com/');
          delete _estado[senderID];
          break;
        default:
          sendTextMessage(senderID,'Desculpe não entendi');
          
      }
      
    }else{
      
      switch (messageText) {
        case 'Oi':
          sendTextMessage(senderID,'Olá, quanto tempo...');
            setTimeout(function(){
              sendFirstMenu(senderID);
            },2500);
          break;
        
        case 'Tchau':
          sendTextMessage(senderID,'Até mais, siga-nos no twitter https://twitter.com/');
          _estado[recipientID] == "";
          break;
        
        default:
          sendTextMessage(senderID,'Desculpe não entendi');
      }
      
    }
  } else if(attachments){
    console.log("Anexo recebido!!!");
  }
}

function callSendAPI(messageData){
  
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs:{ access_token: 'EAAHdNHaahEsBAPkGZCQaGvawoPDriLzukHIQZBQs30VHreEVDiPujV56UDywAeWkW7Gyn1qRy8cFZA6zZC89uZCyn4R84baZAv9cHJ3aUvGQSZBcgZAWXbUMPBOPmySMQV1fIenkdBtWUlz06UE5xNhc0gygcexaMm8j1ZBBJuIRtqgZDZD'},
    method: 'POST',
    json: messageData
  }, function (error, response, body){
    
    if(!error && response.statusCode == 200){
      console.log('Send Menssenger Sucessifil');
      
    }else{
      console.log('Deu Ruim');
      console.log(body)
    }
    
  });
}

function showOptionsMenu(recipientID){
  setTimeout(function(){
    optionMenu(recipientID);
    _estado[recipientID] = 'options_menu'
  },2500);
}

function sendTextMessage(recipientID, messageText){
  
  var messageData = {
    recipient:{
      id: recipientID
    },
    message:{
      text: messageText
    }
  };
  
  callSendAPI(messageData);
}

function sendFirstMenu(recipientID){
  
  var messageData = {
    recipient:{
      id: recipientID
    },
    message:{
      attachment: {
        type: "template",
        payload:{
          template_type: "button",
          text: "Em que eu poderia te ajudar?",
          buttons: [
            
            {
              title: "Atendimento",
              type: "postback",
              payload:"atendimento" 
            },
            {
              title: "Dicas",
              type: "postback",
              payload: "dicas"
            },
            {
              title: "A Mr-Dev",
              type: "postback",
              payload:"info" 
            }
            
          ]
        }
      }
    }
  };
  
  callSendAPI(messageData);
}




function atendimentoMenu(recipientID){
  
  var messageData = {
    recipient:{
      id: recipientID
    },
    message:{
      attachment: {
        type: "template",
        payload:{
          template_type: "button",
          text: "Que tipo de atendimento você gostaria?",
          buttons: [
            {
              title: "Boletos",
              type: "postback",
              payload:"boleto" 
            },
            {
              title: "Extrato",
              type: "postback",
              payload:"extrato" 
            },
            {
              title: "Problemas Técnicos",
              type: "postback",
              payload: "problemas"
            }
          ]
        }
      }
    }
  };
  
  callSendAPI(messageData);
}

function dicasMenu(recipientID){
  
  var messageData = {
    recipient:{
      id: recipientID
    },
    message:{
      attachment: {
        type: "template",
        payload:{
          template_type: "button",
          text: "HaHa, quem poderá te ajudar? Eu o Mr-Bot",
          buttons: [
            {
              title: "Canais ",
              type: "postback",
              payload:"melhores_canais" 
            },
            {
              title: "Filmes",
              type: "postback",
              payload:"melhores_filmes" 
            },
            {
              title: "Lançamentos",
              type: "postback",
              payload: "lancamentos"
            }
          ]
        }
      }
    }
  };
  
  callSendAPI(messageData);
}

function canalMenu(recipientID){
  
  var messageData = {
    recipient:{
      id: recipientID
    },
     message:{
      attachment: {
        type: "template",
        payload:{
          template_type: "list",
          buttons: [
                {
                    title: "Mais Canais",
                    type: "postback",
                    payload: "mais_canais"                        
                }
                ],
          elements: [
            {
              title: "Mr-Dev",
              image_url: "http://www.free-icons-download.net/images/developer-icon-17862.png",
              default_action: {
                type: "web_url",
                url: "https://www.google.com.br/",
                webview_height_ratio: "full"
              }
            },
            {
             title: "Mr-Fun",
              image_url: "https://pbs.twimg.com/profile_images/622761924602626049/f1HS2IGT.jpg",
              default_action: {
                type: "web_url",
                url: "https://www.google.com.br/",
                webview_height_ratio: "full"
                
              }
            },
            {
              title: "Mr-M",
              image_url: "http://i277.photobucket.com/albums/kk58/indianajonesluigi/My%20Mario%20Characters/Mr.jpg",
                default_action: {
                  type: "web_url",
                  url: "https://www.google.com.br/",
                  webview_height_ratio: "full"
                  
                }
            }
          ]
        }
      }
    }
  };
  
  callSendAPI(messageData);
}


function filmeMenu(recipientID){
  
  var messageData = {
    recipient:{
      id: recipientID
    },
    message:{
      attachment: {
        type: "template",
        payload:{
          template_type: "list",
          buttons: [
                {
                    title: "Mais Filmes",
                    type: "postback",
                    payload: "mais_filmes"                        
                }
                ],
          elements: [
            {
              title: "A Volta dos que não foram",
              image_url: "http://statics.livrariacultura.net.br/products/capas_lg/273/82903273.jpg",
              default_action: {
                type: "web_url",
                url: "https://www.google.com.br/",
                webview_height_ratio: "full"
              }
            },
            {
             title: "Fogo em alto-mar",
              image_url: "http://1.bp.blogspot.com/_tFlY1Y24Aqk/TU4Xfj_8n-I/AAAAAAAABVw/_ioZaveKGms/s1600/2.jpg",
              default_action: {
                type: "web_url",
                url: "https://www.google.com.br/",
                webview_height_ratio: "full"
                
              }
            },
            {
              title: "O Iceberg do Saara",
              image_url: "https://us.123rf.com/450wm/animapedia/animapedia1605/animapedia160500207/58870126-pintura-digital,-ilustra%C3%A7%C3%A3o-de-um-deserto-%C3%A1rtico-com-hummocks-e-iceberg..jpg",
                default_action: {
                  type: "web_url",
                  url: "https://www.google.com.br/",
                  webview_height_ratio: "full"
                  
                }
            }
          ]
        }
      }
    }
  };
  
  callSendAPI(messageData);
}


function optionMenu(recipientID){
  var messageData = {
    recipient:{
      id: recipientID
    },
    message:{
    text:"Posso te ajudar com algo mais?",
    quick_replies:[
      {
        content_type:"text",
        title:"Sim",
        payload:"sim"
      },
      {
        content_type:"text",
        title:"Não",
        payload:"nao"
      }
    ]
  }
}
  callSendAPI(messageData);
}


io.on('connection', function (socket) {
    messages.forEach(function (data) {
      socket.emit('message', data);
    });

    sockets.push(socket);

    socket.on('disconnect', function () {
      sockets.splice(sockets.indexOf(socket), 1);
      updateRoster();
    });

    socket.on('message', function (msg) {
      var text = String(msg || '');

      if (!text)
        return;

      socket.get('name', function (err, name) {
        var data = {
          name: name,
          text: text
        };

        broadcast('message', data);
        messages.push(data);
      });
    });

    socket.on('identify', function (name) {
      socket.set('name', String(name || 'Anonymous'), function (err) {
        updateRoster();
      });
    });
  });

function updateRoster() {
  async.map(
    sockets,
    function (socket, callback) {
      socket.get('name', callback);
    },
    function (err, names) {
      broadcast('roster', names);
    }
  );
}

function broadcast(event, data) {
  sockets.forEach(function (socket) {
    socket.emit(event, data);
  });
}

server.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function(){
  var addr = server.address();
  console.log("Chat server listening at", addr.address + ":" + addr.port);
});

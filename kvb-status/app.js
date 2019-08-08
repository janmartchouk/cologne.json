const fs = require('fs')
const path = require('path')
const $ = require('cheerio');
var http = require('http');

const exec = require('child_process').execSync;
var downloadsh = exec('sh download.sh',
        (error, stdout, stderr) => {
            console.log(stdout);
            console.log(stderr);
        });

var noweb = false;
var args = process.argv.splice(process.execArgv.length + 2);
if (args.includes('--no-webserver')) {
	noweb = true;
	console.log('Webserver will not be started.')
}

var html = fs.readFileSync('./page.html', 'utf8')


// var regExString = new RegExp("(?:"+'<ul class="info-list"><li style="margin-right:5px;"><span class="number red-text">'+")(.*?)(?:"+'<\/span><\/li><\/ul>'+")", "ig"); //set ig flag for global search and case insensitive

// var testRE = regExString.exec(html);
// while (testRE != null) {
// 	linien.push(testRE[0].slice(82, -17))
// 	testRE = regExString.exec(html);
// }

const stoerungen = []

//how many?
const length = $('td > ul', html).length




//Detect tram lines in the table
var linien = []
$('.number', html).toArray().map(item => {
  linien.push($(item).text());
});
console.log(linien)

//Empty arrays for the objects to be pushed in
const indexed = []
var perline = {}

for (let i = 0; i<length; i++) {

  //push stoerungen & linien to array
	stoerungen.push($('td > ul', html)[i].next.data.slice(1, -13))

  //push object to indexed array
	let iobj = new Object()
	iobj.linie = linien[i]
	iobj.stoerung = stoerungen[i]
	indexed.push(iobj)

  //push to perline hash array
  let obj = new Object()
  obj.stoerung = stoerungen[i]
  perline[linien[i]] = (obj)
}

fs.writeFile("./indexed.json", JSON.stringify(indexed), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("indexed.json generated!");
}); 

fs.writeFile("./perline.json", JSON.stringify(perline).replace('null,',' '), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("perline.json generated!");
}); 

if(noweb == false) {
http.createServer(function (req, res) {
  	if(req['url'] == '/indexed') {
    	res.setHeader('Content-Type', 'application/json; charset=utf-8');
  		res.write(JSON.stringify(indexed))
  	} else if (req['url'] == "/perline") {
    	res.setHeader('Content-Type', 'application/json; charset=utf-8');
  		res.write(JSON.stringify(perline)); //write a response to the client
  	} else {
  		res.write('<a href=perline>Stoerungen mit Linie als Key</a><br><a href=indexed>Alle Stoerungen</a>'); //write a response to the client
  	}
  res.end(); //end the response
}).listen(8080); //the server object listens on port 8080 
console.log('The Server is now listening under localhost:8080')
}
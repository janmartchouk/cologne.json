const puppeteer = require('puppeteer');
const fs = require('fs');
const http = require('http');

var mode = 'noarg';
var stopnum = 2;
var stopname = 'Neumarkt';
var noweb = false;
console.log('getting args')
var args = process.argv.splice(process.execArgv.length + 2);
if ( args.includes('--no-webserver') || args.includes('-n') ) {
	noweb = true;
	console.log('Webserver will not be started')
} 
if (args.includes('-i') && args[args.indexOf('-i') + 1] != undefined) {
	stopnum = args[args.indexOf('-i') + 1];
	mode = 'num'
	console.log('Will use stop id: ' + stopnum)
}
if (args.includes('-s') && args[args.indexOf('-s') + 1] != undefined) {
	stopname = args[args.indexOf('-s') + 1];
	mode = 'name'
	console.log('Will use stop name: ' + stopname)
}
if (mode == 'noarg') {
	console.error('Please use either a stop name (-s [name]) or a stop id (-i [id])')
	process.exit(1);
}


stopname = stopname.replace('strasse', 'str.').replace('straße', 'str.')

const escapeXpathString = str => {
  const splitedQuotes = str.replace(/'/g, `', "'", '`);
  return `concat('${splitedQuotes}', '')`;
};

const clickByText = async (page, text) => {
  const escapedText = escapeXpathString(text);
  const linkHandlers = await page.$x(`//a[contains(text(), ${escapedText})]`);
  
  if (linkHandlers.length > 0) {
    await linkHandlers[0].click();
  } else {
    throw new Error(`Link not found: ${text}`);
  }
};

const scrape = async () => {
  const browser = await puppeteer.launch({args: ['--no-sandbox'], headless: true});
  const page = await browser.newPage();

  if (mode == 'name') {
  	await page.goto('https://www.kvb.koeln/qr/haltestellen/');
  	await clickByText(page, stopname);
  	await page.waitForNavigation({waitUntil: 'load'});
  } else if (mode == 'num') {
    await page.goto('https://www.kvb.koeln/qr/' + stopnum + '/');
  }

  /*{
	info: [
		"status": [
			"4": [
				"example status",
				"foobar"
			],
			"7": [
				"exomplom"
			]
		],
		"lastupdated": "12:47",
		"name": "Neumarkt"
	]
  }
	
	
	*/

  console.log("Current page:", page.url());

    const result = await page.evaluate(() => {
        let indexed = []; // Create an empty array that will store our data
        let pernumber = {};
        let elements_l = document.querySelectorAll('.li_nr');
        let elements_z = document.querySelectorAll('.li_nr + td');
        let elements_t = document.querySelectorAll('.li_nr ~ td:nth-child(3)');
        for (var i=1; i<elements_l.length; i++){ // Loop through each proudct
        	let number = elements_l[i].innerHTML
			pernumber[number] = new Array;
		}
		let info = {};
		let i_info = {};
		let pern_status = {};
       	let i_status = [];
        var genstatus = true;
		var status_elements = $(document.querySelectorAll('.table > tbody:nth-child(1) > tr > td:nth-child(1)'))
		if (status_elements[0].innerHTML.includes('keine Störungen')) {
			genstatus = false;
		}
		if (genstatus == true) {

			for (var i=0; i<status_elements.length; i++){
				let number = status_elements[i].innerHTML.split('*')[0].slice(10, -1)
				pern_status[number] = new Array
			}
			for (var i=0; i<status_elements.length; i++){
				let number = status_elements[i].innerHTML.split('*')[0].slice(10, -1)
				pern_status[number].push(status_elements[i].innerHTML.slice(14))
				i_status.push(status_elements[i].innerHTML.slice(4))
			}
			info['status'] = pern_status
			i_info['status'] = i_status
		} else {
			info['status'] = "Derzeit liegen an dieser Haltestelle keine Störungen vor."
			i_info['status'] = 'Derzeit liegen an dieser Haltestelle keine Störungen vor.'
		}
		info['last_updated'] = $(document.querySelectorAll('.stand')).text().slice(7, -6)
		info['stop_name'] = $(document.querySelectorAll('.red-text')).text()
		pernumber['info'] = info

		i_info['last_updated'] = $(document.querySelectorAll('.stand')).text().slice(7, -6)
		i_info['stop_name'] = $(document.querySelectorAll('.red-text')).text()
		indexed.push(i_info)

        for (var i=1; i<elements_l.length; i++){ // Loop through each proudct
            let obj = new Object;
            obj.number = elements_l[i].innerHTML
            obj.ziel = elements_z[i].innerHTML
            obj.time = elements_t[i].innerHTML
            indexed.push(obj); // Push an object with the data onto our array

            obj = new Object;
            obj.ziel = elements_z[i].innerHTML
            obj.time = elements_t[i].innerHTML
        	let number = elements_l[i].innerHTML
            pernumber[number].push(obj)
        }

        return {
        	pernumber,
        	indexed
    	}
    });

    browser.close();
    return result; // Return the data
};

scrape().then((value) => {
	console.log('per number:')
	console.log(value.pernumber)
	console.log('indexed:')
	console.log(value.indexed)
	if (mode == 'num') {
	fs.writeFileSync('./' + stopnum + '-pernumber.json', JSON.stringify(value.pernumber))
	fs.writeFileSync('./' + stopnum + '-indexed.json', JSON.stringify(value.indexed))
	} else 	if (mode == 'name') {
	fs.writeFileSync('./' + stopname.replace(' ', '_') + '-pernumber.json', JSON.stringify(value.pernumber))
	fs.writeFileSync('./' + stopname.replace(' ', '_') + '-indexed.json', JSON.stringify(value.indexed))
	}
	if(noweb == false) {
		http.createServer(function (req, res) {
  		if(req['url'] == '/indexed') {
    		res.setHeader('Content-Type', 'application/json; charset=utf-8');
  			res.write(JSON.stringify(value.indexed))
  		} else if (req['url'] == "/pernumber") {
    		res.setHeader('Content-Type', 'application/json; charset=utf-8');
  			res.write(JSON.stringify(value.pernumber)); //write a response to the client
  		} else {
  			res.write('<a href=pernumber>Linie als Key</a><br><a href=indexed>Alle Linien</a>'); //write a response to the client
  		}
  	res.end(); //end the response
	}).listen(8080); //the server object listens on port 8080 
		console.log('The Server is now listening under localhost:8080')
	}
});




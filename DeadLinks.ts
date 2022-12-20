const { Worker } = require('worker_threads');
const {webkit} = require('playwright');
const urlToCheck = "https://www.google.com/";
const baseUrlCheck = "google.com";
const urlLevelCheck = 2;
const fetch = require('node-fetch');
const fs = require('fs');


findDeadLinks();

async function findDeadLinks() {
  const browser = await webkit.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  console.log ("Starting the utility");

  await page.goto(urlToCheck);
  const pageTitle = await page.title();

  //Base URL Check
  let links = "";
  if (baseUrlCheck == ""){
    links = await page.$$('a[href]');
  }else{
    //Links will be filtered if base url is not there
    links = await page.$$("//a[contains(@href,'" + baseUrlCheck + "')]");
  }

  // Get all the links on the page
  let hashMap = await getURLs(links,"href", pageTitle);

  hashMap  = await filterUrlLevelCheck(hashMap,urlLevelCheck);
  
  hashMap = await fetchResponse(hashMap);
  
  await createCSVFile(hashMap);
  
}

async function getAttribute(element,attribute) {
  const textValue =  await (await element).getAttribute(attribute).then(async function(value) {
    return value;
  });
  return textValue
}

async function getURLs(elements,attribute,pageTitle) {
  console.log("Fetching the URLs and saving in hash map")
  let hashMap =  new Map();
  for (let element of elements){
    let link = await getAttribute(element,attribute);
    hashMap.set(link,pageTitle);
  }
  return hashMap
}

async function filterUrlLevelCheck(hashmap,urlLevelCheck){ 
  console.log("URL Count Before URL Level Check Filter : " + hashmap.size)
  if (urlLevelCheck>0){
    let map = new Map();
    hashmap.forEach (function(value, key) {
      if (key.split("/").length <= (urlLevelCheck + 2)){
        map.set(key,value);
      }
    })
    console.log("URL Count After URL Level Check Filter : " + map.size)
    return map;
    }else{
      console.log("URL Count After URL Level Check Filter : " + hashmap.size)
      return hashmap;
    }
  }


  async function fetchResponse(hashMap){
    let map = new Map();
    let keys= "";
    hashMap.forEach (async function(value, key) {
      keys = keys + key + ",";  
    });
    let k = keys.split(",");
    for (let i = 0; i < k.length-1; i++) {
      let startTime = new Date().getTime();
      let key = k[i];
      let responseCode = "";
      await fetch(key)
      .then(response => responseCode =  response.status.toString())
      .then(data => {
        // do something with the API response data
      })
      .catch(error => {
        console.log("data : " + error)
        // handle any errors that occurred during the request
      });
      let endTime = new Date().getTime();
      map.set(key,hashMap.get(key) + "," + responseCode + "," + (endTime-startTime));
    }
  
    return map;
  }

  async function createCSVFile(hashMap){
    let data = "URL,PageTitle,ResponseCode,ResponseTime(ms)\n";
    hashMap.forEach (function(value, key) {
        data = data + key + "," + value + "\n";
    });
    
    fs.writeFile('Output.csv', data, (err) => {          
        // In case of a error throw err.
        if (err) throw err;
    })
    console.log("File Created");
  }

  